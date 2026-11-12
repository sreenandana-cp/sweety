import { useState } from "react";
import api from "./api";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signup") {
        await api.post("/auth/signup", form);
      }
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Could not reach the server.");
    }
  };

  return (
    <div className="card">
      <h1>Sweety</h1>
      <p className="muted">Track your blood glucose</p>

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />

        {error && <p className="error">{error}</p>}

        <button type="submit">{mode === "login" ? "Log in" : "Sign up"}</button>
      </form>

      <p className="muted">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <a href="#" onClick={(e) => { e.preventDefault(); setError(""); setMode(mode === "login" ? "signup" : "login"); }}>
          {mode === "login" ? "Sign up" : "Log in"}
        </a>
      </p>
    </div>
  );
}
