import React, { useState, useEffect } from "react";

export default function Settings() {
  const [cron, setCron] = useState('');
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('https://student-progress-manager-2.onrender.com/api/students/sync-cron')
      .then(res => res.json())
      .then(data => { setCron(data.value); setInput(data.value); });
  }, []);

  const handleSave = async () => {
    if (!input) return setMsg("Please enter a value.");
    const res = await fetch('https://student-progress-manager-2.onrender.com/api/students/sync-cron', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: input })
    });
    if (res.ok) {
      setCron(input);
      setMsg("Updated! (Will apply on next sync)");
    } else {
      setMsg("Failed to update.");
    }
  };

  return (
    <div style={{
      maxWidth: 480,
      margin: "32px auto",
      background: "var(--bg, #fff)",
      padding: 24,
      borderRadius: 8,
      boxShadow: "0 2px 16px #0002"
    }}>
      <h2>Settings</h2>
      <p><b>Current Sync Cron:</b> <span style={{ fontFamily: "monospace" }}>{cron}</span></p>
      <label>
        <span>Set New Cron Expression:</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            margin: "0 8px",
            fontFamily: "monospace",
            width: 180,
            background: "var(--input-bg, #fff)",
            color: "var(--text, #222)"
          }}
        />
      </label>
      <button style={{ marginLeft: 8 }} onClick={handleSave}>Save</button>
      <p style={{ color: "#1a9" }}>{msg}</p>
      <div style={{ marginTop: 24, fontSize: 14 }}>
        <b>Cron Examples:</b>
        <ul>
          <li><code>0 2 * * *</code> = every day at 2:00 AM</li>
          <li><code>0 6 * * *</code> = every day at 6:00 AM</li>
          <li><code>*/30 * * * *</code> = every 30 minutes</li>
        </ul>
        <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer">Need help? crontab.guru</a>
      </div>
    </div>
  );
}
