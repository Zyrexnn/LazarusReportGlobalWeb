import React, { useState, useEffect, useRef } from 'react';
import { getTranslation } from '../utils/i18n';

export default function HumanVerification({ lang = 'en' }: { lang?: string }) {
  const [stage, setStage] = useState<'selecting' | 'sliding' | 'coding' | 'verified' | 'hidden'>('hidden');
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [targetCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [error, setError] = useState(false);
  const [granted, setGranted] = useState(false);
  
  const t = getTranslation(lang as any);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ============================================
    // HUMAN VERIFICATION LOGIC - INDUSTRY STANDARD
    // ============================================
    
    // 1. SESSION TRACKING - Visit Count Logic
    // Detects new session (tab closed and reopened)
    const isNewSession = !sessionStorage.getItem('lazarus_session_active');
    
    if (isNewSession) {
      // Mark this session as active
      sessionStorage.setItem('lazarus_session_active', 'true');
      
      // Increment visit count in localStorage (persists across sessions)
      const currentVisits = parseInt(localStorage.getItem('lazarus_visit_count') || '0');
      const newVisits = currentVisits + 1;
      localStorage.setItem('lazarus_visit_count', newVisits.toString());

      console.log(`[Human Verification] Visit #${newVisits} detected`);

      // Trigger verification every 3 visits (Industry standard: balance security & UX)
      if (newVisits % 3 === 0) {
        console.log('[Human Verification] Visit threshold reached - verification required');
        localStorage.removeItem('lazarus_verified');
      }
    }

    // 2. INITIAL VERIFICATION CHECK
    const isVerified = localStorage.getItem('lazarus_verified');
    if (!isVerified) {
      setStage('selecting');
      document.body.style.overflow = 'hidden';
      console.log('[Human Verification] User not verified - showing verification modal');
    } else {
      setStage('verified');
      console.log('[Human Verification] User already verified');
    }

    // 3. SESSION TIMEOUT - 30 Minute Timer
    // Re-verify active users to prevent bot scraping with persistent connections
    // 30 minutes = optimal balance (not too short for readers, not too long for security)
    const SESSION_TIMEOUT = 1800000; // 30 minutes in milliseconds
    // For testing: use 10000 (10 seconds) instead
    
    const sessionTimeout = setTimeout(() => {
      console.log('[Human Verification] 30-minute session expired - re-verification required');
      localStorage.removeItem('lazarus_verified');
      setGranted(false);
      setStage('selecting');
      document.body.style.overflow = 'hidden';
    }, SESSION_TIMEOUT);

    // Cleanup on unmount
    return () => {
      clearTimeout(sessionTimeout);
    };
  }, []);

  // Slide Logic
  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;
      
      e.preventDefault(); // Prevent scrolling on touch devices
      
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const pos = ((clientX - rect.left) / rect.width) * 100;
      const clampedPos = Math.max(0, Math.min(100, pos));
      
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setSliderPos(clampedPos);
      });
      
      if (clampedPos >= 98) {
        setIsDragging(false);
        setSliderPos(100);
        handleVerificationSuccess();
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (sliderPos < 98) {
        // Smooth reset animation
        requestAnimationFrame(() => setSliderPos(0));
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, sliderPos]);

  // Code Logic
  const handleKeyClick = (num: string) => {
    if (inputCode.length < 4) {
      const newCode = inputCode + num;
      setInputCode(newCode);
      if (newCode.length === 4) {
        if (newCode === targetCode) {
          handleVerificationSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setInputCode('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  const handleVerificationSuccess = () => {
    setGranted(true);
    setTimeout(() => {
      setStage('verified');
      localStorage.setItem('lazarus_verified', 'true');
      document.body.style.overflow = '';
    }, 1500);
  };

  if (stage === 'verified' || stage === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-lazarus-black flex items-center justify-center p-4 font-mono overflow-hidden">
      {/* Tactical Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(var(--color-lazarus-gold) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lazarus-gold/5 to-transparent h-full w-full animate-pulse pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-lazarus-dark border border-lazarus-gold/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
        {/* Decorative Corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-lazarus-gold"></div>
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-lazarus-gold"></div>
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-lazarus-gold"></div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-lazarus-gold"></div>

        <div className="mb-8 text-center">
          <h2 className="text-lazarus-gold text-lg font-bold tracking-[0.2em] uppercase mb-2">{t.verification.title}</h2>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-lazarus-gold/40 to-transparent mb-4"></div>
          <p className="text-lazarus-muted text-[10px] uppercase tracking-widest">{granted ? t.verification.granted : t.verification.subtitle}</p>
        </div>

        <div className="space-y-6">
          {stage === 'selecting' && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setStage('sliding')}
                className="group relative h-20 bg-black/40 border border-lazarus-gold/20 hover:border-lazarus-gold/60 p-4 transition-all duration-300 overflow-hidden flex items-center gap-4"
              >
                <div className="w-10 h-10 border border-lazarus-gold/30 flex items-center justify-center bg-lazarus-gold/5 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-lazarus-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-lazarus-gold font-bold text-xs tracking-wider uppercase mb-1">{t.verification.methodSlide}</div>
                  <div className="text-lazarus-muted/40 text-[9px] uppercase tracking-tighter">Fast_Verification</div>
                </div>
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-1.5 h-1.5 rounded-full bg-lazarus-gold animate-ping"></div>
                </div>
              </button>

              <button 
                onClick={() => setStage('coding')}
                className="group relative h-20 bg-black/40 border border-lazarus-gold/20 hover:border-lazarus-gold/60 p-4 transition-all duration-300 overflow-hidden flex items-center gap-4"
              >
                <div className="w-10 h-10 border border-lazarus-gold/30 flex items-center justify-center bg-lazarus-gold/5 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-lazarus-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.14-5.114l-2.236-2.236m12.489-4.413a19.271 19.271 0 012.115 10.518M12 7V3m0 2.807a9.046 9.046 0 015.701 5.912" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-lazarus-gold font-bold text-xs tracking-wider uppercase mb-1">{t.verification.methodCode}</div>
                  <div className="text-lazarus-muted/40 text-[9px] uppercase tracking-tighter">Manual_Code_Entry</div>
                </div>
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-1.5 h-1.5 rounded-full bg-lazarus-gold animate-ping"></div>
                </div>
              </button>
            </div>
          )}

          {stage === 'sliding' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div 
                ref={sliderRef}
                className="relative h-14 bg-black/50 border border-lazarus-gold/20 rounded-none overflow-hidden touch-none select-none"
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-lazarus-gold/10 will-change-[width]"
                  style={{ 
                    width: `${sliderPos}%`,
                    transition: isDragging ? 'none' : 'width 0.3s ease-out'
                  }}
                ></div>
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-lazarus-gold/40 text-[10px] uppercase tracking-[0.3em] font-bold px-4 text-center">
                    {t.verification.slide}
                  </span>
                </div>

                <div 
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  className="absolute top-1 bottom-1 w-12 bg-lazarus-gold cursor-grab active:cursor-grabbing flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] will-change-[left,transform]"
                  style={{ 
                    left: `calc(${sliderPos}% - ${sliderPos > 50 ? '48px' : '0px'})`, 
                    transform: sliderPos > 90 ? 'scale(0.95)' : 'scale(1)',
                    transition: isDragging ? 'none' : 'left 0.3s ease-out, transform 0.2s ease-out'
                  }}
                >
                  <div className="flex gap-1">
                    <div className="w-0.5 h-4 bg-lazarus-black/50"></div>
                    <div className="w-0.5 h-4 bg-lazarus-black/50"></div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setStage('selecting')}
                className="mt-6 text-[9px] text-lazarus-gold/50 hover:text-lazarus-gold uppercase tracking-widest flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Change Method
              </button>
            </div>
          )}

          {stage === 'coding' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 border border-lazarus-gold/10 bg-black/30 mb-6">
                  <span className="text-lazarus-muted text-[10px] mr-3 uppercase">Enter_the_code:</span>
                  <span className="text-lazarus-gold font-bold tracking-[0.5em] text-lg">{targetCode}</span>
                </div>
                
                <div className="flex justify-center gap-2 sm:gap-3 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className={`w-9 h-12 sm:w-10 sm:h-14 border flex items-center justify-center text-lg sm:text-xl font-bold transition-all duration-200 ${
                        error ? 'border-lazarus-alert text-lazarus-alert animate-shake' : 
                        granted ? 'border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                        inputCode[i] ? 'border-lazarus-gold text-lazarus-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'border-lazarus-gold/20 text-lazarus-gold/10'
                      }`}
                    >
                      {inputCode[i] || '•'}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-6">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === 'C') setInputCode('');
                        else if (key === '←') setInputCode(prev => prev.slice(0, -1));
                        else if (key !== ' ' && !granted) handleKeyClick(key);
                      }}
                      className={`h-11 border border-lazarus-gold/10 hover:border-lazarus-gold/50 hover:bg-lazarus-gold/5 text-lazarus-gold transition-all duration-150 active:scale-95 text-xs font-bold ${granted ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setStage('selecting')}
                  className="text-[9px] text-lazarus-gold/50 hover:text-lazarus-gold uppercase tracking-widest flex items-center justify-center gap-2 w-full"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 19l-7-7 7-7" /></svg>
                  Change Method
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-lazarus-gold/10 flex justify-between items-end">
          <div className="text-[8px] text-lazarus-muted/40 uppercase leading-relaxed">
            SECURITY_LEVEL: ALPHA<br />
            PROTECTION: ACTIVE
          </div>
          <div className="text-right">
             <div className="text-[10px] text-lazarus-gold/50 font-bold italic tracking-tighter">LAZARUS_ARCHITECT</div>
             <div className="text-[7px] text-lazarus-muted/30">V.4.0.26-ALPHA</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
