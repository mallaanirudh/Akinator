'use client';

import { useState } from 'react';
import AddCharacterForm from './AddCharacterForm';

type CreateTraitFormProps = {
  userId: string;
  onSuccess?: () => void;
};

function CreateTraitForm({ userId, onSuccess }: CreateTraitFormProps) {
  const [traitName, setTraitName] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // TODO: replace with real API call to create a trait for userId
    console.log('Create trait', { userId, traitName });
    setTraitName('');
    onSuccess && onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Trait Name</label>
        <input
          value={traitName}
          onChange={(e) => setTraitName(e.target.value)}
          className="mt-1 block w-full border rounded-md p-2"
        />
      </div>
      <div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Create Trait
        </button>
      </div>
    </form>
  );
}

interface CharacterManagerProps {
  userId: string;
}

type ActiveTab = 'add-character' | 'create-trait';

export default function CharacterManager({ userId }: CharacterManagerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('add-character');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('add-character')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'add-character'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Add Character
          </button>
          <button
            onClick={() => setActiveTab('create-trait')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create-trait'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create Trait
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'add-character' && (
          <AddCharacterForm 
            userId={userId} 
            onSuccess={() => console.log('Character added successfully')}
          />
        )}
        
        {activeTab === 'create-trait' && (
          <CreateTraitForm 
            userId={userId}
            onSuccess={() => console.log('Trait created successfully')}
          />
        )}
      </div>
    </div>
  );
}