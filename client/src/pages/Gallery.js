import { getDownloadURL, listAll, ref } from 'firebase/storage';
import React, { useCallback, useEffect, useState } from 'react';
import { storage } from '../firebase';
import './Gallery.css';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

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

  const navigateImage = useCallback((direction) => {
    if (!selectedImage) return;
    
    const currentIndex = images.findIndex(img => img.url === selectedImage.url);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % images.length;
    } else {
      newIndex = (currentIndex - 1 + images.length) % images.length;
    }
    
    setSelectedImage(images[newIndex]);
  }, [selectedImage, images]);

  const handleKeyDown = useCallback((e) => {
    if (!selectedImage) return;
    
    if (e.key === 'ArrowLeft') {
      navigateImage('prev');
    } else if (e.key === 'ArrowRight') {
      navigateImage('next');
    } else if (e.key === 'Escape') {
      setSelectedImage(null);
    }
  }, [selectedImage, navigateImage]);

  useEffect(() => {
    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, handleKeyDown]);

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
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <button className="modal-close" onClick={() => setSelectedImage(null)}>×</button>
            
            <button 
              className="modal-nav-button modal-nav-prev"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('prev');
              }}
            >
              ‹
            </button>
            
            <img src={selectedImage.url} alt="Full size" />
            
            <button 
              className="modal-nav-button modal-nav-next"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('next');
              }}
            >
              ›
            </button>
            
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