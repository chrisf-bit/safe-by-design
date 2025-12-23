import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import Home from './pages/Home';
import FacilitatorView from './pages/FacilitatorView';
import TeamView from './pages/TeamView';

// Wrapper components to pass socket (Market Masters pattern)
function FacilitatorViewWrapper() {
  const socket = useSocket();
  return <FacilitatorView socket={socket} />;
}

function TeamViewWrapper() {
  const socket = useSocket();
  return <TeamView socket={socket} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/facilitator/:gameCode" element={<FacilitatorViewWrapper />} />
        <Route path="/team/:gameCode" element={<TeamViewWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
