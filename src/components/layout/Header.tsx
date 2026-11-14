import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import type { UILanguage } from '../../types/i18n';

const LANGUAGES: Array<{ code: UILanguage; label: string }> = [
  { code: 'ar', label: 'ع' },
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

export function Header() {
  const { lang, setLang, t } = useLanguage();
  const { totalCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/#how-it-works');
      setTimeout(() => {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFF9F2]/95 backdrop-blur-md border-b border-[#EADFD7] print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#443B3B] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#443B3B] rounded-lg"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="3" y="5" width="26" height="22" rx="6" fill="#F5B8B8" />
            <path
              d="M16 8.5V23.5M16 8.5C13.5 7.2 9.5 7.2 7 8.5V22.5C9.5 21.2 13.5 21.2 16 22.5M16 8.5C18.5 7.2 22.5 7.2 25 8.5V22.5C22.5 21.2 18.5 21.2 16 22.5"
              stroke="#443B3B"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight font-['Poppins',sans-serif]">
            My Little Story
          </span>
        </Link>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#443B3B]/85"
        >
          <Link
            to="/"
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              location.pathname === '/'
                ? 'border-[#443B3B] text-[#443B3B] font-semibold'
                : 'border-transparent hover:text-[#443B3B] hover:border-[#F5B8B8]'
            }`}
          >
            {t.navHome}
          </Link>
          <Link
            to="/stories"
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              location.pathname.startsWith('/stories')
                ? 'border-[#443B3B] text-[#443B3B] font-semibold'
                : 'border-transparent hover:text-[#443B3B] hover:border-[#F5B8B8]'
            }`}
          >
            {t.navStories}
          </Link>
          <a
            href="/#how-it-works"
            onClick={handleHowItWorksClick}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-[#443B3B] hover:border-[#F5B8B8] transition-colors"
          >
            {t.navHowItWorks}
          </a>
          <Link
            to="/customize"
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              location.pathname.startsWith('/customize')
                ? 'border-[#443B3B] text-[#443B3B] font-semibold'
                : 'border-transparent hover:text-[#443B3B] hover:border-[#F5B8B8]'
            }`}
          >
            {t.navCustomize}
          </Link>
        </nav>

        {/* Zone 3: Language switcher + Cart Action + Mobile menu trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Language"
            className="hidden sm:flex items-center p-0.5 rounded-xl bg-[#F8E8DC] border border-[#EADFD7]"
          >
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code)}
                aria-pressed={lang === item.code}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === item.code
                    ? 'bg-white text-[#443B3B] shadow-xs'
                    : 'text-[#706464] hover:text-[#443B3B]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Link
            to="/cart"
            aria-label={`${t.navCart} (${totalCount})`}
            data-testid="header-cart-link"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-semibold hover:bg-[#332B2B] transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{t.navCart}</span>
            <span
              data-testid="cart-badge-count"
              className="tabular-nums inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-md bg-[#F5B8B8] text-[#443B3B] text-xs font-bold"
            >
              {totalCount}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-xl border border-[#EADFD7] bg-white text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#EADFD7] bg-[#FFF9F2] px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-1.5 text-sm font-medium">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-[#F8E8DC] text-[#443B3B]"
            >
              {t.navHome}
            </Link>
            <Link
              to="/stories"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-[#F8E8DC] text-[#443B3B]"
            >
              {t.navStories}
            </Link>
            <a
              href="/#how-it-works"
              onClick={handleHowItWorksClick}
              className="px-3 py-2.5 rounded-xl hover:bg-[#F8E8DC] text-[#443B3B]"
            >
              {t.navHowItWorks}
            </a>
            <Link
              to="/customize"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-[#F8E8DC] text-[#443B3B]"
            >
              {t.navCustomize}
            </Link>
          </nav>

          <div className="pt-2 border-t border-[#EADFD7] flex items-center justify-between">
            <span className="text-xs text-[#706464]">Language / اللغة</span>
            <div className="flex items-center p-0.5 rounded-xl bg-[#F8E8DC] border border-[#EADFD7]">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    lang === item.code ? 'bg-white text-[#443B3B]' : 'text-[#706464]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
