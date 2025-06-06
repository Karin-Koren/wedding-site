import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../firebase';
import './Upload.css';

export default function Upload() {
  // State for form fields
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setError('');
    setSuccess('');

    // Validate each file
    const validFiles = files.filter(file => {
      // Check if file is image or video
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Please select only image or video files');
        return false;
      }

      // Check file size (20MB for videos, 10MB for images)
      const maxSize = file.type.startsWith('video/') ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Max size: ${file.type.startsWith('video/') ? '20MB' : '10MB'}`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(validFiles);
    
    // Create preview URLs
    const newPreviews = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            url: reader.result,
            type: file.type,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPreviews).then(setPreviews);
  };

  // Upload a single file to Firebase Storage
  const uploadFile = async (file, index) => {
    try {
      // Create a unique filename using timestamp and original name
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `uploads/${filename}`);
      
      // Create upload task with metadata
      const metadata = {
        contentType: file.type
      };
      
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Calculate and update progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({
              ...prev,
              [index]: progress
            }));
          },
          (error) => {
            // Handle specific error cases
            let errorMessage = 'Upload failed. Please try again.';
            
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = 'You are not authorized to upload files.';
                break;
              case 'storage/canceled':
                errorMessage = 'Upload was canceled.';
                break;
              case 'storage/unknown':
                errorMessage = 'An unknown error occurred. Please try again.';
                break;
              case 'storage/quota-exceeded':
                errorMessage = 'Storage quota exceeded. Please contact support.';
                break;
              case 'storage/invalid-checksum':
                errorMessage = 'File upload failed. Please try again.';
                break;
              case 'storage/cors':
                errorMessage = 'CORS error. Please try again or contact support.';
                break;
            }
            
            console.error('Upload error:', error);
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              // Upload completed successfully
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(new Error('Failed to get download URL. Please try again.'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Upload setup error:', error);
      throw new Error('Failed to start upload. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setUploadProgress({});

    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setIsUploading(true);

    try {
      // Upload all files
      const uploadPromises = selectedFiles.map((file, index) => uploadFile(file, index));
      const downloadURLs = await Promise.all(uploadPromises);

      // TODO: Save metadata to Firestore (downloadURLs)
      console.log('Uploaded files:', downloadURLs);
      
      setSuccess('Files uploaded successfully!');
      
      // Reset form
      setSelectedFiles([]);
      setPreviews([]);
      setUploadProgress({});
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove a file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  return (
    <div className="upload-container">
      <div className="upload-form">
        <h1 className="upload-title">
          Share Your Photos & Videos
        </h1>

        <form onSubmit={handleSubmit}>
          {/* File Input */}
          <div className="file-input-container">
            <label className="file-input-label">
              Select Photos or Videos
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="file-input"
            />
            <p className="file-size-info">
              Max size: 10MB for photos, 20MB for videos
            </p>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="preview-grid">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  {preview.type.startsWith('image/') ? (
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                    />
                  ) : (
                    <video
                      src={preview.url}
                      controls
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="remove-button"
                  >
                    ×
                  </button>
                  <p className="file-name">
                    {preview.name}
                  </p>
                  {/* Progress Bar */}
                  {uploadProgress[index] !== undefined && (
                    <div className="progress-container">
                      <div 
                        className="progress-bar"
                        style={{ width: `${uploadProgress[index]}%` }}
                      />
                      <span className="progress-text">
                        {Math.round(uploadProgress[index])}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="upload-button"
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>

          {/* View Gallery Button - Only shows after successful upload */}
          {success && (
            <Link to="/gallery" className="view-gallery-button">
              View Gallery
            </Link>
          )}
        </form>
      </div>
    </div>
  );
} 