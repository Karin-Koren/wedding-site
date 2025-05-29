import { useState } from 'react';

// Temporary mock data for demonstration
const mockPhotos = [
  { id: 1, url: 'https://picsum.photos/400/300?random=1', caption: 'First Dance' },
  { id: 2, url: 'https://picsum.photos/400/300?random=2', caption: 'Cutting the Cake' },
  { id: 3, url: 'https://picsum.photos/400/300?random=3', caption: 'Family Photo' },
  { id: 4, url: 'https://picsum.photos/400/300?random=4', caption: 'Dancing' },
  { id: 5, url: 'https://picsum.photos/400/300?random=5', caption: 'Toast' },
  { id: 6, url: 'https://picsum.photos/400/300?random=6', caption: 'Bouquet Toss' },
];

export default function Gallery() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">
        Wedding Gallery
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockPhotos.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-64 object-cover rounded-lg transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
              <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-center p-2">
                {photo.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for viewing full-size photos */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <p className="text-white text-center mt-4">{selectedPhoto.caption}</p>
            <button
              className="absolute top-4 right-4 text-white text-2xl hover:text-primary-400"
              onClick={() => setSelectedPhoto(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 