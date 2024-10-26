import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Cập nhật import
import './App.css';
import Home from './component/Home'; // Giả sử bạn vẫn giữ Home
import Login from './component/Login'; // Thay thế bằng các component khác bạn có
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <Router> {/* Bọc toàn bộ ứng dụng trong Router */}
      <div className="App">
        <header className="App-header">
          <UserProvider>
            <Routes> {/* Sử dụng Routes thay cho Switch */}
              <Route path="/" element={<Home />} /> {/* Route cho Home */}
              <Route path="/login" element={<Login />} /> {/* Thay thế bằng các Route khác */}
              {/* Bạn có thể thêm nhiều Route khác nếu cần */}
            </Routes>
          </UserProvider>
        </header>
      </div>
    </Router>
  );
}

export default App;
