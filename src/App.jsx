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
      window.history.replaceState({}, '', window.location.pathname);

      // Try all storage keys
      const keys = ['ts_s', 'ts_session', 'ts_sid', 'triplestack_session'];
      let restored = false;

      for (const key of keys) {
        const raw = localStorage.getItem(key);
        console.log(`[App] localStorage.${key}:`, raw ? 'FOUND' : 'not found');
        if (raw) {
          try {
            let parsed;
            // Try direct JSON first
            try { parsed = JSON.parse(raw); } catch {
              // Try base64 decode
              parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
            }
            const form   = parsed.form   || parsed;
            const result = parsed.result || parsed;
            if (form && result && result.threats) {
              console.log('[App] Restored from', key);
              setFormData(form);
              setResultData(result);
              setPaid(true);
              setScreen(SCREENS.RESULTS);
              sendToGHL(form, result, true).catch(console.warn);
              localStorage.removeItem(key);
              restored = true;
              break;
            }
          } catch (e) {
            console.warn(`[App] Failed to parse ${key}:`, e);
          }
        }
      }

      if (!restored) {
        // Last resort — check if form data exists to re-run analysis
        const savedForm = localStorage.getItem('ts_form_only');
        if (savedForm) {
          try {
            const form = JSON.parse(savedForm);
            console.log('[App] Re-running analysis for paid user:', form.email);
            setFormData(form);
            setScreen(SCREENS.PROCESSING);
            classifyAndGenerate(form).then(result => {
              setResultData(result);
              setPaid(true);
              setScreen(SCREENS.RESULTS);
              sendToGHL(form, result, true).catch(console.warn);
              localStorage.removeItem('ts_form_only');
            }).catch(() => setScreen(SCREENS.INTAKE));
            return;
          } catch (e) {
            console.warn('[App] Re-run failed:', e);
          }
        }

        console.warn('[App] No session found — sending to paid intake');
        // Send to intake but pre-mark as paid
        localStorage.setItem('ts_paid_pending', 'true');
        setScreen(SCREENS.INTAKE);
      }
    }

    // Check if returning paid user filling intake again
    const paidPending = localStorage.getItem('ts_paid_pending');
    if (paidPending) {
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
      const isPaid = localStorage.getItem('ts_paid_pending') === 'true';
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
