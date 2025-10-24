import { Character } from '@/types';

interface CharacterCardProps {
  character?: Character | null;
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
  // Safety check - if character is undefined or null, show fallback
  if (!character) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="text-gray-500 text-center">Character data unavailable</div>
      </div>
    );
  }

  // Safe destructuring with fallbacks
  const safeCharacter = {
    name: character.name || 'Unknown Character',
    universe: character.universe,
    aliases: character.aliases || [],
    traits: character.traits || []
  };

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
          <h3 className="font-bold text-black">{safeCharacter.name}</h3>
          {safeCharacter.universe && (
            <p className="text-sm text-black">{safeCharacter.universe}</p>
          )}
          {safeCharacter.aliases.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              AKA: {safeCharacter.aliases.join(', ')}
            </p>
          )}
        </div>
        {probability !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {(probability * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-black">confidence</div>
          </div>
        )}
      </div>
      
      {safeCharacter.traits.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-bold text-black mb-1">Traits:</div>
          <div className="flex flex-wrap gap-1">
            {safeCharacter.traits.slice(0, 4).map((trait) => (
              <span 
                key={trait.id}
                className="px-2 py-1 bg-gray-100 text-black rounded-full"
              >
                {trait.trait?.displayName || 'Trait'}: {trait.value}
              </span>
            ))}
            {safeCharacter.traits.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-black text-xs rounded-full">
                +{safeCharacter.traits.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}