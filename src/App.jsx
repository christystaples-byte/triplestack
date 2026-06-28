import { useState, useEffect } from 'react';
import Landing    from './components/Landing.jsx';
import Intake     from './components/Intake.jsx';
import Processing from './components/Processing.jsx';
import Results    from './components/Results.jsx';
import { classifyAndGenerate, sendToGHL } from './api.js';

const SCREENS = {
  LANDING:    'landing',
  INTAKE:     'intake',
  PROCESSING: 'processing',
  RESULTS:    'results',
};

export default function App() {
  const [screen,     setScreen]     = useState(SCREENS.LANDING);
  const [formData,   setFormData]   = useState(null);
  const [resultData, setResultData] = useState(null);
  const [paid,       setPaid]       = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('paid') === 'true') {
      console.log('[App] paid=true detected');

      // First try session from URL parameter (most reliable)
      const sessionParam = params.get('s');
      console.log('[App] URL session param:', sessionParam ? 'FOUND' : 'not found');

      if (sessionParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(sessionParam)));
          const form   = decoded.form;
          const result = decoded.result;

          if (form && result && result.threats) {
            console.log('[App] Session restored from URL ✅');
            setFormData(form);
            setResultData(result);
            setPaid(true);
            setScreen(SCREENS.RESULTS);
            sendToGHL(form, result, true).catch(console.warn);
            window.history.replaceState({}, '',
