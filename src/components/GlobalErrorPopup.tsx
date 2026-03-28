import { useState, useEffect } from 'react';

export default function GlobalErrorHandler() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Flag to prevent multiple popups
    let hasAlerted = false;

    const handleError = (msg: string) => {
      // Ignore non-critical or 3rd party script errors (like ads or extensions)
      if (
        msg.includes('extension') || 
        msg.includes('chrome-extension') ||
        msg.includes('Script error.')
      ) return;

      if (!hasAlerted) {
        hasAlerted = true;
        setErrorMsg(msg);
      }
    };

    const onWindowError = (event: ErrorEvent) => {
      handleError(event.message || 'Unknown runtime error occurred.');
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      let msg = 'Network or API request failed.';
      if (event.reason) {
        if (typeof event.reason === 'string') msg = event.reason;
        else if (event.reason.message) msg = event.reason.message;
      }
      handleError(msg);
    };

    const onCustomError = (event: Event) => {
      const customEvent = event as CustomEvent;
      handleError(customEvent.detail || 'Critical Feature Failure Detected.');
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('lazarus-error', onCustomError);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('lazarus-error', onCustomError);
    };
  }, []);

  if (!errorMsg) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-lazarus-black/80 backdrop-blur-sm animate-fade-in transition-opacity">
      <div className="bg-lazarus-dark border border-red-500/30 w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="font-serif text-xl text-lazarus-headline mb-2 font-bold tracking-wide">System Exception Module</h3>
          <p className="text-lazarus-muted text-xs sm:text-sm mb-2">Sebuah fitur atau API gagal memproses permintaan. Demi keamanan, sistem menghentikan operasi terkait.</p>
          
          <div className="w-full bg-lazarus-black/50 border border-lazarus-border/30 rounded p-3 mb-6 flex text-left font-mono text-[9px] text-red-400/80 overflow-hidden break-all">
            <span className="font-bold mr-2 text-lazarus-muted">ERR_LOG:</span> {errorMsg}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              onClick={() => setErrorMsg(null)}
              className="px-4 py-2 flex-1 rounded text-xs font-bold tracking-widest uppercase border border-lazarus-border hover:bg-lazarus-black transition-colors"
            >
              Abaikan
            </button>
            <a 
              href="https://www.instagram.com/lazarusreport/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 flex-1 rounded text-xs font-bold tracking-widest uppercase bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors"
            >
              Lapor (IG)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
