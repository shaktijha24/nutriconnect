'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle, ShieldCheck, Lock } from 'lucide-react';
import { api } from '@/lib/client';
import { Alert } from './ui';

/**
 * Live chat (refreshes every 3 s while open). Used for booking sessions and hearings.
 * endpoint: GET returns { messages }, POST { text } sends.
 */
export default function ChatBox({ endpoint, me, enabled = true, disabledText = 'Chat is closed.', title = 'Live chat', note, pollMs = 3000, height = 'h-80' }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [sending, setSending] = useState(false);
  const boxRef = useRef(null);

  async function load() {
    try {
      const d = await api(endpoint);
      setMessages(d.messages);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, enabled ? pollMs : pollMs * 4);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, enabled]);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const d = await api(endpoint, { method: 'POST', body: { text } });
      setWarning(d.warning || '');
      setText('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2 font-semibold"><MessageCircle className="h-4 w-4 text-brand-600" /> {title}</div>
        {enabled
          ? <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Live</span>
          : <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"><Lock className="h-3 w-3" />Closed</span>}
      </div>
      <div ref={boxRef} className={`${height} space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4`}>
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-sm text-slate-500">
            <p>{enabled ? 'No messages yet. Say hello!' : 'No messages yet.'}</p>
          </div>
        )}
        {messages.map((m) => {
          const mine = String(m.sender?._id) === String(me);
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-white text-ink'} ${m.flagged ? 'ring-2 ring-red-300' : ''}`}>
                {!mine && <p className="mb-0.5 text-[11px] font-semibold text-brand-700">{m.sender?.name}</p>}
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                  {new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  {m.flagged && ' · flagged'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2 border-t border-slate-100 p-3">
        <Alert kind="warn">{warning}</Alert>
        <Alert>{error}</Alert>
        {enabled ? (
          <form onSubmit={send} className="flex gap-2">
            <input className="input" placeholder="Write a message…" value={text} maxLength={1000} onChange={(e) => { setText(e.target.value); setError(''); }} />
            <button className="btn-primary px-3" disabled={sending || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
          </form>
        ) : (
          <p className="text-center text-xs text-slate-500">{disabledText}</p>
        )}
        {note !== null && (
          <p className="flex items-center gap-1 text-[11px] text-slate-400"><ShieldCheck className="h-3 w-3 shrink-0" />
            {note || 'Sharing phone numbers is not allowed. Disrespectful messages are reported to the admin.'}</p>
        )}
      </div>
    </div>
  );
}
