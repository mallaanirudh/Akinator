// Make sure the path is correct; adjust if needed, for example:
import GameSession from '../../components/GameSession';

interface GamePageProps {
  params: Promise< {
    sessionId: string;
  }>;
}

export default async  function GamePage({ params }: GamePageProps) {
  const userId = "user-" + Date.now(); // Temporary user ID
 const {sessionId} = await params;
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <GameSession sessionId={sessionId} userId={userId} />
      </div>
    </div>
  );
}