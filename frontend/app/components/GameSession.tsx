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
      const response = await api.getSession(sessionId);
      // If no current question, get next one
      if (!gameState.currentQuestion && !gameState.guess) {
        const gameResponse = await api.startGame(userId);
        handleGameResponse(gameResponse);
      }
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
      // Start new game or redirect
      window.location.href = '/';
    } catch (error) {
      alert('Failed to submit correction');
    }
  };

  const handleWrongGuess = () => {
    // Continue with more questions or handle differently
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
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Questions: {gameState.answersCount}</span>
          <span>Confidence: {(gameState.currentConfidence * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(gameState.answersCount * 10, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Current Question or Guess */}
      {gameState.guess ? (
        <GuessResultCard 
          guess={gameState.guess}
          onCorrect={handleCorrectGuess}
          onWrong={handleWrongGuess}
        />
      ) : gameState.currentQuestion ? (
        <>
          <QuestionCard 
            question={gameState.currentQuestion}
            questionNumber={gameState.answersCount + 1}
          />
          <AnswerButtons onAnswer={handleAnswer} />
        </>
      ) : (
        <div className="text-center text-gray-500">
          No questions available
        </div>
      )}

      {/* Top Choices Sidebar */}
      {gameState.topChoices.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-700 mb-3">Current Top Guesses:</h3>
          <div className="grid gap-3">
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