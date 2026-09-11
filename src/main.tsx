import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root 엘리먼트를 찾지 못했습니다. index.html 을 확인해 주세요.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
