import React, { useState, useEffect, useRef } from 'react';
import { getTranslation } from '../utils/i18n';

export default function HumanVerification({ lang = 'en' }: { lang?: string }) {
  const [stage, setStage] = useState<'sliding' | 'coding' | 'verified' | 'hidden'>('hidden');
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [targetCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [error, setError] = useState(false);
  const [granted, setGranted] = useState(false);
  
  const t = getTranslation(lang as any);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if already verified in this session or local storage
    const isVerified = localStorage.getItem('lazarus_verified');
    if (!isVerified) {
      setStage('sliding');
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const pos = ((clientX - rect.left) / rect.width) * 100;
      const clampedPos = Math.max(0, Math.min(100, pos));
      
      setSliderPos(clampedPos);
      
      if (clampedPos >= 98) {
        setIsDragging(false);
        setSliderPos(100);
        setTimeout(() => setStage('coding'), 300);
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (sliderPos < 98) setSliderPos(0);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, sliderPos]);

  const handleKeyClick = (num: string) => {
    if (inputCode.length < 4) {
      const newCode = inputCode + num;
      setInputCode(newCode);
      if (newCode.length === 4) {
        if (newCode === targetCode) {
          setGranted(true);
          setTimeout(() => {
            setStage('verified');
            localStorage.setItem('lazarus_verified', 'true');
            document.body.style.overflow = '';
          }, 1500);
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

  if (stage === 'verified' || stage === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-lazarus-black flex items-center justify-center p-4 font-mono overflow-hidden">
      {/* Tactical Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(var(--color-lazarus-gold) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lazarus-gold/5 to-transparent h-full w-full animate-pulse pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-lazarus-dark border border-lazarus-gold/30 p-8 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
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

        <div className="space-y-8">
          {stage === 'sliding' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div 
                ref={sliderRef}
                className="relative h-14 bg-black/50 border border-lazarus-gold/20 rounded-none overflow-hidden"
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-lazarus-gold/10 transition-all duration-75"
                  style={{ width: `${sliderPos}%` }}
                ></div>
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-lazarus-gold/40 text-[10px] uppercase tracking-[0.3em] font-bold">
                    {t.verification.slide}
                  </span>
                </div>

                <div 
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  className="absolute top-1 bottom-1 w-12 bg-lazarus-gold cursor-grab active:cursor-grabbing flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-transform"
                  style={{ left: `calc(${sliderPos}% - ${sliderPos > 50 ? '48px' : '0px'})`, transform: sliderPos > 90 ? 'scale(0.95)' : 'scale(1)' }}
                >
                  <div className="flex gap-1">
                    <div className="w-0.5 h-4 bg-lazarus-black/50"></div>
                    <div className="w-0.5 h-4 bg-lazarus-black/50"></div>
                    <div className="w-0.5 h-4 bg-lazarus-black/50"></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center text-[9px] text-lazarus-muted/60 uppercase tracking-tighter">
                <span>{t.verification.status}</span>
                <span className="animate-pulse">● SIGNAL_ACTIVE</span>
              </div>
            </div>
          )}

          {stage === 'coding' && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 border border-lazarus-gold/10 bg-black/30 mb-4">
                  <span className="text-lazarus-muted text-[10px] mr-3">ACCESS_ID:</span>
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

                <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === 'C') setInputCode('');
                        else if (key === '←') setInputCode(prev => prev.slice(0, -1));
                        else if (key !== ' ' && !granted) handleKeyClick(key);
                      }}
                      className={`h-12 border border-lazarus-gold/10 hover:border-lazarus-gold/50 hover:bg-lazarus-gold/5 text-lazarus-gold transition-all duration-150 active:scale-95 text-sm font-bold ${granted ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-lazarus-gold/10 flex justify-between items-end">
          <div className="text-[8px] text-lazarus-muted/40 uppercase leading-relaxed">
            TERMINAL_SECURE: 0x4F2A<br />
            ENCRYPTION: AES-256-GCM<br />
            IP: {typeof window !== 'undefined' ? 'DYNAMIC_ALLOC' : '...'}
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
