'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';

/**
 * "Continue with Google" (Google Identity Services — free).
 * Renders nothing when GOOGLE_CLIENT_ID is not configured on the server.
 */
export default function GoogleButton({ mode = 'login', role = 'client', providerType = 'Dietician', onSuccess, onError }) {
  const divRef = useRef(null);
  const opts = useRef({ role, providerType });
  const [clientId, setClientId] = useState(null);
  opts.current = { role, providerType };

  useEffect(() => {
    api('/api/auth/config').then((d) => setClientId(d.googleClientId)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId) return;
    const init = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const d = await api('/api/auth/google', { method: 'POST', body: { credential, mode, ...opts.current } });
            onSuccess?.(d);
          } catch (e) {
            onError?.(e.message);
          }
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'outline', size: 'large', shape: 'pill', width: Math.min(400, divRef.current?.offsetWidth || 320),
        text: mode === 'signup' ? 'signup_with' : 'continue_with',
      });
    };
    if (window.google?.accounts?.id) return init();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = init;
    document.body.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, mode]);

  if (!clientId) return null;
  return (
    <div>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><div className="h-px flex-1 bg-slate-200" />or<div className="h-px flex-1 bg-slate-200" /></div>
      <div ref={divRef} className="flex w-full justify-center" />
    </div>
  );
}
