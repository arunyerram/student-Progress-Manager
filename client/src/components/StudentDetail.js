import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

// === Professional style enhancements ===
const cardStyle = {
  background: '#23272f',
  color: '#f6f7fa',
  borderRadius: '16px',
  boxShadow: '0 2px 16px 0 #191c23',
  maxWidth: 900,
  margin: '2rem auto',
  padding: '2.5rem',
  fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
};

const sectionStyle = { margin: '2rem 0' };
const labelStyle = { fontWeight: 500, marginRight: 8 };

export default function StudentDetail() {
  const { id } = useParams();

  // === STATE ===
  const [student, setStudent] = useState(null);
  const [contests, setContests] = useState([]);
  const [problems, setProblems] = useState([]);
  const [mostDifficult, setMostDifficult] = useState(null);

  const [contestDays, setContestDays] = useState(365);
  const [problemDays, setProblemDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // For reminder-toggle UX
  const [reminderLoading, setReminderLoading] = useState(false);

  // --- Single student fetch (for reset count) ---
  async function fetchStudent() {
    const res = await fetch(
      `https://student-progress-manager-2.onrender.com/api/students/${id}`,
    );
    if (res.ok) setStudent(await res.json());
  }

  // --- Main loader (student + contests + problems)
  // ★ useCallback keeps the function identity stable
  const loadAll = useCallback(
    async () => {
      setError(null);
      setLoading(true);
      try {
        const [stuRes, contRes, probRes] = await Promise.all([
          fetch(
            `https://student-progress-manager-2.onrender.com/api/students/${id}`,
          ),
          fetch(
            `https://student-progress-manager-2.onrender.com/api/students/${id}/contests?days=${contestDays}`,
          ),
          fetch(
            `https://student-progress-manager-2.onrender.com/api/students/${id}/problems?days=${problemDays}`,
          ),
        ]);

        if (!stuRes.ok) throw new Error('Failed to fetch student');

        const stuJson = await stuRes.json();
        const contJson = contRes.ok ? await contRes.json() : [];
        const probJson = probRes.ok ? await probRes.json() : [];

        setStudent(stuJson);
        setContests(contJson);
        setProblems(probJson);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [id, contestDays, problemDays], // dependencies relevant to fetch URLs
  );

  // --- Initial load & on-ID change ---
  useEffect(() => {
    loadAll();
  }, [id, loadAll]); // ★ loadAll added here

  // --- Re-fetch contests on filter change ---
  useEffect(() => {
    if (!student) return;
    fetch(
      `https://student-progress-manager-2.onrender.com/api/students/${id}/contests?days=${contestDays}`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then(setContests)
      .catch(console.error);
  }, [contestDays, id, student]);

  // --- Re-fetch problems on filter change ---
  useEffect(() => {
    if (!student) return;
    fetch(
      `https://student-progress-manager-2.onrender.com/api/students/${id}/problems?days=${problemDays}`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then(setProblems)
      .catch(console.error);
  }, [problemDays, id, student]);

  // --- Fetch most difficult problem ---
  useEffect(() => {
    fetch(
      `https://student-progress-manager-2.onrender.com/api/students/${id}/most-difficult-problem?days=90`,
    )
      .then((r) => r.json())
      .then(setMostDifficult)
      .catch(() => setMostDifficult(null));
  }, [id]);

  // --- Handler: manual sync ---
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(
        `https://student-progress-manager-2.onrender.com/api/students/${id}/sync`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error('Sync failed');
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  // --- Handler: toggle reminder flag ---
  const handleToggleReminder = async () => {
    setReminderLoading(true);
    try {
      const res = await fetch(
        `https://student-progress-manager-2.onrender.com/api/students/${student._id}/reminder`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' } },
      );
      if (res.ok) {
        const { reminderEnabled } = await res.json();
        setStudent((curr) => ({ ...curr, reminderEnabled }));
      }
    } catch {
      alert('Failed to toggle reminder.');
    }
    setReminderLoading(false);
  };

  // === Derived statistics & chart data ===
  const avgRating = problems.length
    ? Math.round(
        problems.reduce((sum, p) => sum + (p.rating || 0), 0) / problems.length,
      )
    : 0;

  const minR = 800,
    maxR = 3500,
    step = 200;

  const buckets = {};
  for (let r = minR; r <= maxR; r += step)
    buckets[`${r}-${r + step - 1}`] = 0;

  problems.forEach((p) => {
    if (p.rating) {
      const start = Math.floor((p.rating - minR) / step) * step + minR;
      const label = `${start}-${start + step - 1}`;
      if (buckets[label] !== undefined) buckets[label]++;
    }
  });

  const barData = Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
  }));

  // --- Heatmap data ---
  const dateCounts = {};
  problems.forEach((p) => {
    if (p.solvedAt) {
      const key = new Date(p.solvedAt).toISOString().slice(0, 10);
      dateCounts[key] = (dateCounts[key] || 0) + 1;
    }
  });

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - problemDays + 1);

  const heatmapData = [];
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    heatmapData.push({ date: key, count: dateCounts[key] || 0 });
  }

  // === Render ===
  if (loading) return <p style={{ color: '#eee' }}>Loading…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!student) return <p>Student not found</p>;

  return (
    <div style={cardStyle}>
      <h2 style={{ fontWeight: 800, marginBottom: 18 }}>
        {student.name}&apos;s Profile
      </h2>

      {/* --- Buttons & Controls --- */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            background: '#7f56d9',
            color: '#fff',
            border: 'none',
            padding: '7px 22px',
            borderRadius: 6,
            fontWeight: 600,
            cursor: syncing ? 'not-allowed' : 'pointer',
            boxShadow: syncing ? 'none' : '0 1px 8px #191c23',
          }}
        >
          {syncing ? 'Syncing…' : 'Sync Data'}
        </button>
      </div>

      {/* --- Main Info --- */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          marginBottom: 22,
          gap: 40,
        }}
      >
        <div>
          <p style={labelStyle}>
            <b>Email:</b> {student.email}
          </p>
          <p style={labelStyle}>
            <b>Phone:</b> {student.phone}
          </p>
          <p style={labelStyle}>
            <b>CF Handle:</b>{' '}
            <a
              href={`${student.codeforcesHandle}`}
              style={{
                color: '#8db9fa',
                textDecoration: 'underline',
                wordBreak: 'break-all',
              }}
              target="_blank"
              rel="noreferrer"
            >
              {student.codeforcesHandle}
            </a>
          </p>

          {/* Reminder-related controls */}
          <div style={{ margin: '12px 0' }}>
            <b>Reminder Emails Sent:</b> {student.reminderSentCount || 0}
            <label
              style={{
                marginLeft: 18,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={!!student.reminderEnabled}
                onChange={handleToggleReminder}
                disabled={reminderLoading}
                style={{ marginRight: 6, transform: 'scale(1.2)' }}
              />
              Enable reminders
            </label>
            <button
              style={{
                marginLeft: 10,
                padding: '2px 10px',
                fontSize: '0.92em',
                borderRadius: 5,
                border: '1px solid #888',
                background: '#eee',
                color: '#1c212a',
                cursor: 'pointer',
              }}
              onClick={async () => {
                if (
                  window.confirm(
                    'Reset reminder email count for this student?',
                  )
                ) {
                  await fetch(
                    `https://student-progress-manager-2.onrender.com/api/students/${student._id}/reset-reminder`,
                    { method: 'PATCH' },
                  );
                  fetchStudent();
                }
              }}
              title="Reset reminder email count"
            >
              Reset
            </button>
          </div>

          {/* Sync-hour selector */}
          <div style={{ margin: '12px 0' }}>
            <b>Data Sync Time:</b>
            <span style={{ marginLeft: 8 }}>
              {student.syncHour !== undefined
                ? `${student.syncHour}:00`
                : 'Not Set'}
            </span>
            <select
              value={student.syncHour}
              style={{ marginLeft: 10, padding: '3px 8px' }}
              onChange={async (e) => {
                const hour = Number(e.target.value);
                const res = await fetch(
                  `https://student-progress-manager-2.onrender.com/api/students/${student._id}/sync-hour`,
                  {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ syncHour: hour }),
                  },
                );
                if (res.ok) {
                  await fetchStudent();
                  alert('Sync time updated!');
                }
              }}
            >
              {[...Array(24)].map((_, idx) => (
                <option key={idx} value={idx}>
                  {`${idx}:00`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* === Most Difficult Problem === */}
      <div style={sectionStyle}>
        <b>Most Difficult Problem Solved (last 90 days):</b>
        <br />
        {mostDifficult ? (
          <a
            href={`https://codeforces.com/problemset/problem/${mostDifficult.contestId}/${mostDifficult.index}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#95ffa4',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            {mostDifficult.name} (Rating: {mostDifficult.rating})
          </a>
        ) : (
          <span style={{ color: '#aaa' }}>None</span>
        )}
      </div>

      <hr style={{ border: '1px solid #333' }} />

      {/* === Contest History === */}
      <section style={sectionStyle}>
        <h3 style={{ marginBottom: 14, fontWeight: 700 }}>Contest History</h3>
        <label style={labelStyle}>Show last: </label>
        <select
          value={contestDays}
          onChange={(e) => setContestDays(+e.target.value)}
          style={{ marginBottom: 15, padding: '3px 8px' }}
        >
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>365 days</option>
        </select>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={contests.map((c) => ({
              date: new Date(c.date).toLocaleDateString(),
              rating: c.ratingAfter,
            }))}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={15} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#95ffa4"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>

        <div
          style={{
            overflowX: 'auto',
            maxWidth: '100vw',
            marginTop: '1rem',
            borderRadius: 8,
            boxShadow: '0 1px 8px #222',
            background: '#181a20',
          }}
        >
          <table
            border="0"
            cellPadding="8"
            style={{
              minWidth: 700,
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '1.04em',
              color: '#f4f6fa',
            }}
          >
            <thead style={{ background: '#262934' }}>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Rank</th>
                <th>Δ Rating</th>
                <th>Unsolved Problems</th>
              </tr>
            </thead>
            <tbody>
              {contests.map((c) => (
                <tr key={c.contestId}>
                  <td>{new Date(c.date).toLocaleDateString()}</td>
                  <td>{c.name}</td>
                  <td>{c.rank}</td>
                  <td>{c.ratingAfter - c.ratingBefore}</td>
                  <td>{c.problemsUnsolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr style={{ border: '1px solid #333' }} />

      {/* === Problem-Solving Section === */}
      <section style={sectionStyle}>
        <h3 style={{ marginBottom: 14, fontWeight: 700 }}>
          Problem Solving Data
        </h3>
        <label style={labelStyle}>Show last: </label>
        <select
          value={problemDays}
          onChange={(e) => setProblemDays(+e.target.value)}
          style={{ marginBottom: 15, padding: '3px 8px' }}
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>

        <div
          style={{
            display: 'flex',
            gap: 42,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div>
            <strong>Total Solved:</strong> {problems.length}
          </div>
          <div>
            <strong>Avg/day:</strong>{' '}
            {(problems.length / problemDays).toFixed(2)}
          </div>
          <div>
            <strong>Avg Rating:</strong> {avgRating || '—'}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData}>
            <XAxis
              dataKey="bucket"
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ffa585" />
          </BarChart>
        </ResponsiveContainer>

        {/* Submission Heatmap */}
        <div
          style={{
            margin: '32px 0',
            maxWidth: 600,
            background: '#191b21',
            borderRadius: 8,
            padding: '20px 8px',
          }}
        >
          <h4 style={{ marginBottom: 8 }}>Submission Heatmap</h4>
          <CalendarHeatmap
            startDate={startDate}
            endDate={today}
            values={heatmapData}
            classForValue={(v) => {
              if (!v || v.count === 0) return 'color-empty';
              if (v.count < 2) return 'color-github-1';
              if (v.count < 4) return 'color-github-2';
              if (v.count < 7) return 'color-github-3';
              return 'color-github-4';
            }}
            tooltipDataAttrs={(v) =>
              v.date ? { 'data-tip': `${v.date}: ${v.count} solved` } : {}
            }
            showWeekdayLabels
          />
        </div>

        <div
          style={{
            overflowX: 'auto',
            maxWidth: '100vw',
            marginTop: '1rem',
            borderRadius: 8,
            boxShadow: '0 1px 8px #222',
            background: '#181a20',
          }}
        >
          <table
            border="0"
            cellPadding="8"
            style={{
              minWidth: 700,
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '1.04em',
              color: '#f4f6fa',
            }}
          >
            <thead style={{ background: '#262934' }}>
              <tr>
                <th>Date</th>
                <th>Problem ID</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, idx) => (
                <tr key={idx}>
                  <td>{new Date(p.solvedAt).toLocaleDateString()}</td>
                  <td>{p.problemId}</td>
                  <td>{p.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p style={{ marginTop: '1.7rem', fontWeight: 600 }}>
        <Link
          to="/"
          style={{ color: '#8db9fa', textDecoration: 'underline' }}
        >
          ← Back to list
        </Link>
      </p>
    </div>
  );
}
