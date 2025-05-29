import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <div className="content-wrapper">
        {/* Names section */}
        <div className="names">
          <h2>Karin & Noam</h2>
          <h2>Are Getting Married</h2>
        </div>

        {/* Photo section */}
        <div className="photo-section">
          <img 
            src="/images/couple-photo.jpg" 
            alt="Karin and Noam" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/600x400?text=Karin+%26+Noam';
            }}
          />
        </div>

        {/* Date and location section */}
        <div className="date-location">
          <p>💍 18.08.2025</p>
        </div>

        {/* Message section */}
        <div className="message">
          <p>
            We're excited to share our special day with you! 
            Help us capture every moment by uploading your photos.
          </p>
        </div>

        {/* Buttons section */}
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
  );
} 