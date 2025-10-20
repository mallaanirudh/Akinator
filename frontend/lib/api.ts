import { GameResponse, Session, Character } from '@/types';

const API_BASE_URL = 'http://localhost:4000/api';

export const api = {
  // Start new game
  startGame: async (userId: string): Promise<GameResponse> => {
    const response = await fetch(`${API_BASE_URL}/game/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to start game');
    }
    
    return response.json();
  },

  // Submit answer
  submitAnswer: async (
    sessionId: string, 
    questionId: string, 
    answer: string
  ): Promise<GameResponse> => {
    const response = await fetch(`${API_BASE_URL}/game/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, questionId, answer }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }
    
    return response.json();
  },

  // Get session details
  getSession: async (sessionId: string): Promise<{ session: Session }> => {
    const response = await fetch(`${API_BASE_URL}/game/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get session');
    }
    
    return response.json();
  },

  // Correct guess
  correctGuess: async (sessionId: string, correctCharacterId: string): Promise<{ message: string; learned: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/game/correct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, correctCharacterId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit correction');
    }
    
    return response.json();
  },

  // End game
  endGame: async (sessionId: string): Promise<{ message: string; session: Session }> => {
    const response = await fetch(`${API_BASE_URL}/game/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to end game');
    }
    
    return response.json();
  },
};