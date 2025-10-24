'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContexts';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Character } from '@/types';
import CharacterCard from '../components/CharacterCard';
import Link from 'next/link';

export default function CharactersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadCharacters();
  }, [isAuthenticated, authLoading, router]);

  const loadCharacters = async () => {
    try {
      const chars = await api.getCharacters();
      setCharacters(chars);
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique universes for filter
  const universes = [...new Set(characters
    .map(char => char.universe)
    .filter(Boolean)
  )].sort();

  // Filter characters based on search and universe
  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.aliases.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesUniverse = !selectedUniverse || character.universe === selectedUniverse;
    
    return matchesSearch && matchesUniverse;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-black">Loading characters...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Characters</h1>
              <p className="text-gray-600 mt-2">
                Browse all {characters.length} characters in the database
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                ← Back to Game
              </Link>
              <Link
                href="/characters/add"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Add New Character
              </Link>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Characters
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by name or alias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Universe Filter */}
              <div>
                <label htmlFor="universe" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Universe
                </label>
                <select
                  id="universe"
                  value={selectedUniverse}
                  onChange={(e) => setSelectedUniverse(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Universes</option>
                  {universes.map(universe => (
                    <option key={universe} value={universe}>
                      {universe}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || selectedUniverse) && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedUniverse && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Universe: {selectedUniverse}
                    <button
                      onClick={() => setSelectedUniverse('')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedUniverse('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Characters Grid */}
          {filteredCharacters.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl text-gray-300 mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {characters.length === 0 ? 'No characters yet' : 'No characters found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {characters.length === 0 
                  ? 'Get started by adding your first character!' 
                  : 'Try adjusting your search or filters'
                }
              </p>
              <Link
                href="/characters/add"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 font-medium"
              >
                Add Your First Character
              </Link>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredCharacters.length} of {characters.length} characters
              </div>

              {/* Characters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCharacters.map((character) => (
                  <CharacterCard 
                    key={character.id}
                    character={character}
                    onClick={() => router.push(`/characters/${character.id}`)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Quick Stats */}
          {characters.length > 0 && (
            <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{characters.length}</div>
                  <div className="text-sm text-gray-600">Total Characters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{universes.length}</div>
                  <div className="text-sm text-gray-600">Universes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(characters.reduce((acc, char) => acc + (char.traits?.length || 0), 0) / characters.length)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Traits/Character</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(characters.flatMap(char => char.traits?.map(t => t.traitId) || [])).size}
                  </div>
                  <div className="text-sm text-gray-600">Unique Traits</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}