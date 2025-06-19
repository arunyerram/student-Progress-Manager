import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudentsList from './components/StudentsList';
import AddStudent from './components/AddStudent';
import StudentDetail from './components/StudentDetail';
import { ThemeContext } from './ThemeContext';
import Settings from './components/Settings';
import './App.css'; // Import your CSS for styling
function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className={`app-container ${theme}`}>
      <Router>
        {/* Light/Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000,
            padding: '8px 16px',
            borderRadius: 8,
            background: theme === 'dark' ? '#222' : '#eee',
            color: theme === 'dark' ? '#fff' : '#333',
            border: 'none',
            boxShadow: '0 1px 5px #0001',
            fontWeight: 500,
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? '☀ Light Mode' : '🌙 Dark Mode'}
        </button>
        <Routes>
          <Route path="/" element={<StudentsList />} />
          <Route path="/add" element={<AddStudent />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
