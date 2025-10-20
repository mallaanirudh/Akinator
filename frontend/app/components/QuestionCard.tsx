import { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions?: number;
}

export default function QuestionCard({ 
  question, 
  questionNumber,
  totalQuestions 
}: QuestionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-semibold text-gray-500">
          Question {questionNumber}
          {totalQuestions && ` of ${totalQuestions}`}
        </div>
        {question.popularity && (
          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Popularity: {(question.popularity * 100).toFixed(0)}%
          </div>
        )}
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        {question.text}
      </h2>
      
      {question.displayName && (
        <div className="text-center text-sm text-gray-500">
          Trait: {question.displayName}
        </div>
      )}
    </div>
  );
}