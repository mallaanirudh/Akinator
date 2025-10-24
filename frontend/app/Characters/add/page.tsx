'use client';

import { useAuth } from '.././../../contexts/AuthContexts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AddCharacterForm from '../../components/AddCharacterForm';

export default function AddCharacterPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSuccess = () => {
    // Optional: Redirect or show success message
    console.log('Character added successfully!');
    // You can redirect to characters list or show a toast notification
    // router.push('/characters');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Add New Character
            </h1>
            <p className="text-gray-600">
              Create a new character for the guessing game
            </p>
          </div>

          {/* Form */}
          <AddCharacterForm 
            userId={user.id} 
            onSuccess={handleSuccess}
          />

          {/* Navigation Links */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/characters')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Characters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}