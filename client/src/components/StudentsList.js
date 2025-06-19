import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // For editing modal
  const [showEdit, setShowEdit]   = useState(false);
  const [editData, setEditData]   = useState(null);
  const [editError, setEditError] = useState('');

  // For delete feedback
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const res = await fetch('https://student-progress-manager-2.onrender.com/api/students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students');
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`https://student-progress-manager-2.onrender.com/api/students/${id}`,
         { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      setStudents(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
    setDeletingId(null);
  }

  function handleEdit(student) {
    setEditData({ ...student });
    setShowEdit(true);
    setEditError('');
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    const { _id, name, email, phone, codeforcesHandle } = editData;
    if (!name || !email || !phone || !codeforcesHandle) {
      setEditError('All fields required.');
      return;
    }
    try {
      const res = await fetch(`https://student-progress-manager-2.onrender.com/api/students/${_id}`,
         {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, codeforcesHandle })
      });
      if (res.ok) {
        const updated = await res.json();
        setStudents(prev => prev.map(s => s._id === _id ? updated : s));
        setShowEdit(false);
      } else {
        setEditError('Failed to update student.');
      }
    } catch (err) {
      setEditError('Failed to update student.');
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Student Progress Manager</h2>

      <button
        onClick={() => window.open('https://student-progress-manager-2.onrender.com/api/students/export',
           '_blank')}
        style={{ marginRight: '1rem' }}
      >Download CSV</button>
      <Link to="/add">
        <button>Add Student</button>
      </Link>

      <table border="1" cellPadding="8" cellSpacing="0" style={{ marginTop: '1rem', width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>CF Handle</th>
            <th>Current Rating</th>
            <th>Max Rating</th>
            <th>Last Sync</th>
            <th>Reminders Sent</th> {/* NEW COLUMN */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.phone}</td>
              <td>{s.codeforcesHandle}</td>
              <td>{s.currentRating}</td>
              <td>{s.maxRating}</td>
              <td>{s.lastSync ? new Date(s.lastSync).toLocaleDateString() : '—'}</td>
              <td>{s.reminderSentCount || 0}</td> {/* NEW CELL */}
              <td>
                <Link to={`/students/${s._id}`}>View</Link>
                {" | "}
                <button onClick={() => handleEdit(s)} disabled={deletingId !== null}>Edit</button>
                {" | "}
                <button
                  onClick={() => handleDelete(s._id)}
                  style={{color:'red'}}
                  disabled={deletingId === s._id}
                >
                  {deletingId === s._id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {showEdit && (
        <div
          style={{
            position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <form
            style={{ background: '#fff', padding: 24, minWidth: 320, borderRadius: 8, boxShadow: '0 2px 16px #0002' }}
            onSubmit={handleEditSubmit}
          >
            <h3>Edit Student</h3>
            <div>
              <label>Name:<br/>
                <input
                  value={editData.name}
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </label>
            </div>
            <div>
              <label>Email:<br/>
                <input
                  type="email"
                  value={editData.email}
                  onChange={e => setEditData({ ...editData, email: e.target.value })}
                  required
                />
              </label>
            </div>
            <div>
              <label>Phone:<br/>
                <input
                  value={editData.phone}
                  onChange={e => setEditData({ ...editData, phone: e.target.value })}
                  required
                />
              </label>
            </div>
            <div>
              <label>CF Handle:<br/>
                <input
                  value={editData.codeforcesHandle}
                  onChange={e => setEditData({ ...editData, codeforcesHandle: e.target.value })}
                  required
                />
              </label>
            </div>
            {editError && <p style={{ color: 'red' }}>{editError}</p>}
            <button type="submit" style={{ marginRight: 8 }}>Save</button>
            <button type="button" onClick={() => setShowEdit(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}
