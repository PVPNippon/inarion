// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import OAuthCallback from './components/OAuthCallback';
import ProjectDisplay from './components/ProjectDisplay';
import Result from './components/Result';
import { ValueProvider } from './contexts/ValueContext';

import { LoggedInUserProvider } from './contexts/LoggedInUserContext';
import NumberDisplay from './components/NumberDisplay';
import RegisteOrLogin from './components/RegisterOrLoginForm';
import LoggedInUserDetails from './components/LoggedInUserDetails';
import Logout from './components/Logout';
import ListMyDriveFiles from './components/ListMyDriveFiles';
import { NumProvider } from './contexts/NumContext';
import DisplayNumContextValue from './components/displayContextNum';
import FileSettings from './components/FileSettings';
import ListDomainUsers from './components/ListDomainUsers';

function App() {
  return (
    <ValueProvider>
      <LoggedInUserProvider>
        <NumProvider>
        <Router>
          <nav>
            <Link to="/">Home</Link>

            <Link to="/register">Register</Link>
            <Link to="/display">Display Number</Link>
            <Link to="/profile">Profile</Link>
            {/* Link to the logout route */}
            <Link to="/mydrive-files">List My Drive Files</Link> {/* Link to the logout route */}
            <Link to="/display-num-context">Display Num Context Value</Link>
            <Link to="/users">List All Users</Link> 

          </nav>
          <Routes>
            {/* <Route path="/" element={<RegisterForm />} /> */}
            <Route path="/" element={<RegisteOrLogin />} />
            <Route path="/test-register" element={<RegisteOrLogin />} />
            <Route path = "/display-num-context" element ={<DisplayNumContextValue />} /> 
            <Route path="/oauth2callback" element={<OAuthCallback />} />
            <Route path="/project" element={<ProjectDisplay />} />
            <Route path="/result" element={<Result />} />
            <Route path="/register" element={<RegisteOrLogin />} />
            {/* <Route path="/display" element={<NumberDisplay />} /> */}
            <Route path="/profile" element={<LoggedInUserDetails />} />
            <Route path="/logout" element={<Logout />} /> {/* Logout route */}
            <Route path="/users" element={<ListDomainUsers />} />
            <Route path="/mydrive-files" element={<ListMyDriveFiles />} /> {/* Home route displays list of files */}
            <Route path="/mydrive-files/file-settings/:fileId" element={< FileSettings />}/>
          </Routes>
        </Router>
      </NumProvider>
      </LoggedInUserProvider>
    </ValueProvider>
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
