import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import MyPets from './components/MyPets';
import Schedule from './components/Schedule';
import NearbyVets from './components/NearbyVets';
import Settings from './components/Settings';
import './styles/styles.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/mypets" element={<MyPets />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/nearbyvets" element={<NearbyVets />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
