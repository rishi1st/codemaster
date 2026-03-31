import { useParams , Link } from 'react-router';
import React, { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../utils/axiosClient';

const UploadVideo = () => {
  const { problemId } = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors,
    setValue,
  } = useForm();

  const selectedFile = watch('videoFile')?.[0];

  // Handle drag and drop events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      setIsDragging(true);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setValue('videoFile', [file]);
        clearErrors('videoFile');
      } else {
        setError('videoFile', {
          type: 'manual',
          message: 'Please select a valid video file'
        });
      }
      e.dataTransfer.clearData();
    }
  }, [setValue, setError, clearErrors]);

  // Upload video to Cloudinary
  const onSubmit = async (data) => {
    const file = data.videoFile[0];
    
    setUploading(true);
    setUploadProgress(0);
    clearErrors();

    try {
      // Step 1: Get upload signature from backend
      const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
      const { signature, timestamp, public_id, api_key, cloud_name, upload_url } = signatureResponse.data;

      // Step 2: Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', public_id);
      formData.append('api_key', api_key);

      // Step 3: Upload directly to Cloudinary
      const uploadResponse = await axios.post(upload_url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      const cloudinaryResult = uploadResponse.data;

      // Step 4: Save video metadata to backend
      const metadataResponse = await axiosClient.post('/video/save', {
        problemId: problemId,
        cloudinaryPublicId: cloudinaryResult.public_id,
        secureUrl: cloudinaryResult.secure_url,
        duration: cloudinaryResult.duration,
      });

      setUploadedVideo(metadataResponse.data.videoSolution);
      reset(); // Reset form after successful upload
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('root', {
        type: 'manual',
        message: err.response?.data?.message || 'Upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger file input click
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-2xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-center">
            <h1 className="text-3xl font-bold text-white">Upload Video Solution</h1>
            <p className="text-purple-200 mt-2">Share your solution for problem #{problemId}</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Drag and Drop Area */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? 'border-indigo-400 bg-indigo-900/20 scale-105' 
                    : errors.videoFile 
                      ? 'border-red-400 bg-red-900/20' 
                      : 'border-gray-600 hover:border-indigo-500 bg-gray-700/50 hover:bg-gray-700'
                  }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileClick}
              >
                <input
                  type="file"
                  accept="video/*"
                  {...register('videoFile', {
                    required: 'Please select a video file',
                    validate: {
                      isVideo: (files) => {
                        if (!files || !files[0]) return 'Please select a video file';
                        const file = files[0];
                        return file.type.startsWith('video/') || 'Please select a valid video file';
                      },
                      fileSize: (files) => {
                        if (!files || !files[0]) return true;
                        const file = files[0];
                        const maxSize = 100 * 1024 * 1024; // 100MB
                        return file.size <= maxSize || 'File size must be less than 100MB';
                      }
                    }
                  })}
                  ref={(e) => {
                    fileInputRef.current = e;
                    register('videoFile').ref(e);
                  }}
                  className="hidden"
                  disabled={uploading}
                />
                
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 bg-indigo-700 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-xl font-medium text-white">
                      {selectedFile ? selectedFile.name : 'Drag & drop your video here'}
                    </p>
                    <p className="text-gray-400 mt-2">
                      {selectedFile 
                        ? `Size: ${formatFileSize(selectedFile.size)}` 
                        : 'or click to browse files (max 100MB)'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {errors.videoFile && (
                <div className="animate-pulse bg-red-900/30 border border-red-700 rounded-xl p-4">
                  <p className="text-red-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {errors.videoFile.message}
                  </p>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-4 bg-gray-700/50 p-6 rounded-2xl border border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Uploading your video...</span>
                    <span className="text-indigo-300 font-bold">{uploadProgress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-gray-400 text-sm">Please don't close this window while uploading</p>
                </div>
              )}

              {/* Error Message */}
              {errors.root && (
                <div className="animate-fade-in bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-300">{errors.root.message}</span>
                </div>
              )}

              {/* Success Message */}
              {uploadedVideo && (
                <div className="animate-fade-in bg-green-900/30 border border-green-700 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-700 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-300">Upload Successful!</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-gray-400">Duration</p>
                      <p className="text-white font-medium">{formatDuration(uploadedVideo.duration)}</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-gray-400">Uploaded At</p>
                      <p className="text-white font-medium">{new Date(uploadedVideo.uploadedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className={`relative overflow-hidden px-8 py-4 rounded-xl font-bold text-white transition-all duration-500
                    ${uploading || !selectedFile
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-700/50 transform hover:-translate-y-1'
                    }`}
                >
                  {uploading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Upload Video
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
          

        </div>
        <Link to="/admin/manage-video" className="pt-4 text-indigo-400 hover:underline">
  Back Manage Videos
</Link>
      </div>
      
    </div>
  );
};

export default UploadVideo;