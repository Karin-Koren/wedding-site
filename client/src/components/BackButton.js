import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BackButton.css';

const BackButton = () => {
  const location = useLocation();
  
  // Don't show back button on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Link to="/" className="back-button">
      ←
    </Link>
  );
};

export default BackButton; 