import { Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateQuiz from './pages/CreateQuiz';
import AiChat from './pages/AiChat';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/ai-chat" element={<AiChat />} />
      </Routes>
    </div>
  );
}

export default App;