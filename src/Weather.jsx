import { Fragment, useEffect, useState } from "react";

// Example: weather per location, fetched in the browser.
// Later this moves to the cron-built latest.json (PLAN.md section 6).
// Past days and new snow: Open-Meteo. Today onward, wind and temperature: FMI HARMONIE
// at summit height; fmiHeight = summit elevation − HARMONIE terrain height (GeopHeight).
// Avalanche areas use FMI summit station positions, Ylläs-Levi the Ylläs summit.
// Summit stations don't measure snow; snowStation is the nearest FMI station that does.
const LOCATIONS = [
  { name: "Kilpisjärvi (Saana)", lat: 69.0428, lon: 20.8509, summit: 1001, fmiHeight: 427, snowStation: { id: 102016, name: "Kilpisjärvi kyläkeskus" } },
  { name: "Ounas-Pallas (Laukukero)", lat: 68.0628, lon: 24.0333, summit: 761, fmiHeight: 327, snowStation: { id: 101987, name: "Kenttärova" } },
  { name: "Ylläs-Levi (Ylläs)", lat: 67.5644, lon: 24.2244, summit: 719, fmiHeight: 381, snowStation: { id: 101990, name: "Kittilä Pakatti" } },
  { name: "Saariselkä (Kaunispää)", lat: 68.4340, lon: 27.4451, summit: 436, fmiHeight: 109, snowStation: { id: 102005, name: "Saariselkä matkailukeskus" } },
  { name: "Luosto-Pyhä (Luosto)", lat: 67.1391, lon: 26.8969, summit: 513, fmiHeight: 223, snowStation: { id: 101932, name: "Sodankylä Tähtelä" } },
  { name: "Ruka (Rukatunturi)", lat: 66.1661, lon: 29.1518, summit: 477, fmiHeight: 154, snowStation: { id: 101887, name: "Kuusamo Kiutaköngäs" } },
  { name: "Talma Ski", lat: 60.398, lon: 25.175, summit: null, fmiHeight: null, snowStation: { id: 101004, name: "Helsinki Kumpula" } },
];
const WIND_DRIFT_MS = 6; // FMI: 6–7 m/s moves light dry snow
const WIND_DIFF_MS = 3;  // show both sources' wind when they differ more than this

const HOURLY = "snowfall,temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m";
const omUrlFor = ({ lat, lon }) => `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
  `&hourly=${HOURLY}&past_days=3&forecast_days=3&wind_speed_unit=ms&timezone=Europe%2FHelsinki`;

const FMI_WFS = "https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&timestep=60";
// Hybrid levels give no gusts; Talma (no summit) uses the surface forecast.
const fmiUrlFor = ({ lat, lon, fmiHeight }) => fmiHeight
  ? `${FMI_WFS}&storedquery_id=fmi::forecast::harmonie::hybrid::point::simple&latlon=${lat},${lon}&height=${fmiHeight}&parameters=Temperature,WindSpeedMS,WindDirection`
  : `${FMI_WFS}&storedquery_id=fmi::forecast::harmonie::surface::point::simple&latlon=${lat},${lon}&parameters=Temperature,WindSpeedMS,WindGust,WindDirection`;

// FMI snow depth (cm), hourly for the past 4 days. -1 = no snow cover, NaN = no reading.
const snowUrlFor = (id) => {
  const start = new Date(Date.now() - 4 * 864e5).toISOString().slice(0, 13) + ":00:00Z";
  return `${FMI_WFS}&storedquery_id=fmi::observations::weather::simple&fmisid=${id}&parameters=snow_aws&starttime=${start}`;
};

const TZ = "Europe/Helsinki";
const localDate = (d) => d.toLocaleDateString("sv-SE", { timeZone: TZ });
const hourKey = (d) => d.toLocaleString("sv-SE", { timeZone: TZ }).slice(0, 13); // "2026-11-03 14"

const parseWfs = (xml) => {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const text = (el, tag) => el.getElementsByTagName(tag)[0]?.textContent;
  return [...doc.getElementsByTagName("BsWfs:BsWfsElement")].map(el => ({
    time: new Date(text(el, "BsWfs:Time")),
    name: text(el, "BsWfs:ParameterName"),
    value: parseFloat(text(el, "BsWfs:ParameterValue")),
  })).filter(r => !Number.isNaN(r.value));
};

// Last valid reading per local date: { "2026-10-27": 12, ... }
const parseSnow = (xml) => Object.fromEntries(parseWfs(xml).map(r => [localDate(r.time), Math.max(r.value, 0)]));

// Both sources as { "2026-11-03 14": { snow, t, wind, gust, dir } }
const FMI_KEYS = { Temperature: "t", WindSpeedMS: "wind", WindGust: "gust", WindDirection: "dir" };
const fmiHours = (xml) => {
  const out = {};
  for (const r of parseWfs(xml)) (out[hourKey(r.time)] ??= {})[FMI_KEYS[r.name]] = r.value;
  return out;
};
const omHours = (h) => Object.fromEntries(h.time.map((t, i) => [t.slice(0, 13).replace("T", " "), {
  snow: h.snowfall[i], t: h.temperature_2m[i], wind: h.wind_speed_10m[i],
  gust: h.wind_gusts_10m[i], dir: h.wind_direction_10m[i],
}]));

// Summary of a set of hours; null when none have wind.
const agg = (hours) => {
  const hs = hours.filter(h => h?.wind != null);
  if (!hs.length) return null;
  const vals = (k) => hs.map(h => h[k]).filter(v => v != null);
  const top = hs.reduce((a, b) => (b.wind > a.wind ? b : a));
  const snow = vals("snow"), t = vals("t"), gust = vals("gust");
  return {
    snow: snow.length ? snow.reduce((a, b) => a + b, 0) : null,
    tMin: t.length ? Math.min(...t) : null, tMax: t.length ? Math.max(...t) : null,
    wind: top.wind, gust: gust.length ? Math.max(...gust) : null, dir: top.dir,
  };
};

// Per hour, FMI where it has data, else Open-Meteo; new snow always Open-Meteo.
// Drift flag errs to the safe side: higher wind, colder max of either source.
const summarize = (keys, om, fmi) => {
  const main = agg(keys.map(k => (fmi[k] ? { ...fmi[k], snow: om[k]?.snow } : om[k])));
  if (!main) return null;
  const fmiOnly = agg(keys.map(k => fmi[k]));
  const omSame = agg(keys.filter(k => fmi[k]).map(k => om[k])); // Open-Meteo for the FMI hours
  const omAll = agg(keys.map(k => om[k]));
  const winds = [main.wind, omAll?.wind].filter(v => v != null);
  const tMaxs = [main.tMax, omAll?.tMax].filter(v => v != null);
  return {
    ...main,
    gust: fmiOnly && fmiOnly.gust == null ? null : main.gust, // summit FMI has no gusts; don't mix in ground gusts
    altWind: fmiOnly && omSame && Math.abs(fmiOnly.wind - omSame.wind) > WIND_DIFF_MS ? omSame.wind : null,
    drift: Math.max(...winds) >= WIND_DRIFT_MS && tMaxs.length > 0 && Math.min(...tMaxs) < 0,
  };
};

const loadIdx = () => { try { return Math.min(+localStorage.getItem("weatherLoc") || 0, LOCATIONS.length - 1); } catch { return 0; } };

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const compass = (deg) => DIRS[Math.round(deg / 45) % 8];
const fmt = (v, d = 0) => (v == null ? "–" : v.toFixed(d));
const pad = (n) => String(n).padStart(2, "0");
const SLOTS = [0, 3, 6, 9, 12, 15, 18, 21];

export default function Weather({ w, lang }) {
  const [idx, setIdx] = useState(loadIdx);
  const [om, setOm] = useState(null);
  const [fmi, setFmi] = useState({});
  const [elevation, setElevation] = useState(null);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [depth, setDepth] = useState({});
  const [open, setOpen] = useState(null);
  const loc = LOCATIONS[idx];

  useEffect(() => {
    let cancelled = false;
    const get = (url, as) => fetch(url).then(r => (r.ok ? r[as]() : Promise.reject(r.status)));
    setOm(null); setFmi({}); setDepth({}); setError(null); setOpen(null);
    try { localStorage.setItem("weatherLoc", idx); } catch {}
    get(omUrlFor(loc), "json")
      .then(j => { if (!cancelled) { setOm(omHours(j.hourly)); setElevation(j.elevation); setFetchedAt(new Date()); } })
      .catch(e => { if (!cancelled) setError(String(e)); });
    // FMI failures fall back to Open-Meteo / "–"
    get(fmiUrlFor(loc), "text").then(x => { if (!cancelled) setFmi(fmiHours(x)); }).catch(() => {});
    get(snowUrlFor(loc.snowStation.id), "text").then(x => { if (!cancelled) setDepth(parseSnow(x)); }).catch(() => {});
    return () => { cancelled = true; };
  }, [idx]);

  const today = localDate(new Date());
  const locale = lang === "fi" ? "fi-FI" : "en-GB";
  const hasFmi = Object.keys(fmi).length > 0;

  const hoursOf = (date, from, n) => Array.from({ length: n }, (_, i) => `${date} ${pad(from + i)}`);

  const dates = om ? [...new Set(Object.keys(om).map(k => k.slice(0, 10)))] : [];
  const days = dates.map(date => ({
    date,
    label: date === today ? w.today : new Date(date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" }),
    past: date < today,
    depth: depth[date],
    ...summarize(hoursOf(date, 0, 24), om, fmi),
    slots: SLOTS.map(h => ({ label: `${pad(h)}–${pad(h + 3)}`, ...summarize(hoursOf(date, h, 3), om, fmi) })).filter(s => s.wind != null),
  })).filter(d => d.wind != null);

  const cell = { padding: "7px 4px", textAlign: "right", fontFamily: "monospace", fontSize: 12 };
  const head = { ...cell, fontFamily: "inherit", fontSize: 10, color: "#888", fontWeight: 700, borderBottom: "1.5px solid #1c1c1c" };
  const sub = { ...cell, padding: "4px 4px", fontSize: 11, color: "#555" };

  const values = (r, style) => (
    <>
      <td style={{ ...style, fontWeight: r.snow > 0 ? 700 : 400 }}>{fmt(r.snow, 1)}</td>
      <td style={style}>{"depth" in r ? fmt(r.depth) : ""}</td>
      <td style={style}>{fmt(r.tMin)} / {fmt(r.tMax)}</td>
      <td style={{ ...style, color: r.drift ? "#c0392b" : style.color, fontWeight: r.drift ? 700 : 400 }}>
        {fmt(r.wind)}
        {r.altWind != null && <span style={{ opacity: 0.55 }}> / {fmt(r.altWind)}</span>}
        {r.gust != null && <span style={{ opacity: 0.55 }}> ({fmt(r.gust)})</span>}
        {" "}{r.dir != null ? compass(r.dir) : ""}
      </td>
    </>
  );

  return (
    <>
      <select value={idx} onChange={e => setIdx(+e.target.value)} style={{
        width: "100%", padding: "8px 10px", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
        color: "#1c1c1c", background: "transparent", border: "1.5px solid #1c1c1c", borderRadius: 4,
      }}>
        {LOCATIONS.map((l, i) => <option key={l.name} value={i}>{l.name}</option>)}
      </select>
      <p style={{ fontSize: 11, color: "#aaa", margin: "6px 0 16px", fontStyle: "italic" }}>{w.intro}</p>

      {error && <div style={{ fontSize: 12, color: "#c0392b" }}>{w.error} ({error})</div>}
      {!om && !error && <div style={{ fontSize: 12, color: "#aaa" }}>{w.loading}</div>}

      {om && (
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
              <Fragment key={d.date}>
                <tr onClick={() => setOpen(open === d.date ? null : d.date)} style={{
                  borderBottom: "1px solid #d5cfc3", cursor: "pointer",
                  background: d.date === today ? "#ebe5d8" : "transparent",
                  opacity: d.past ? 0.75 : 1,
                }}>
                  <td style={{ ...cell, textAlign: "left", fontFamily: "inherit", fontWeight: d.date === today ? 700 : 400, whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 9, color: "#aaa", marginRight: 4 }}>{open === d.date ? "▼" : "▶"}</span>{d.label}
                  </td>
                  {values(d, cell)}
                </tr>
                {open === d.date && d.slots.map(s => (
                  <tr key={s.label} style={{ borderBottom: "1px solid #ebe5d8", opacity: d.past ? 0.75 : 1 }}>
                    <td style={{ ...sub, textAlign: "left", paddingLeft: 18 }}>{s.label}</td>
                    {values(s, sub)}
                  </tr>
                ))}
              </Fragment>
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
        <div>{w.pastSource}{elevation != null && <> ({w.modelHeight} {Math.round(elevation)} m)</>}.</div>
        {hasFmi && <div>{loc.summit ? <>{w.fmiSummit} ({loc.summit} m).</> : w.fmiSurface} {w.twoWinds}</div>}
        {fetchedAt && <div>{w.fetched} {fetchedAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} · {w.model}</div>}
        <div>{w.source} <a href="https://open-meteo.com/" style={{ color: "#888" }}>Open-Meteo.com</a> (CC BY 4.0) · <a href="https://www.ilmatieteenlaitos.fi/avoin-data" style={{ color: "#888" }}>{w.fmiForecastCredit}</a> (CC BY 4.0)</div>
        <div>{w.depthSource} {loc.snowStation.name}. <a href="https://www.ilmatieteenlaitos.fi/avoin-data" style={{ color: "#888" }}>{w.fmiCredit}</a> (CC BY 4.0)</div>
        <div>{w.full} <a href="https://tunturisaa.fi/" style={{ color: "#888" }}>tunturisaa.fi</a></div>
      </div>
    </>
  );
}
