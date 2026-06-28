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

    // Try all storage methods
    const session = 
      localStorage.getItem('ts_session') ||
      localStorage.getItem('ts_session_backup') ||
      sessionStorage.getItem('ts_session');

    console.log('[App] session:', session ? 'FOUND' : 'NOT FOUND');

    if (session) {
      try {
        const { form, result } = JSON.parse(atob(session));

        setFormData(form);
        setResultData(result);
        setPaid(true);
        setScreen(SCREENS.RESULTS);

        sendToGHL(form, result, true).catch(console.warn);
        window.history.replaceState({}, '', window.location.pathname);

        setTimeout(() => {
          localStorage.removeItem('ts_session');
          localStorage.removeItem('ts_session_backup');
          sessionStorage.removeItem('ts_session');
        }, 5000);

      } catch (e) {
        console.error('[App] Failed to restore session:', e);
        setScreen(SCREENS.INTAKE);
      }
    } else {
      console.warn('[App] No session found — sending to intake');
      window.history.replaceState({}, '', window.location.pathname);
      setScreen(SCREENS.INTAKE);
    }
  }
}, []);

  const handleIntakeSubmit = async (form) => {
    setFormData(form);
    setScreen(SCREENS.PROCESSING);
    setError('');

    try {
      const result = await classifyAndGenerate(form);
      setResultData(result);
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
