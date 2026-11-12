import { useEffect, useState } from "react";
import api from "./api";

const fmt = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

const slotNames = {
  morning: "Morning (fasting)",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner",
};

function ReportCard({ title, report }) {
  const range = report.from === report.to ? fmt(report.from) : `${fmt(report.from)} – ${fmt(report.to)}`;

  return (
    <div className="report">
      <h3>{title}</h3>
      <p className="muted">{range}</p>

      {report.count === 0 ? (
        <p className="muted">No readings in this period yet. Add a reading to see your report.</p>
      ) : (
        <div className="stats">
          <div><strong>{report.highest}</strong><span>Highest</span></div>
          <div><strong>{report.lowest}</strong><span>Lowest</span></div>
          <div><strong>{report.average}</strong><span>Average</span></div>
          <div><strong>{report.count}</strong><span>Readings</span></div>
        </div>
      )}

      {report.readings && report.readings.length > 0 && (
        <ul className="slotlist">
          {report.readings.map((r) => (
            <li key={r.id}>{slotNames[r.slot]}: <strong>{r.value}</strong> mg/dl</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Reports({ date, version }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api
      .get("/reports", { params: { date } })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Could not load reports."));
  }, [date, version]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading reports...</p>;

  return (
    <div>
      <h2>Reports</h2>
      <ReportCard title="Daily" report={data.daily} />
      <ReportCard title="Month-to-date" report={data.monthToDate} />
      <ReportCard title="Previous month" report={data.monthly} />
    </div>
  );
}
