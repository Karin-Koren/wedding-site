import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Navigation</h3>
          <button className="close-btn" onClick={toggleSidebar}>
            ×
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className="nav-link" onClick={toggleSidebar}>
            Home
          </Link>
          <Link to="/upload" className="nav-link" onClick={toggleSidebar}>
            Upload
          </Link>
          <Link to="/gallery" className="nav-link" onClick={toggleSidebar}>
            Gallery
          </Link>
          <Link to="/guestbook" className="nav-link" onClick={toggleSidebar}>
            Guestbook
          </Link>
        </nav>
      </div>
      
      {isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
    </>
  );
};

export default Sidebar; 