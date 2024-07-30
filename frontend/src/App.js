import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import OAuthCallback from './components/OAuthCallback';
import ProjectDisplay from './components/ProjectDisplay';

const Test = () => {
  return (
    <div>Testing</div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegisterForm />} />
        <Route path='/test' element= {<Test />}/>
        <Route path="/oauth2callback" element={<OAuthCallback />} />
        <Route path="/project" element={<ProjectDisplay />} />

      </Routes>
    </Router>
  );
}

export default App;
