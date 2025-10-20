import type { GuessResult } from '@/types';
import CharacterCard from './CharacterCard';

interface GuessResultProps {
  guess: GuessResult;
  onCorrect: (characterId: string) => void;
  onWrong: () => void;
}

export default function GuessResult({ guess, onCorrect, onWrong }: GuessResultProps) {
  const confidenceColor = guess.confidence > 0.7 
    ? 'text-green-600' 
    : guess.confidence > 0.4 
    ? 'text-yellow-600' 
    : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🤔</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          I think I know who it is!
        </h2>
        <p className="text-gray-600">
          Confidence: <span className={`font-bold ${confidenceColor}`}>
            {(guess.confidence * 100).toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Main Guess */}
      <div className="mb-6">
        <CharacterCard 
          character={guess.character} 
          probability={guess.confidence}
          isSelected={true}
        />
      </div>

      {/* Other Possibilities */}
      {guess.topChoices.length > 1 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Other possibilities:</h3>
          <div className="grid gap-3">
            {guess.topChoices.slice(1).map((choice, index) => (
              <CharacterCard 
                key={choice.character.id}
                character={choice.character}
                probability={choice.probability}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button
          onClick={() => onCorrect(guess.character.id)}
          className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
        >
          ✅ Correct!
        </button>
        <button
          onClick={onWrong}
          className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
        >
          ❌ Wrong, try again
        </button>
      </div>
    </div>
  );
}