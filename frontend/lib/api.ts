import { 
  GameResponse, 
  Session, 
  Character, 
  Trait, 
  Question, 
  GuessResult, 
  TopChoice,
  AnswerLog 
} from '@/types';

const API_BASE_URL = 'http://localhost:4000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window === 'undefined') {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  // GAME ENDPOINTS
  startGame: async (userId: string): Promise<GameResponse> => {
    const response = await fetch(`${API_BASE_URL}/game/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to start game');
    }
    
    return response.json();
  },

  submitAnswer: async (
    sessionId: string, 
    questionId: string, 
    answer: string
  ): Promise<GameResponse> => {
    const response = await fetch(`${API_BASE_URL}/game/answer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, questionId, answer }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }
    
    return response.json();
  },

  getSession: async (sessionId: string): Promise<{ session: Session }> => {
    const response = await fetch(`${API_BASE_URL}/game/session/${sessionId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get session');
    }
    
    return response.json();
  },
  getGameState: async (sessionId: string): Promise<GameResponse> => {
  const response = await fetch(`${API_BASE_URL}/game/state/${sessionId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get game state');
  }
  
  return response.json();
},

  correctGuess: async (sessionId: string, correctCharacterId: string): Promise<{ message: string; learned: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/game/correct`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, correctCharacterId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit correction');
    }
    
    return response.json();
  },

  endGame: async (sessionId: string): Promise<{ message: string; session: Session }> => {
    const response = await fetch(`${API_BASE_URL}/game/end`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to end game');
    }
    
    return response.json();
  },

  // CHARACTER MANAGEMENT ENDPOINTS
  addCharacter: async (characterData: {
    name: string;
    universe?: string;
    traits: Array<{
      key: string;
      value: string | boolean;
      displayName?: string;
      type?: 'BOOLEAN' | 'ENUM' | 'STRING';
    }>;
    createdBy: string;
    aliases?: string[];
  }): Promise<{ message: string; character: Character }> => {
    const response = await fetch(`${API_BASE_URL}/characters`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(characterData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add character');
    }
    
    return response.json();
  },

  getCharacters: async (): Promise<Character[]> => {
    const response = await fetch(`${API_BASE_URL}/characters`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get characters');
    }
    
    return response.json();
  },

  getCharacterById: async (id: string): Promise<Character> => {
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Character not found');
      }
      throw new Error('Failed to get character');
    }
    
    return response.json();
  },

  // TRAIT MANAGEMENT ENDPOINTS
  getTraits: async (): Promise<Trait[]> => {
    const response = await fetch(`${API_BASE_URL}/traits`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get traits');
    }
    
    return response.json();
  },

  createTrait: async (traitData: {
    key: string;
    displayName: string;
    type?: 'BOOLEAN' | 'ENUM' | 'STRING';
    createdBy: string;
  }): Promise<{ message: string; trait: Trait }> => {
    const response = await fetch(`${API_BASE_URL}/traits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(traitData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create trait');
    }
    
    return response.json();
  },

  addTraitToCharacter: async (
    characterId: string, 
    traitData: {
      traitKey: string;
      value: string;
    }
  ): Promise<{ message: string; characterTrait: any }> => {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}/traits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(traitData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add trait to character');
    }
    
    return response.json();
  },

  // CHARACTER SEARCH AND FILTERING
  searchCharacters: async (query: string, filters?: {
    universe?: string;
    traitFilters?: Array<{
      traitKey: string;
      value: string;
    }>;
  }): Promise<Character[]> => {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters?.universe) {
      params.append('universe', filters.universe);
    }
    
    if (filters?.traitFilters) {
      filters.traitFilters.forEach(filter => {
        params.append('traitKey', filter.traitKey);
        params.append('traitValue', filter.value);
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/characters/search?${params}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to search characters');
    }
    
    return response.json();
  },

  getCharactersByUniverse: async (universe: string): Promise<Character[]> => {
    const response = await fetch(`${API_BASE_URL}/characters/universe/${universe}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get characters by universe');
    }
    
    return response.json();
  },

  // ADVANCED TRAIT OPERATIONS
  getPopularTraits: async (limit?: number): Promise<Trait[]> => {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/traits/popular?${params}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get popular traits');
    }
    
    return response.json();
  },

  updateTrait: async (traitId: string, updates: {
    displayName?: string;
    type?: 'BOOLEAN' | 'ENUM' | 'STRING';
    popularity?: number;
    infoValue?: number;
  }): Promise<{ message: string; trait: Trait }> => {
    const response = await fetch(`${API_BASE_URL}/traits/${traitId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update trait');
    }
    
    return response.json();
  },

  // BULK OPERATIONS
  bulkAddCharacters: async (characters: Array<{
    name: string;
    universe?: string;
    traits: Array<{
      key: string;
      value: string | boolean;
      displayName?: string;
      type?: 'BOOLEAN' | 'ENUM' | 'STRING';
    }>;
    createdBy: string;
    aliases?: string[];
  }>): Promise<{ message: string; characters: Character[] }> => {
    const response = await fetch(`${API_BASE_URL}/characters/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ characters }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add characters in bulk');
    }
    
    return response.json();
  },

  // CHARACTER STATISTICS
  getCharacterStats: async (characterId: string): Promise<{
    traitCount: number;
    universe: string;
    aliasCount: number;
    createdAt: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}/stats`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get character statistics');
    }
    
    return response.json();
  },

  // GAME STATISTICS
  getGameStats: async (): Promise<{
    totalCharacters: number;
    totalTraits: number;
    totalSessions: number;
    mostPopularTraits: Trait[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/game/stats`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get game statistics');
    }
    
    return response.json();
  }
};

// Auth-specific API functions
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }
    
    return response.json();
  },

  register: async (email: string, password: string, name?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }
    
    return response.json();
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get profile');
    }
    
    return response.json();
  },

  updateProfile: async (updates: { name?: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }
    
    return response.json();
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to change password');
    }
    
    return response.json();
  }
};