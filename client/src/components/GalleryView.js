import { getDownloadURL, getMetadata, listAll, ref } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { storage } from '../firebase';
import './Gallery.css';

const GalleryView = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMediaFiles = async () => {
      try {
        const uploadsRef = ref(storage, 'uploads/');
        const result = await listAll(uploadsRef);
        
        const files = await Promise.all(
          result.items.map(async (item) => {
            const url = await getDownloadURL(item);
            const metadata = await getMetadata(item);
            return {
              name: item.name,
              url,
              type: metadata.contentType,
              timeCreated: metadata.timeCreated
            };
          })
        );

        setMediaFiles(files);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching media files:', err);
        setError('Failed to load gallery. Please try again later.');
        setLoading(false);
      }
    };

    fetchMediaFiles();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
      </div>
    );
  }

  if (mediaFiles.length === 0) {
    return (
      <div className="empty-container">
        <p>No media files uploaded yet. Be the first to share your memories!</p>
      </div>
    );
  }

  return (
    <div className="gallery-view-container">
      <div className="gallery-container">
        <h2>Wedding Gallery</h2>
        <div className="gallery-grid">
          {mediaFiles.map((file) => (
            <div key={file.name} className="media-card">
              {file.type.startsWith('image/') ? (
                <img src={file.url} alt={file.name} />
              ) : file.type.startsWith('video/') ? (
                <video controls>
                  <source src={file.url} type={file.type} />
                  Your browser does not support the video tag.
                </video>
              ) : null}
              <div className="media-info">
                <p className="filename">{file.name}</p>
                <p className="timestamp">{formatDate(file.timeCreated)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryView; 