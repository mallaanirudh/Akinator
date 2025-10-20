interface AnswerButtonsProps {
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

const ANSWER_OPTIONS = [
  { value: 'TRUE', label: 'Yes', emoji: '✅', color: 'bg-green-500 hover:bg-green-600' },
  { value: 'FALSE', label: 'No', emoji: '❌', color: 'bg-red-500 hover:bg-red-600' },
  { value: 'PROBABLY', label: 'Probably', emoji: '👍', color: 'bg-blue-500 hover:bg-blue-600' },
  { value: 'PROBABLY_NOT', label: 'Probably Not', emoji: '👎', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: 'UNKNOWN', label: "Don't Know", emoji: '❓', color: 'bg-gray-500 hover:bg-gray-600' },
];

export default function AnswerButtons({ onAnswer, disabled = false }: AnswerButtonsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
      {ANSWER_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onAnswer(option.value)}
          disabled={disabled}
          className={`p-4 rounded-lg text-white font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 ${
            option.color
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-2xl mb-1">{option.emoji}</div>
          <div>{option.label}</div>
        </button>
      ))}
    </div>
  );
}