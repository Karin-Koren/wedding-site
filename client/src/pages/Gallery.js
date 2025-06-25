import React, { useCallback, useEffect, useState } from 'react';
import './Gallery.css';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Fetch from Firestore instead of Storage
        // (Assume you have a Firestore collection 'uploads' with fullUrl and thumbUrl)
        const snapshot = await import('../firebase').then(({ db }) => import('firebase/firestore').then(firestore => firestore.getDocs(firestore.collection(db, 'uploads'))));
        const imageList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        imageList.sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0));
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

  const openImageModal = (index) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction) => {
    if (selectedImageIndex === null) return;
    if (direction === 'next' && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    } else if (direction === 'prev' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (selectedImageIndex === null) return;
    if (e.key === 'ArrowLeft') {
      navigateImage('prev');
    } else if (e.key === 'ArrowRight') {
      navigateImage('next');
    } else if (e.key === 'Escape') {
      closeModal();
    }
  }, [selectedImageIndex, navigateImage]);

  useEffect(() => {
    if (selectedImageIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImageIndex, handleKeyDown]);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      navigateImage('next');
    } else if (isRightSwipe) {
      navigateImage('prev');
    }
  };

  const toggleImageSelection = (image) => {
    if (!isSelectionMode) {
      setSelectedImageIndex(images.findIndex(img => img.url === image.url));
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
        const url = image.fullUrl || image.url;
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = image.filename || image.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Error downloading image:', err);
        setError('Failed to download some images. Please try again.');
      }
    }
  };

  const downloadSingleImage = async (image) => {
    try {
      const url = image.fullUrl || image.url;
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = image.filename || image.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
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
              className={`gallery-item ${selectedImages.find(img => (img.fullUrl || img.url) === (image.fullUrl || image.url)) ? 'selected' : ''}`}
              onClick={() => isSelectionMode ? toggleImageSelection(image) : openImageModal(index)}
            >
              <img
                src={image.thumbUrl || image.url}
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
      {selectedImageIndex !== null && !isSelectionMode && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <button className="modal-close" onClick={closeModal}>×</button>
            <button
              className={`modal-nav-button modal-nav-prev${selectedImageIndex === 0 ? ' disabled' : ''}`}
              onClick={e => {
                e.stopPropagation();
                navigateImage('prev');
              }}
              disabled={selectedImageIndex === 0}
            >
              ‹
            </button>
            <img src={images[selectedImageIndex].fullUrl || images[selectedImageIndex].url} alt="Full size" />
            <button
              className={`modal-nav-button modal-nav-next${selectedImageIndex === images.length - 1 ? ' disabled' : ''}`}
              onClick={e => {
                e.stopPropagation();
                navigateImage('next');
              }}
              disabled={selectedImageIndex === images.length - 1}
            >
              ›
            </button>
            <div className="modal-actions">
              <button
                className="download-button"
                onClick={() => downloadSingleImage(images[selectedImageIndex])}
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