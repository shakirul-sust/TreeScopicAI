import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import useAnalysisStore from '../store/analysisStore';

function ImageUploader({ onImageSelected, isUploading }) {
  const [preview, setPreview] = useState(null);
  const { result } = useAnalysisStore();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Notify parent component
      onImageSelected(file);
    }
  }, [onImageSelected]);

  // Clear preview when results are available
  useEffect(() => {
    if (result && preview && !isUploading) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [result, preview, isUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        {...getRootProps()}
        className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-colors duration-300
                   ${isDragActive 
                     ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                     : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'} 
                   ${isUploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-white font-medium">Processing...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4 text-green-600 dark:text-green-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="mx-auto"
              >
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
              </svg>
            </div>
            
            {isDragActive ? (
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-3">Drop the image here</p>
            ) : (
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-3">Drag & drop a tree image here</p>
            )}
            
            <p className="text-gray-500 dark:text-gray-400 mb-4">OR</p>
            
            <button
              type="button"
              disabled={isUploading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 
                        text-white font-medium rounded-lg transition-colors duration-300
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Processing..." : "Select Image"}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Supports: JPG, JPEG, PNG, WebP (max 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUploader;