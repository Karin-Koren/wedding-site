import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import Upload from './pages/Upload';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/guestbook" element={<div className="p-4">Guestbook Page</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
