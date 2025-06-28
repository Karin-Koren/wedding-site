import * as faceapi from 'face-api.js';
import heic2any from 'heic2any';
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
  
  // Face detection states
  const [showFaceUploadModal, setShowFaceUploadModal] = useState(false);
  const [isFaceDetectionLoading, setIsFaceDetectionLoading] = useState(false);
  const [faceDetectionResults, setFaceDetectionResults] = useState(null);
  const [filteredImages, setFilteredImages] = useState(null);
  const [referenceFaceDescriptor, setReferenceFaceDescriptor] = useState(null);
  const [faceDetectionProgress, setFaceDetectionProgress] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.3); // Lowered default sensitivity for better detection
  const [faceDetectionCache, setFaceDetectionCache] = useState(new Map()); // Cache for face descriptors

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; // Models will be in public/models folder
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          // Add SsdMobilenetv1 for better detection of faces from different angles
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.error('Failed to load face detection models:', error);
        // Models will be loaded on-demand when user tries face detection
      }
    };
    loadModels();
  }, []);

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

  // Face detection functions
  const loadFaceAPIModels = async () => {
    if (modelsLoaded) return;
    
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      console.log('Face detection models loaded successfully');
    } catch (error) {
      throw new Error(`Failed to load face detection models: ${error.message}`);
    }
  };

  const getFaceDescriptor = async (imageUrl) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
          
          if (detection) {
            resolve(detection.descriptor);
          } else {
            reject(new Error('No face detected in the image'));
          }
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const findMatchingFaces = async (referenceDescriptor, galleryImages) => {
    const matches = [];
    const threshold = sensitivity; // Use the sensitivity state
    let processedCount = 0;
    const newCache = new Map();
    
    for (let i = 0; i < galleryImages.length; i++) {
      const image = galleryImages[i];
      processedCount++;
      
      // Update progress
      setFaceDetectionProgress(`Scanning image ${processedCount} of ${galleryImages.length}...`);
      
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const descriptor = await new Promise((resolve, reject) => {
          img.onload = async () => {
            try {
              // Check cache first
              const cacheKey = image.thumbUrl || image.url;
              const cachedDescriptors = faceDetectionCache.get(cacheKey);
              
              let allDetections = [];
              
              if (cachedDescriptors && cachedDescriptors.length > 0) {
                // Use cached descriptors if available
                allDetections = cachedDescriptors;
                console.log(`Using cached descriptors for image ${i + 1}`);
              } else {
                // Try multiple detection methods for better results
                
                // Method 1: TinyFaceDetector (fast, good for small faces)
                try {
                  const tinyDetections = await faceapi
                    .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ 
                      inputSize: 224, // Larger input size for better detection
                      scoreThreshold: 0.2 // Even lower threshold for better detection
                    }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();
                  allDetections = allDetections.concat(tinyDetections);
                } catch (e) {
                  console.log(`TinyFaceDetector failed for image ${i + 1}:`, e.message);
                }
                
                // Method 2: SsdMobilenetv1 (better for different angles)
                try {
                  const ssdDetections = await faceapi
                    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ 
                      minConfidence: 0.2 // Lower confidence threshold
                    }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();
                  allDetections = allDetections.concat(ssdDetections);
                } catch (e) {
                  console.log(`SsdMobilenetv1 failed for image ${i + 1}:`, e.message);
                }
                
                // Cache the descriptors for future use
                if (allDetections.length > 0) {
                  newCache.set(cacheKey, allDetections);
                }
              }
              
              // Remove duplicate detections (same face detected by both methods)
              const uniqueDetections = [];
              for (const detection of allDetections) {
                const isDuplicate = uniqueDetections.some(existing => {
                  const distance = faceapi.euclideanDistance(detection.descriptor, existing.descriptor);
                  return distance < 0.15; // Slightly higher threshold for duplicates
                });
                if (!isDuplicate) {
                  uniqueDetections.push(detection);
                }
              }
              
              if (uniqueDetections.length > 0) {
                // Find the best match among all detected faces
                let bestMatch = null;
                let bestSimilarity = 0;
                
                for (const detection of uniqueDetections) {
                  const distance = faceapi.euclideanDistance(referenceDescriptor, detection.descriptor);
                  const similarity = 1 - distance;
                  
                  if (similarity > bestSimilarity) {
                    bestSimilarity = similarity;
                    bestMatch = detection.descriptor;
                  }
                }
                
                // Apply a small boost to threshold for consistency
                const adjustedThreshold = threshold - 0.05;
                
                if (bestMatch && bestSimilarity > adjustedThreshold) {
                  resolve({ descriptor: bestMatch, similarity: bestSimilarity });
                } else {
                  reject(new Error(`Best similarity (${bestSimilarity.toFixed(3)}) below adjusted threshold (${adjustedThreshold.toFixed(3)})`));
                }
              } else {
                reject(new Error('No faces detected with any method'));
              }
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = image.thumbUrl || image.url;
        });
        
        matches.push({
          image,
          similarity: descriptor.similarity.toFixed(3),
          index: i
        });
        
        console.log(`Match found in image ${i + 1}: ${descriptor.similarity.toFixed(3)}`);
        
      } catch (error) {
        console.log(`No match in image ${i + 1}: ${error.message}`);
      }
    }
    
    // Update cache with new descriptors
    setFaceDetectionCache(newCache);
    
    return matches.sort((a, b) => b.similarity - a.similarity);
  };

  const handleFaceUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsFaceDetectionLoading(true);
    setShowFaceUploadModal(false);
    setFaceDetectionProgress('Loading face detection models...');

    // Declare conversionInfo outside try block so it's accessible in catch
    let conversionInfo = '';

    try {
      // Load models if not already loaded
      await loadFaceAPIModels();
      setFaceDetectionProgress('Analyzing your photo...');

      // Convert HEIC/HEIF to JPEG if needed
      let referenceFile = file;
      
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        setFaceDetectionProgress('Converting iPhone photo format...');
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9
          });
          referenceFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          referenceFile = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
          conversionInfo = `Converted from ${file.type} to JPEG successfully. `;
        } catch (conversionError) {
          conversionInfo = `HEIC conversion failed, using original file. `;
          referenceFile = file;
        }
      } else {
        conversionInfo = `File type: ${file.type}. `;
      }

      // Get reference face descriptor
      const imageUrl = URL.createObjectURL(referenceFile);
      setFaceDetectionProgress('Detecting faces in your photo...');
      
      const descriptor = await getFaceDescriptor(imageUrl);
      setReferenceFaceDescriptor(descriptor);
      setFaceDetectionProgress('Scanning gallery for matches...');

      // Find matches in gallery
      const matches = await findMatchingFaces(descriptor, images);

      setFaceDetectionResults({
        totalImages: images.length,
        matches: matches,
        message: matches.length > 0 
          ? `We found ${matches.length} photos with your face!` 
          : 'No matches found. Try uploading a clearer photo of yourself.'
      });

      // Filter gallery to show only matches
      if (matches.length > 0) {
        const matchedImages = matches.map(match => match.image);
        setFilteredImages(matchedImages);
      } else {
        setFilteredImages([]);
      }

      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error('Face detection error:', error);
      
      // Provide more specific error messages and tips
      let errorMessage = 'Face detection failed. Please try again with a clearer photo.';
      let tips = '';
      
      if (error.message.includes('Face API not loaded')) {
        errorMessage = 'Face detection is still loading. Please wait a moment and try again.';
      } else if (error.message.includes('Failed to load face detection models')) {
        errorMessage = 'Face detection models failed to load. Please check your internet connection and try again.';
      } else if (error.message.includes('No face detected')) {
        errorMessage = `No face detected in your photo. ${conversionInfo || ''}Please try a different photo.`;
        tips = 'Tips for better results:\n• Use a clear, front-facing photo\n• Ensure good lighting\n• Avoid sunglasses or hats\n• Make sure your face is clearly visible\n• Try a photo from a recent event\n• If using iPhone, try taking a screenshot of your photo first\n• File info: ' + (conversionInfo || `Type: ${file.type}, Name: ${file.name}`);
      } else if (error.message.includes('Failed to load image')) {
        errorMessage = 'Failed to process the image. Please try a different photo format (JPG, PNG).';
      }
      
      setError(errorMessage);
      if (tips) {
        // Show tips in a more user-friendly way
        setTimeout(() => {
          alert(tips);
        }, 100);
      }
    } finally {
      setIsFaceDetectionLoading(false);
      setFaceDetectionProgress('');
    }
  };

  const clearFaceFilter = () => {
    setFilteredImages(null);
    setFaceDetectionResults(null);
    setReferenceFaceDescriptor(null);
  };

  const clearFaceDetectionCache = () => {
    setFaceDetectionCache(new Map());
    console.log('Face detection cache cleared');
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

  const displayImages = filteredImages || images;

  return (
    <div className="gallery-page">
      <div className="gallery-content">
        <h1>Wedding Gallery</h1>
        
        {/* Face Detection Results */}
        {faceDetectionResults && (
          <div className="face-detection-results">
            <p className="results-message">{faceDetectionResults.message}</p>
            {faceDetectionResults.matches.length > 0 && (
              <div className="results-details">
                <p className="results-stats">
                  Found {faceDetectionResults.matches.length} matches out of {faceDetectionResults.totalImages} photos
                </p>
                <div className="similarity-scores">
                  <h4>Match Quality:</h4>
                  <div className="score-bars">
                    {faceDetectionResults.matches.slice(0, 5).map((match, index) => (
                      <div key={index} className="score-bar">
                        <span className="score-label">Match {index + 1}:</span>
                        <div className="score-bar-container">
                          <div 
                            className="score-bar-fill" 
                            style={{ width: `${(match.similarity * 100)}%` }}
                          ></div>
                        </div>
                        <span className="score-value">{(match.similarity * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="results-actions">
              <button className="clear-filter-button" onClick={clearFaceFilter}>
                Show All Photos
              </button>
              {faceDetectionResults.matches.length === 0 && (
                <button 
                  className="retry-button" 
                  onClick={() => {
                    setSensitivity(0.2); // Try with even lower sensitivity
                    clearFaceDetectionCache(); // Clear cache for fresh detection
                    setShowFaceUploadModal(true);
                  }}
                >
                  Try Again with Lower Sensitivity
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="gallery-actions">
          <button 
            className="find-me-button"
            onClick={() => setShowFaceUploadModal(true)}
            disabled={isFaceDetectionLoading}
          >
            {isFaceDetectionLoading ? (
              <div className="face-detection-loading">
                <div className="spinner"></div>
                {faceDetectionProgress || 'Processing...'}
              </div>
            ) : (
              'Find Me in Photos'
            )}
          </button>
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
          {displayImages.map((image, index) => (
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

      {/* Face Upload Modal */}
      {showFaceUploadModal && (
        <div className="modal-overlay" onClick={() => setShowFaceUploadModal(false)}>
          <div className="face-upload-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowFaceUploadModal(false)}>×</button>
            <h2>Find Me in Photos</h2>
            <p>Upload a clear photo of yourself to find all photos with your face in the gallery.</p>
            
            <div className="upload-guidelines">
              <h3>For best results:</h3>
              <ul>
                <li>Use a clear, front-facing photo</li>
                <li>Ensure good lighting</li>
                <li>Avoid sunglasses or hats</li>
                <li>Make sure your face is clearly visible</li>
                <li>Try a photo from a recent event</li>
              </ul>
            </div>
            
            <div className="sensitivity-control">
              <label htmlFor="sensitivity-slider">
                Detection Sensitivity: <span className="sensitivity-value">{(sensitivity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                id="sensitivity-slider"
                min="0.15"
                max="0.7"
                step="0.05"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="sensitivity-slider"
              />
              <div className="sensitivity-labels">
                <span>More Strict</span>
                <span>More Lenient</span>
              </div>
              <p className="sensitivity-tip">
                Lower sensitivity = more matches (may include false positives)<br/>
                Higher sensitivity = fewer matches (more accurate)
              </p>
            </div>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFaceUpload}
              className="face-upload-input"
            />
            <p className="upload-tip">Supported formats: JPG, PNG, GIF</p>
          </div>
        </div>
      )}

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
            <img src={displayImages[selectedImageIndex].fullUrl || displayImages[selectedImageIndex].url} alt="Full size" />
            <button
              className={`modal-nav-button modal-nav-next${selectedImageIndex === displayImages.length - 1 ? ' disabled' : ''}`}
              onClick={e => {
                e.stopPropagation();
                navigateImage('next');
              }}
              disabled={selectedImageIndex === displayImages.length - 1}
            >
              ›
            </button>
            <div className="modal-actions">
              <button
                className="download-button"
                onClick={() => downloadSingleImage(displayImages[selectedImageIndex])}
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