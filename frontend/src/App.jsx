import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import OAuthCallback from './components/OAuthCallback';
import ProjectDisplay from './components/ProjectDisplay';
import { ValueContext, ValueProvider } from './contexts/ValueContext';
import Result from './components/Result';




function App() {


  return (

    <Router>
      <Routes>

        <Route path="/" element={<RegisterForm />} />
        <Route path="/oauth2callback" element={<OAuthCallback />} />
        <Route path="/project" element={<ProjectDisplay />} />
        <Route path="/result" element={<Result />} />

        


      </Routes>
    </Router>

   
  );
}

export default App;




// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { ValueProvider } from './contexts/ValueContext';
// import Form from './components/Form';
// import Result from './components/Result';

// const App = () => {
//   return (
//     <ValueProvider>
//       <Router>
//         <Routes>
//           <Route path="/" exact component={Form} />
//           <Route path="/result" component={Result} />
//         </Routes>
//       </Router>
//     </ValueProvider>
//   );
// };

// export default App;
