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

      const sessionParam = params.get('s');
      console.log('[App] URL session param:', sessionParam ? 'FOUND' : 'not found');

      if (sessionParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(sessionParam)));
          const form   = decoded.form;
          const result = decoded.result;
          if (form && result && result.threats) {
            console.log('[App] Session restored from URL');
            setFormData(form);
            setResultData(result);
            setPaid(true);
            setScreen(SCREENS.RESULTS);
            sendToGHL(form, result, true).catch(console.warn);
            window.history.replaceState({}, '', window.location.pathname);
            return;
          }
        } catch (e) {
          console.warn('[App] URL session decode failed:', e);
        }
      }

      const stored = localStorage.getItem('ts_s');
      console.log('[App] localStorage ts_s:', stored ? 'FOUND' : 'not found');

      if (stored) {
        try {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(stored))));
          const form   = decoded.form;
          const result = decoded.result;
          if (form && result && result.threats) {
            console.log('[App] Session restored from localStorage');
            setFormData(form);
            setResultData(result);
            setPaid(true);
            setScreen(SCREENS.RESULTS);
            sendToGHL(form, result, true).catch(console.warn);
            window.history.replaceState({}, '', window.location.pathname);
            localStorage.removeItem('ts_s');
            return;
          }
        } catch (e) {
          console.warn('[App] localStorage decode failed:', e);
        }
      }

      const savedForm = localStorage.getItem('ts_form_only');
      if (savedForm) {
        try {
          const form = JSON.parse(savedForm);
          console.log('[App] Re-running analysis for paid user');
          setFormData(form);
          setScreen(SCREENS.PROCESSING);
          classifyAndGenerate(form).then(result => {
            setResultData(result);
            setPaid(true);
            setScreen(SCREENS.RESULTS);
            sendToGHL(form, result, true).catch(console.warn);
            localStorage.removeItem('ts_form_only');
          }).catch(() => {
            localStorage.setItem('ts_paid_pending', 'true');
            setScreen(SCREENS.INTAKE);
          });
          window.history.replaceState({}, '', window.location.pathname);
          return;
        } catch (e) {
          console.warn('[App] Re-run failed:', e);
        }
      }

      console.warn('[App] No session — sending to intake as paid');
      localStorage.setItem('ts_paid_pending', 'true');
      window.history.replaceState({}, '', window.location.pathname);
      setScreen(SCREENS.INTAKE);
    }

    if (localStorage.getItem('ts_paid_pending') === 'true') {
      setPaid(true);
    }
  }, []);

  const handleIntakeSubmit = async (form) => {
    setFormData(form);
    setScreen(SCREENS.PROCESSING);
    setError('');
    try {
      const result = await classifyAndGenerate(form);
      setResultData(result);
      const isPaid = paid || localStorage.getItem('ts_paid_pending') === 'true';
      if (isPaid) {
        setPaid(true);
        localStorage.removeItem('ts_paid_pending');
      }
      setScreen(SCREENS.RESULTS);
    } catch (err) {
      console.error('[App] Analysis failed:', err);
      setError('Something went wrong analyzing your profile. Please try again.');
      setScreen(SCREENS.INTAKE);
    }
  };

  return (
    <>
      {screen === SCREENS.LANDING && (
        <Landing onStart={() => setScreen(SCREENS.INTAKE)} />
      )}
      {screen === SCREENS.INTAKE && (
        <>
          <Intake onSubmit={handleIntakeSubmit} />
          {error && (
            <p
              role="alert"
              style={{
                textAlign: 'center',
                padding: '0 1.5rem 2rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--orange)',
                letterSpacing: '0.06em',
              }}
            >
              {error}
            </p>
          )}
        </>
      )}
      {screen === SCREENS.PROCESSING && <Processing />}
      {screen === SCREENS.RESULTS && resultData && (
        <Results
          data={resultData}
          form={formData}
          paid={paid}
        />
      )}
    </>
  );
}
