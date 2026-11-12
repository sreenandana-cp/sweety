import { useState } from "react";
import AuthPage from "./AuthPage";
import Readings from "./Readings";
import Reports from "./Reports";

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [date, setDate] = useState(today());
  const [version, setVersion] = useState(0); // changes when readings change, so reports reload

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) return <AuthPage onLogin={setUser} />;

  return (
    <div className="card wide">
      <div className="row between">
        <h1>Hello, {user.name}!</h1>
        <button className="secondary" onClick={logout}>Log out</button>
      </div>

      <label className="muted">Select date</label>
      <input type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} />

      <Readings date={date} onChange={() => setVersion((v) => v + 1)} />
      <Reports date={date} version={version} />
    </div>
  );
}
