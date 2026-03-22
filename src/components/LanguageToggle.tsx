import { useState, useEffect } from 'react';

export default function LanguageToggle({ initialLang = 'en' }: { initialLang?: string }) {
  const [lang, setLang] = useState(initialLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read cookie on mount if needed, but we rely on initialLang from Astro
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'id' : 'en';
    setLang(newLang);
    // Set cookie valid for 1 year
    document.cookie = `lazarus_lang=${newLang};path=/;max-age=31536000`;
    // Force reload to apply server-side translations
    window.location.reload();
  };

  if (!mounted) {
    // Return a visually stable placeholder during SSR hydration
    return (
      <button className="touch-target rounded-sm text-xs font-bold tracking-widest text-lazarus-muted px-2 py-1 uppercase opacity-50 cursor-default">
        {initialLang}
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="touch-target rounded-sm hover:bg-lazarus-gold/10 transition-colors group flex items-center px-3 py-1.5"
      aria-label="Toggle Language"
    >
      <div className="flex items-center text-xs font-bold tracking-widest">
        <span className={`${lang === 'en' ? 'text-lazarus-gold' : 'text-lazarus-muted group-hover:text-lazarus-body'} transition-colors uppercase`}>EN</span>
        <span className="text-lazarus-border mx-2">|</span>
        <span className={`${lang === 'id' ? 'text-lazarus-gold' : 'text-lazarus-muted group-hover:text-lazarus-body'} transition-colors uppercase`}>ID</span>
      </div>
    </button>
  );
}
