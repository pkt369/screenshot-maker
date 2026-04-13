// Design Ref: §2.1 — BrowserRouter + Routes with device config routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IPHONE_CONFIG } from './devices/iphone';
import { IPAD_CONFIG } from './devices/ipad';
import { HomePage } from './home/HomePage';
import { ComposerPage } from './composer/ComposerPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/iphone" element={<ComposerPage deviceConfig={IPHONE_CONFIG} />} />
        <Route path="/ipad" element={<ComposerPage deviceConfig={IPAD_CONFIG} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
