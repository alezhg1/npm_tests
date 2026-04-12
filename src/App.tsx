import { Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateQuiz from './pages/CreateQuiz';
import AiChat from './pages/AiChat';
import StudentJoin from './pages/StudentJoin'; // <-- добавлено
import QuizSession from './pages/QuizSession';
import TeacherQuizMonitor from './pages/TeacherQuizMonitor'; // <-- Добавлено


function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/ai-chat" element={<AiChat />} />
        <Route path="/join" element={<StudentJoin />} /> {/* <-- добавлено */}
        <Route path="/quiz/:id" element={<QuizSession />} /> {/* <-- Добавлено */}
        <Route path="/teacher/monitor/:quizId" element={<TeacherQuizMonitor />} /> {/* <-- Добавлено */}
      </Routes>
    </div>
  );
}

export default App;