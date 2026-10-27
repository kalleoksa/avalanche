import { useEffect, useState } from "react";

// Example: daily weather per location, client-side Open-Meteo fetch.
// Later this moves to the cron-built latest.json (PLAN.md section 6).
// Avalanche areas use FMI summit station positions (fmisid), Ylläs-Levi the Ylläs summit.
// Summit stations don't measure snow; snowStation is the nearest FMI station that does.
const LOCATIONS = [
  { name: "Kilpisjärvi (Saana)", lat: 69.0428, lon: 20.8509, snowStation: { id: 102016, name: "Kilpisjärvi kyläkeskus" } },
  { name: "Ounas-Pallas (Laukukero)", lat: 68.0628, lon: 24.0333, snowStation: { id: 101987, name: "Kenttärova" } },
  { name: "Ylläs-Levi (Ylläs)", lat: 67.5644, lon: 24.2244, snowStation: { id: 101990, name: "Kittilä Pakatti" } },
  { name: "Saariselkä (Kaunispää)", lat: 68.4340, lon: 27.4451, snowStation: { id: 102005, name: "Saariselkä matkailukeskus" } },
  { name: "Luosto-Pyhä (Luosto)", lat: 67.1391, lon: 26.8969, snowStation: { id: 101932, name: "Sodankylä Tähtelä" } },
  { name: "Ruka (Rukatunturi)", lat: 66.1661, lon: 29.1518, snowStation: { id: 101887, name: "Kuusamo Kiutaköngäs" } },
  { name: "Talma Ski", lat: 60.398, lon: 25.175, snowStation: { id: 101004, name: "Helsinki Kumpula" } },
];
const WIND_DRIFT_MS = 6; // FMI: 6–7 m/s moves light dry snow

const DAILY = "snowfall_sum,temperature_2m_min,temperature_2m_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant";
const urlFor = ({ lat, lon }) => `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
  `&daily=${DAILY}&past_days=3&forecast_days=3&wind_speed_unit=ms&timezone=Europe%2FHelsinki`;

// FMI snow depth (cm), hourly for the past 4 days. -1 = no snow cover, NaN = no reading.
const snowUrlFor = (id) => {
  const start = new Date(Date.now() - 4 * 864e5).toISOString().slice(0, 13) + ":00:00Z";
  return "https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature" +
    `&storedquery_id=fmi::observations::weather::simple&fmisid=${id}&parameters=snow_aws&timestep=60&starttime=${start}`;
};
const localDate = (d) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Helsinki" });

// Last valid reading per local date: { "2026-10-27": 12, ... }
const parseSnow = (xml) => {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const out = {};
  for (const el of doc.getElementsByTagName("BsWfs:BsWfsElement")) {
    const v = parseFloat(el.getElementsByTagName("BsWfs:ParameterValue")[0]?.textContent);
    if (Number.isNaN(v)) continue;
    out[localDate(new Date(el.getElementsByTagName("BsWfs:Time")[0].textContent))] = Math.max(v, 0);
  }
  return out;
};

const loadIdx = () => { try { return Math.min(+localStorage.getItem("weatherLoc") || 0, LOCATIONS.length - 1); } catch { return 0; } };

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const compass = (deg) => DIRS[Math.round(deg / 45) % 8];
const fmt = (v, d = 0) => (v == null ? "–" : v.toFixed(d));

export default function Weather({ w, lang }) {
  const [idx, setIdx] = useState(loadIdx);
  const [data, setData] = useState(null);
  const [elevation, setElevation] = useState(null);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [depth, setDepth] = useState({});
  const loc = LOCATIONS[idx];

  useEffect(() => {
    let cancelled = false;
    setData(null); setError(null);
    try { localStorage.setItem("weatherLoc", idx); } catch {}
    fetch(urlFor(loc))
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(j => { if (!cancelled) { setData(j.daily); setElevation(j.elevation); setFetchedAt(new Date()); } })
      .catch(e => { if (!cancelled) setError(String(e)); });
    setDepth({});
    fetch(snowUrlFor(loc.snowStation.id))
      .then(r => (r.ok ? r.text() : Promise.reject(r.status)))
      .then(x => { if (!cancelled) setDepth(parseSnow(x)); })
      .catch(() => {}); // column shows "–"
    return () => { cancelled = true; };
  }, [idx]);

  const today = localDate(new Date());
  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  const days = data ? data.time.map((t, i) => {
    const snow = data.snowfall_sum[i];
    const tMax = data.temperature_2m_max[i];
    const wind = data.wind_speed_10m_max[i];
    return {
      date: t,
      label: t === today ? w.today : new Date(t).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" }),
      past: t < today,
      snow, depth: depth[t], tMin: data.temperature_2m_min[i], tMax, wind,
      gust: data.wind_gusts_10m_max[i],
      dir: data.wind_direction_10m_dominant[i],
      drift: wind != null && tMax != null && wind >= WIND_DRIFT_MS && tMax < 0,
    };
  }) : [];

  const cell = { padding: "7px 4px", textAlign: "right", fontFamily: "monospace", fontSize: 12 };
  const head = { ...cell, fontFamily: "inherit", fontSize: 10, color: "#888", fontWeight: 700, borderBottom: "1.5px solid #1c1c1c" };

  return (
    <>
      <select value={idx} onChange={e => setIdx(+e.target.value)} style={{
        width: "100%", padding: "8px 10px", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
        color: "#1c1c1c", background: "transparent", border: "1.5px solid #1c1c1c", borderRadius: 4,
      }}>
        {LOCATIONS.map((l, i) => <option key={l.name} value={i}>{l.name}</option>)}
      </select>
      <p style={{ fontSize: 11, color: "#aaa", margin: "6px 0 16px", fontStyle: "italic" }}>
        {w.intro}{data && elevation != null && <> {w.elevation} {Math.round(elevation)} m.</>}
      </p>

      {error && <div style={{ fontSize: 12, color: "#c0392b" }}>{w.error} ({error})</div>}
      {!data && !error && <div style={{ fontSize: 12, color: "#aaa" }}>{w.loading}</div>}

      {data && (
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#1c1c1c" }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: "left" }}>{w.day}</th>
              <th style={head}>{w.snow}<br />cm</th>
              <th style={head}>{w.depth}<br />cm</th>
              <th style={head}>{w.temp}<br />°C</th>
              <th style={head}>{w.wind}<br />m/s</th>
            </tr>
          </thead>
          <tbody>
            {days.map(d => (
              <tr key={d.date} style={{
                borderBottom: "1px solid #d5cfc3",
                background: d.date === today ? "#ebe5d8" : "transparent",
                opacity: d.past ? 0.75 : 1,
              }}>
                <td style={{ ...cell, textAlign: "left", fontFamily: "inherit", fontWeight: d.date === today ? 700 : 400 }}>{d.label}</td>
                <td style={{ ...cell, fontWeight: d.snow > 0 ? 700 : 400 }}>{fmt(d.snow, 1)}</td>
                <td style={cell}>{fmt(d.depth)}</td>
                <td style={cell}>{fmt(d.tMin)} / {fmt(d.tMax)}</td>
                <td style={{ ...cell, color: d.drift ? "#c0392b" : "inherit", fontWeight: d.drift ? 700 : 400 }}>
                  {fmt(d.wind)} <span style={{ opacity: 0.55 }}>({fmt(d.gust)})</span> {d.dir != null ? compass(d.dir) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {days.some(d => d.drift) && (
        <p style={{ fontSize: 12, color: "#c0392b", marginTop: 10, lineHeight: 1.5 }}>
          <strong style={{ fontFamily: "monospace" }}>■</strong> {w.driftNote}
        </p>
      )}

      <div style={{ fontSize: 11, color: "#888", marginTop: 14, lineHeight: 1.6 }}>
        <div>{w.legend}</div>
        {fetchedAt && <div>{w.fetched} {fetchedAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} · {w.model}</div>}
        <div>{w.source} <a href="https://open-meteo.com/" style={{ color: "#888" }}>Open-Meteo.com</a> (CC BY 4.0)</div>
        <div>{w.depthSource} {loc.snowStation.name}. <a href="https://www.ilmatieteenlaitos.fi/avoin-data" style={{ color: "#888" }}>{w.fmiCredit}</a> (CC BY 4.0)</div>
        <div>{w.full} <a href="https://tunturisaa.fi/" style={{ color: "#888" }}>tunturisaa.fi</a></div>
      </div>
    </>
  );
}
