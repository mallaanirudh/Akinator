'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface TraitInput {
  key: string;
  value: string;
  displayName: string;
  type: 'BOOLEAN' | 'ENUM' | 'STRING';
}

interface AddCharacterFormProps {
  userId: string;
  onSuccess?: () => void;
}

export default function AddCharacterForm({ userId, onSuccess }: AddCharacterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    universe: '',
    aliases: '',
  });
  const [traits, setTraits] = useState<TraitInput[]>([
    { key: '', value: '', displayName: '', type: 'STRING' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTraitChange = (index: number, field: keyof TraitInput, value: string) => {
    setTraits(prev => prev.map((trait, i) => 
      i === index ? { 
        ...trait, 
        [field]: field === 'type' ? value as 'BOOLEAN' | 'ENUM' | 'STRING' : value 
      } : trait
    ));
  };

  const addTrait = () => {
    setTraits(prev => [...prev, { key: '', value: '', displayName: '', type: 'STRING' }]);
  };

  const removeTrait = (index: number) => {
    setTraits(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.name.trim()) {
      setError('Character name is required');
      setIsLoading(false);
      return;
    }

    const validTraits = traits.filter(trait => 
      trait.key.trim() && trait.value.trim() && trait.displayName.trim()
    );

    if (validTraits.length === 0) {
      setError('At least one trait is required');
      setIsLoading(false);
      return;
    }

    const keyRegex = /^[a-z][a-z0-9_]*$/;
    const invalidKeys = validTraits.filter(trait => !keyRegex.test(trait.key));
    if (invalidKeys.length > 0) {
      setError('Trait keys must be in snake_case format (lowercase letters, numbers, underscores only)');
      setIsLoading(false);
      return;
    }

    try {
      const processedTraits = validTraits.map(trait => ({
        key: trait.key,
        value: trait.type === 'BOOLEAN' ? 
          (trait.value.toLowerCase() === 'true' || trait.value.toLowerCase() === 'yes') : 
          trait.value,
        displayName: trait.displayName,
        type: trait.type
      }));

      await api.addCharacter({
        name: formData.name.trim(),
        universe: formData.universe.trim(),
        createdBy: userId,
        aliases: formData.aliases.split(',').map(alias => alias.trim()).filter(Boolean),
        traits: processedTraits
      });

      setFormData({ name: '', universe: '', aliases: '' });
      setTraits([{ key: '', value: '', displayName: '', type: 'STRING' }]);
      
      if (onSuccess) {
        onSuccess();
      }
      
      alert('Character added successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to add character');
    } finally {
      setIsLoading(false);
    }
  };

  const getValuePlaceholder = (type: string) => {
    switch (type) {
      case 'BOOLEAN':
        return 'e.g., true, false, yes, no';
      case 'ENUM':
        return 'e.g., option1, option2';
      default:
        return 'e.g., Flying, Super Strength';
    }
  };

  const getValueType = (type: string) => {
    switch (type) {
      case 'BOOLEAN':
        return 'text';
      case 'ENUM':
        return 'text';
      default:
        return 'text';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-0">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Add New Character</h2>
            <p className="text-purple-200/60">Create a character with unique traits and abilities</p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-xl mb-6 shadow-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Info */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Character Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., Superman"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Universe
                  </label>
                  <input
                    type="text"
                    name="universe"
                    value={formData.universe}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., DC Comics"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Aliases (comma separated)
                </label>
                <input
                  type="text"
                  name="aliases"
                  value={formData.aliases}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="e.g., Man of Steel, Clark Kent"
                />
                <p className="text-sm text-purple-200/50 mt-2">
                  Separate multiple aliases with commas
                </p>
              </div>
            </div>

            {/* Traits Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Traits</h3>
                <button
                  type="button"
                  onClick={addTrait}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-lg shadow-emerald-500/30 font-medium"
                >
                  + Add Trait
                </button>
              </div>

              <div className="space-y-4">
                {traits.map((trait, index) => (
                  <div key={index} className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm transition-all hover:bg-white/10">
                    <div className="flex justify-between items-center mb-5">
                      <h4 className="font-semibold text-white">Trait #{index + 1}</h4>
                      {traits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTrait(index)}
                          className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Key *
                        </label>
                        <input
                          type="text"
                          value={trait.key}
                          onChange={(e) => handleTraitChange(index, 'key', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="e.g., can_fly"
                          pattern="[a-z][a-z0-9_]*"
                          title="Use snake_case format (lowercase letters, numbers, underscores only)"
                        />
                        <p className="text-xs text-purple-200/50 mt-1.5">snake_case format</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Display Name *
                        </label>
                        <input
                          type="text"
                          value={trait.displayName}
                          onChange={(e) => handleTraitChange(index, 'displayName', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="e.g., Can Fly"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Value *
                        </label>
                        <input
                          type={getValueType(trait.type)}
                          value={trait.value}
                          onChange={(e) => handleTraitChange(index, 'value', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder={getValuePlaceholder(trait.type)}
                        />
                        {trait.type === 'BOOLEAN' && (
                          <p className="text-xs text-purple-200/50 mt-1.5">Use: true, false, yes, no</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Type
                        </label>
                        <select
                          value={trait.type}
                          onChange={(e) => handleTraitChange(index, 'type', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                        >
                          <option value="STRING" className="bg-slate-800">String</option>
                          <option value="BOOLEAN" className="bg-slate-800">Boolean</option>
                          <option value="ENUM" className="bg-slate-800">Enum</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white py-4 px-6 rounded-xl hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg shadow-purple-500/30"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Character...
                </span>
              ) : (
                'Add Character'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}