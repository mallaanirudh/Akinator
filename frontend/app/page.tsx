'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const startNewGame = async () => {
    if (!userId.trim()) {
      alert('Please enter a user ID');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.startGame(userId);
      router.push(`/game/${response.sessionId}`);
    } catch (error) {
      alert('Failed to start game');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Superhero Akinator
          </h1>
          <p className="text-gray-600">
            Think of a superhero or character, and I'll guess who it is!
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              Your User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter any unique ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && startNewGame()}
            />
          </div>

          <button
            onClick={startNewGame}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Starting Game...' : 'Start New Game'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Think of characters like:</p>
          <p className="font-semibold">Iron Man, Batman, Wonder Woman, Spider-Man...</p>
        </div>
      </div>
    </div>
  );
}