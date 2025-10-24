'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '../contexts/AuthContexts';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, login, register } = useAuth();
  const router = useRouter();

  const startNewGame = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.startGame(user.id);
      router.push(`/game/${response.sessionId}`);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    //demo account or use a guest mode
    alert('Please sign in to start a game!');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Character Guesser
          </h1>
          <p className="text-gray-600">
            Think of a character, and I'll guess who it is!
          </p>
        </div>

        {isAuthenticated ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700 mb-2">
                Welcome back, <span className="font-semibold">{user?.name || user?.email}</span>!
              </p>
              <p className="text-sm text-gray-600">
                Ready to test my guessing skills?
              </p>
            </div>

            <button
              onClick={startNewGame}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting Game...
                </span>
              ) : (
                'Start New Game'
              )}
            </button>

            <div className="flex space-x-4">
              <Link
                href="/Characters"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium text-center transition-colors"
              >
                Browse Characters
              </Link>
              <Link
                href="/Characters/add"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center transition-colors"
              >
                Teach a character
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Sign in to start playing the character guessing game!
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors block text-center"
              >
                Sign In
              </Link>
              
              <Link
                href="/auth/signup"
                className="w-full bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 py-3 px-6 rounded-lg font-semibold text-lg transition-colors block text-center"
              >
                Create Account
              </Link>
            </div>

            <div className="text-center">
              <button
                onClick={handleQuickDemo}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Or try a quick demo
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Think of characters like:</p>
          <p className="font-semibold">Superman, Harry Potter, Sherlock Holmes...</p>
        </div>

        {isAuthenticated && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-center space-x-4 text-sm">
              <Link href="/Characters/add" className="text-blue-600 hover:text-blue-800">
                Characters
              </Link>
              <Link href="/Characters/add" className="text-blue-600 hover:text-blue-800">
                Add Character
              </Link>
              <button 
                onClick={() => {/* Add logout functionality */}}
                className="text-gray-600 hover:text-gray-800"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}