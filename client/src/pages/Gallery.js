import { getDownloadURL, listAll, ref } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { storage } from '../firebase';
import './Gallery.css';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const listRef = ref(storage, 'uploads');
        const res = await listAll(listRef);
        
        const imagePromises = res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            url,
            name: itemRef.name,
            timestamp: itemRef.timeCreated
          };
        });

        const imageList = await Promise.all(imagePromises);
        // Sort by timestamp, newest first
        imageList.sort((a, b) => b.timestamp - a.timestamp);
        setImages(imageList);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Failed to load images. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const toggleImageSelection = (image) => {
    if (!isSelectionMode) {
      setSelectedImage(image);
      return;
    }

    setSelectedImages(prev => {
      if (prev.find(img => img.url === image.url)) {
        return prev.filter(img => img.url !== image.url);
      } else {
        return [...prev, image];
      }
    });
  };

  const downloadSelectedImages = async () => {
    if (selectedImages.length === 0) return;

    for (const image of selectedImages) {
      try {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Error downloading image:', err);
        setError('Failed to download some images. Please try again.');
      }
    }
  };

  const downloadSingleImage = async (image) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
      setError('Failed to download image. Please try again.');
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedImages([]);
    }
  };

  if (loading) {
    return (
      <div className="gallery-page">
        <div className="gallery-content">
          <h1>Loading Gallery...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-page">
        <div className="gallery-content">
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-content">
        <h1>Wedding Gallery</h1>
        <div className="gallery-actions">
          <button 
            className={`mode-button ${isSelectionMode ? 'active' : ''}`}
            onClick={toggleSelectionMode}
          >
            {isSelectionMode ? 'Exit Selection Mode' : 'Select Multiple'}
          </button>
          {isSelectionMode && (
            <button 
              className="download-button"
              onClick={downloadSelectedImages}
              disabled={selectedImages.length === 0}
            >
              Download Selected ({selectedImages.length})
            </button>
          )}
        </div>
        <div className="gallery-grid">
          {images.map((image, index) => (
            <div 
              key={index} 
              className={`gallery-item ${selectedImages.find(img => img.url === image.url) ? 'selected' : ''}`}
              onClick={() => toggleImageSelection(image)}
            >
              <img 
                src={image.url} 
                alt={`Wedding photo ${index + 1}`}
                loading="lazy"
              />
              {isSelectionMode && (
                <div className="selection-overlay">
                  <span className="checkmark">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal for full-size image view */}
      {selectedImage && !isSelectionMode && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage.url} alt="Full size" />
            <div className="modal-actions">
              <button 
                className="download-button"
                onClick={() => downloadSingleImage(selectedImage)}
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery; 