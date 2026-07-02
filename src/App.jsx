import { useState, useEffect } from 'react';
import Landing    from './components/Landing.jsx';
import Intake     from './components/Intake.jsx';
import Processing from './components/Processing.jsx';
import Results    from './components/Results.jsx';
import Unlock     from './components/Unlock.jsx';
import { classifyAndGenerate, sendToGHL, saveSession } from './api.js';

const SCREENS = {
  LANDING:    'landing',
  INTAKE:     'intake',
  PROCESSING: 'processing',
  RESULTS:    'results',
  UNLOCK:     'unlock',
};

export default function App() {
  const [screen,     setScreen]     = useState(SCREENS.LANDING);
  const [formData,   setFormData]   = useState(null);
  const [resultData, setResultData] = useState(null);
  const [paid,       setPaid]       = useState(false);
  const [error,      setError]      = useState('');
  const [unlockEmailHint, setUnlockEmailHint] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') !== 'true') return;

    console.log('[App] paid=true detected');
    const email = (params.get('email') || '').trim();

    // Fast synchronous fallbacks — only relevant if a session ever ends up
    // encoded directly in the URL or survives in localStorage. Harmless to
    // keep checking first since they resolve instantly with no network call.
    const sessionParam = params.get('s');
    if (sessionParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(sessionParam)));
        if (decoded.form && decoded.result?.threats) {
          setFormData(decoded.form);
          setResultData(decoded.result);
          setPaid(true);
          setScreen(SCREENS.RESULTS);
          sendToGHL(decoded.form, decoded.result, true).catch(console.warn);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }
      } catch (e) { console.warn('[App] URL session decode failed:', e); }
    }

    const stored = localStorage.getItem('ts_s');
    if (stored) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(stored))));
        if (decoded.form && decoded.result?.threats) {
          setFormData(decoded.form);
          setResultData(decoded.result);
          setPaid(true);
          setScreen(SCREENS.RESULTS);
          sendToGHL(decoded.form, decoded.result, true).catch(console.warn);
          window.history.replaceState({}, '', window.location.pathname);
          localStorage.removeItem('ts_s');
          return;
        }
      } catch (e) { console.warn('[App] localStorage decode failed:', e); }
    }

    // Primary path: hand off to the dedicated Unlock screen. It looks up
    // the session by email (server-side, KV) and — if that email doesn't
    // match — walks the customer through confirming it, instead of
    // silently dropping them back at a blank intake form.
    window.history.replaceState({}, '', window.location.pathname);
    setUnlockEmailHint(email);
    setScreen(SCREENS.UNLOCK);
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
      // Save server-side immediately so a paid redirect can find it by
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
      {screen === SCREENS.UNLOCK && (
        <Unlock
          emailHint={unlockEmailHint}
          onUnlocked={(form, result) => {
            setFormData(form);
            setResultData(result);
            setPaid(true);
            setScreen(SCREENS.RESULTS);
            sendToGHL(form, result, true).catch(console.warn);
          }}
          onGiveUp={() => {
            localStorage.setItem('ts_paid_pending', 'true');
            setScreen(SCREENS.INTAKE);
          }}
        />
      )}
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
