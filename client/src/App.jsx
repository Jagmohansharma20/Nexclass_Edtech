
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/pages/Home';
import ClassRoom from './components/pages/ClassRoom';
import './App.css'
import { useEffect } from 'react';
function App() {
  

  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element ={<Home  className='app'/>} />
      <Route path='/room/:roomId' element ={<ClassRoom/>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App
