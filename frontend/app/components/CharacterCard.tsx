import { Character } from '@/types';

interface CharacterCardProps {
  character: Character;
  probability?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function CharacterCard({ 
  character, 
  probability, 
  isSelected = false,
  onClick 
}: CharacterCardProps) {
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{character.name}</h3>
          {character.universe && (
            <p className="text-sm text-gray-600">{character.universe}</p>
          )}
          {character.aliases.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              AKA: {character.aliases.join(', ')}
            </p>
          )}
        </div>
        {probability !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {(probability * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">confidence</div>
          </div>
        )}
      </div>
      
      {character.traits.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-gray-500 mb-1">Traits:</div>
          <div className="flex flex-wrap gap-1">
            {character.traits.slice(0, 4).map((trait) => (
              <span 
                key={trait.id}
                className="px-2 py-1 bg-gray-100 text-xs rounded-full"
              >
                {trait.trait.displayName}: {trait.value}
              </span>
            ))}
            {character.traits.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                +{character.traits.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}