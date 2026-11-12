import { useEffect, useState } from "react";
import api from "./api";

const SLOTS = [
  { value: "morning", label: "Morning (fasting)" },
  { value: "after_breakfast", label: "After breakfast" },
  { value: "after_lunch", label: "After lunch" },
  { value: "after_dinner", label: "After dinner" },
];

const slotLabel = (v) => SLOTS.find((s) => s.value === v)?.label || v;

export default function Readings({ date, onChange }) {
  const [readings, setReadings] = useState([]);
  const [form, setForm] = useState({ slot: "morning", value: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await api.get("/readings", { params: { date } });
    setReadings(res.data);
    if (onChange) onChange();
  };

  // Reload whenever the selected date changes
  useEffect(() => {
    load();
    setEditingId(null);
    setError("");
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const body = { date, slot: form.slot, value: form.value };
    try {
      if (editingId) {
        await api.put(`/readings/${editingId}`, body);
      } else {
        await api.post("/readings", body);
      }
      setForm({ slot: "morning", value: "" });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not reach the server.");
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ slot: r.slot, value: String(r.value) });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ slot: "morning", value: "" });
    setError("");
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this reading?")) return;
    await api.delete(`/readings/${id}`);
    load();
  };

  return (
    <div>
      <h2>{editingId ? "Edit reading" : "Add reading"}</h2>
      <form onSubmit={handleSubmit}>
        <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
          {SLOTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Glucose value (mg/dl)"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
        />
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="submit">{editingId ? "Save changes" : "Add reading"}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>
          )}
        </div>
      </form>

      <h2>Readings for {date}</h2>
      {readings.length === 0 ? (
        <p className="muted">No readings for this date yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Slot</th><th>Value</th><th></th></tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r.id}>
                <td>{slotLabel(r.slot)}</td>
                <td>{r.value} mg/dl</td>
                <td className="actions">
                  <button className="small" onClick={() => startEdit(r)}>Edit</button>
                  <button className="small danger" onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
