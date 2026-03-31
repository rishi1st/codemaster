// components/LoadingSpinner.jsx
const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="loading loading-dots loading-lg text-blue-500"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;