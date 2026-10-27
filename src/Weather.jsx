import { useEffect, useState } from "react";

// Example: daily weather for one location, client-side Open-Meteo fetch.
// Later this moves to the cron-built latest.json (PLAN.md section 6).
const LOCATION = { name: "Talma Ski", lat: 60.398, lon: 25.175 };
const WIND_DRIFT_MS = 6; // FMI: 6–7 m/s moves light dry snow

const DAILY = "snowfall_sum,temperature_2m_min,temperature_2m_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant";
const URL = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}` +
  `&daily=${DAILY}&past_days=3&forecast_days=3&wind_speed_unit=ms&timezone=Europe%2FHelsinki`;

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const compass = (deg) => DIRS[Math.round(deg / 45) % 8];
const fmt = (v, d = 0) => (v == null ? "–" : v.toFixed(d));

export default function Weather({ w, lang }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    fetch(URL)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(j => { setData(j.daily); setFetchedAt(new Date()); })
      .catch(e => setError(String(e)));
  }, []);

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Helsinki" });
  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  const days = data ? data.time.map((t, i) => {
    const snow = data.snowfall_sum[i];
    const tMax = data.temperature_2m_max[i];
    const wind = data.wind_speed_10m_max[i];
    return {
      date: t,
      label: t === today ? w.today : new Date(t).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "numeric" }),
      past: t < today,
      snow, tMin: data.temperature_2m_min[i], tMax, wind,
      gust: data.wind_gusts_10m_max[i],
      dir: data.wind_direction_10m_dominant[i],
      drift: wind != null && tMax != null && wind >= WIND_DRIFT_MS && tMax < 0,
    };
  }) : [];

  const cell = { padding: "7px 4px", textAlign: "right", fontFamily: "monospace", fontSize: 12 };
  const head = { ...cell, fontFamily: "inherit", fontSize: 10, color: "#888", fontWeight: 700, borderBottom: "1.5px solid #1c1c1c" };

  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1c" }}>{LOCATION.name}</div>
      <p style={{ fontSize: 11, color: "#aaa", margin: "2px 0 16px", fontStyle: "italic" }}>{w.intro}</p>

      {error && <div style={{ fontSize: 12, color: "#c0392b" }}>{w.error} ({error})</div>}
      {!data && !error && <div style={{ fontSize: 12, color: "#aaa" }}>{w.loading}</div>}

      {data && (
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#1c1c1c" }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: "left" }}>{w.day}</th>
              <th style={head}>{w.snow}<br />cm</th>
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
      </div>
    </>
  );
}
