import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate, Link } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Lock, Key, ArrowLeft, Code, Sparkles } from 'lucide-react';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password should be at least 8 characters")
    .max(20, "Password should not exceed 20 characters")
    .refine(val => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
      message: "Password must contain at least one special symbol (!@#$...)"
    }),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await axiosClient.post(`/user/reset-password/${token}`, {
        newPassword: data.newPassword
      });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-blue-500/10 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 5}s`
            }}
          />
        ))}
        
        {/* Binary rain animation */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-400/30 text-xs animate-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            >
              {Math.random() > 0.5 ? '1' : '0'}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden transform transition-all duration-500 hover:scale-[1.01]">
        <div className="p-8">
          <Link to="/" className="flex items-center text-xl font-bold text-white mb-2">
            <Code className="w-6 h-6 text-cyan-400 mr-2" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">CodeMaster</span>
          </Link>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400">Create a new password for your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400">New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  {...register('newPassword')}
                  placeholder="Enter your new password"
                  className="input input-bordered w-full bg-gray-800/50 border-gray-700/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 pl-10 pr-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors duration-200"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <label className="label">
                  <span className="label-text-alt text-red-400">{errors.newPassword.message}</span>
                </label>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400">Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register('confirmPassword')}
                  placeholder="Confirm your new password"
                  className="input input-bordered w-full bg-gray-800/50 border-gray-700/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 pl-10 pr-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors duration-200"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-red-400">{errors.confirmPassword.message}</span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-none text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.02] ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Reset Password
                </>
              )}
            </button>
          </form>

          <div className="divider text-gray-500 my-6">OR</div>

          <Link 
            to="/login" 
            className="btn btn-outline w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes drop {
          0% {
            transform: translateY(-100px);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        .animate-drop {
          animation: drop linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;