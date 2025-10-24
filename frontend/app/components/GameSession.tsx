'use client';

import { useState, useEffect } from 'react';
import { GameResponse, Question, GuessResult, TopChoice } from '@/types';
import { api } from '@/lib/api';
import QuestionCard from './QuestionCard';
import AnswerButtons from './AnswerButton';
import GuessResultCard from './GuessResult';
import CharacterCard from './CharacterCard';

interface GameSessionProps {
  sessionId: string;
  userId: string;
}

type GameState = {
  currentQuestion?: Question;
  guess?: GuessResult;
  topChoices: TopChoice[];
  answersCount: number;
  currentConfidence: number;
  isLoading: boolean;
  error?: string;
};

export default function GameSession({ sessionId, userId }: GameSessionProps) {
  const [gameState, setGameState] = useState<GameState>({
    topChoices: [],
    answersCount: 0,
    currentConfidence: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (sessionId) {
      loadGame();
    }
  }, [sessionId]);

  const loadGame = async () => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true, error: undefined }));
      const response = await api.getGameState(sessionId);
      handleGameResponse(response);
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'Failed to load game session',
        isLoading: false 
      }));
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!gameState.currentQuestion) return;

    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      const response = await api.submitAnswer(
        sessionId,
        gameState.currentQuestion.id,
        answer
      );
      handleGameResponse(response);
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'Failed to submit answer',
        isLoading: false 
      }));
    }
  };

  const handleGameResponse = (response: GameResponse) => {
    setGameState({
      currentQuestion: response.question,
      guess: response.guess,
      topChoices: response.topChoices || [],
      answersCount: response.answersCount || 0,
      currentConfidence: response.currentConfidence || 0,
      isLoading: false,
    });
  };

  const handleCorrectGuess = async (characterId: string) => {
    try {
      await api.correctGuess(sessionId, characterId);
      alert('Thanks for the correction! The AI will learn from this.');
      window.location.href = '/';
    } catch (error) {
      alert('Failed to submit correction');
    }
  };

  const handleWrongGuess = () => {
    alert("I'll try to guess better next time!");
    window.location.href = '/';
  };

  if (gameState.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Thinking...</div>
      </div>
    );
  }

  if (gameState.error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {gameState.error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      
      {/* Progress Section - Top */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Character Guesser</h2>
            <p className="text-gray-600">Questions: {gameState.answersCount}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {(gameState.currentConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Confidence</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(gameState.answersCount * 10, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Main Game Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {gameState.guess ? (
          <GuessResultCard 
            guess={gameState.guess}
            onCorrect={handleCorrectGuess}
            onWrong={handleWrongGuess}
          />
        ) : gameState.currentQuestion ? (
          <div className="space-y-6">
            <QuestionCard 
              question={gameState.currentQuestion}
              questionNumber={gameState.answersCount + 1}
            />
            <AnswerButtons onAnswer={handleAnswer} />
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤔</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No questions available</h3>
            <p className="text-gray-600">Please try starting a new game.</p>
          </div>
        )}
      </div>

      {/* All Character Cards - Bottom */}
      {gameState.topChoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-bold text-black text-lg mb-4">Possible Characters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameState.topChoices.map((choice, index) => (
              <CharacterCard 
                key={choice.character.id}
                character={choice.character}
                probability={choice.probability}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}