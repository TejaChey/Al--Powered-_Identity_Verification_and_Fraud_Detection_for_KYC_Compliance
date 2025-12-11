import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Login from './Login';
import SignUp from './SignUp';
import Dashboard from './Dashboard';


import { ToastProvider } from "./contexts/ToastContext";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;

