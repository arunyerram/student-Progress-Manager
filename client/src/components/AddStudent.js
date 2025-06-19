
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddStudent() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({
    name: '',
    email: '',
    phone: '',
    codeforcesHandle: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic client-side validation
    const { name, email, phone, codeforcesHandle } = form;
    if (!name || !email || !phone || !codeforcesHandle) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student');
      }

      // On success, go back to list
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Add New Student</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <div>
          <label>Name</label><br/>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Email</label><br/>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Phone</label><br/>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Codeforces Handle</label><br/>
          <input
            name="codeforcesHandle"
            value={form.codeforcesHandle}
            onChange={handleChange}
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>
        {error && (
          <p style={{ color: 'red' }}>{error}</p>
        )}
        <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Saving…' : 'Save Student'}
        </button>
      </form>
    </div>
  );
}
