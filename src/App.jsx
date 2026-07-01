import { useState, useEffect } from 'react';
import Landing    from './components/Landing.jsx';
import Intake     from './components/Intake.jsx';
import Processing from './components/Processing.jsx';
import Results    from './components/Results.jsx';
import { classifyAndGenerate, sendToGHL, saveSession, fetchSession } from './api.js';

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
    if (params.get('paid') !== 'true') return;

    console.log('[App] paid=true detected');
    const email = params.get('email');

    const restore = async () => {
      // Primary path: look up the session we saved server-side (KV) at
      // intake-submit time, keyed by email. This is the fix — it doesn't
      // depend on localStorage or the URL surviving the GHL redirect.
      if (email) {
        console.log('[App] Looking up session for', email);
        const session = await fetchSession(email);
        if (session?.form && session?.result?.threats) {
          console.log('[App] Session restored from server (KV)');
          setFormData(session.form);
          setResultData(session.result);
          setPaid(true);
          setScreen(SCREENS.RESULTS);
          sendToGHL(session.form, session.result, true).catch(console.warn);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }
        console.warn('[App] No server session found for', email);
      }

      // Fallback: session encoded directly in the URL (in case it was
      // ever wired up upstream, or for manual testing).
      const sessionParam = params.get('s');
      if (sessionParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(sessionParam)));
          const form   = decoded.form;
          const result = decoded.result;
          if (form && result && result.threats) {
            console.log('[App] Session restored from URL param');
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

      // Fallback: localStorage (works if same-tab, same-browser, and the
      // redirect didn't wipe it — not reliable, kept only as a last resort).
      const stored = localStorage.getItem('ts_s');
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

      // Last resort: send to intake, flagged as paid, so at least the next
      // successful analysis unlocks immediately instead of losing the sale.
      console.warn('[App] No session found anywhere — sending to intake as paid');
      localStorage.setItem('ts_paid_pending', 'true');
      window.history.replaceState({}, '', window.location.pathname);
      setScreen(SCREENS.INTAKE);
    };

    restore();
  }, []);

  useEffect(() => {
    if (localStorage.getItem('ts_paid_pending') === 'true') {
      setPaid(true);
    }
  }, []);

  const handleIntakeSubmit = async (form) => {
    setFormData(form);
    setScreen(SCREENS.PROCESSING);
    setError('');
    try {
      const isPaid = paid || localStorage.getItem('ts_paid_pending') === 'true';
      const result = await classifyAndGenerate(form, isPaid);
      setResultData(result);
      // Save server-side immediately so the paid redirect can find it by
      // email later, regardless of whether they buy now or after leaving.
      saveSession(form, result).catch(console.warn);
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
