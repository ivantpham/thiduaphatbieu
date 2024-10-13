import logo from './logo.svg';
import './App.css';
import Home from './component/Home';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <UserProvider>
          <Home />
        </UserProvider>
      </header>
    </div>
  );
}

export default App;
