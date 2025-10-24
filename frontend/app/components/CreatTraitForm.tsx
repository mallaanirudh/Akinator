'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface CreateTraitFormProps {
  userId: string;
  onSuccess?: () => void;
}

type TraitType = 'BOOLEAN' | 'ENUM' | 'STRING';

export default function CreateTraitForm({ userId, onSuccess }: CreateTraitFormProps) {
  const [formData, setFormData] = useState({
    key: '',
    displayName: '',
    type: 'STRING' as TraitType,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'type' ? value as TraitType : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate form
    if (!formData.key.trim() || !formData.displayName.trim()) {
      setError('Trait key and display name are required');
      setIsLoading(false);
      return;
    }

    // Validate key format (snake_case)
    const keyRegex = /^[a-z][a-z0-9_]*$/;
    if (!keyRegex.test(formData.key)) {
      setError('Trait key must be in snake_case (lowercase letters, numbers, and underscores only)');
      setIsLoading(false);
      return;
    }

    try {
      await api.createTrait({
        key: formData.key,
        displayName: formData.displayName,
        type: formData.type,
        createdBy: userId
      });

      // Reset form
      setFormData({ key: '', displayName: '', type: 'STRING' });
      
      if (onSuccess) {
        onSuccess();
      }
      
      alert('Trait created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create trait');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Trait</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trait Key *
          </label>
          <input
            type="text"
            name="key"
            value={formData.key}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., has_super_strength"
            pattern="[a-z][a-z0-9_]*"
            title="Use snake_case format (lowercase letters, numbers, underscores only)"
          />
          <p className="text-sm text-gray-500 mt-1">
            Use snake_case (e.g., can_fly, is_human, has_magic). Must start with a letter.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name *
          </label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Has Super Strength"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="STRING">String</option>
            <option value="BOOLEAN">Boolean</option>
            <option value="ENUM">Enum</option>
          </select>
          <div className="text-sm text-gray-500 mt-1 space-y-1">
            <div><strong>Boolean:</strong> true/false values (yes/no questions)</div>
            <div><strong>String:</strong> Text values (descriptive traits)</div>
            <div><strong>Enum:</strong> Predefined options (multiple choice)</div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Trait...
            </span>
          ) : (
            'Create Trait'
          )}
        </button>
      </form>
    </div>
  );
}