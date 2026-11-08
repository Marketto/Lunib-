import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/literata';
import '@fontsource-variable/literata/wght-italic.css';
import '@fontsource-variable/onest';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
