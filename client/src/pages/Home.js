import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const weddingDate = new Date('2025-08-18T19:30:00');
    
    const calculateTimeLeft = () => {
      const difference = weddingDate - new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="home-container">
      <div className="photo-section">
        <img 
          src={process.env.PUBLIC_URL + '/images/couple-photo.jpg'} 
          alt="Karin and Noam" 
          className="main-photo"
        />
        <div className="names-overlay">
          <h2>Karin & Noam</h2>
          <h2>Are Getting Married</h2>
          <div className="date-location">
            <p>💍 18.08.2025</p>
          </div>
        </div>
      </div>

      <div className="countdown-section">
        <h3 className="countdown-title">הספירה לאחור החלה!</h3>
        <div className="countdown-container">
          <div className="countdown-time">
            <div className="countdown-item">
              <span className="countdown-number">{timeLeft.days}</span>
              <span className="countdown-label">Days</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="countdown-label">Mins</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="countdown-label">Secs</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="content-wrapper">
        <div className="content-container">
          <div className="message">
            <p>
              We're excited to share our special day with you! 
              Help us capture every moment by uploading your photos.
            </p>
          </div>

          <div className="button-container">
            <Link to="/upload" className="button button-primary">
              Upload Photos
            </Link>
            <Link to="/gallery" className="button button-secondary">
              View Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 