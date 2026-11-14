import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  BookOpenCheck,
  KeyRound,
  Layers,
  LayoutTemplate,
  Lock,
  LogOut,
  PackageCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useStorefrontSettings } from '../hooks/useStorefrontSettings';
import { useStoryDomains } from '../hooks/useStoryDomains';
import {
  fetchAdminSecurityConfig,
  saveAdminPasswordInFirestore,
} from '../services/admin/adminSecurityService';
import {
  fetchOrdersForAdmin,
  type AdminOrderRecord,
} from '../services/orders/ordersService';
import { fetchAllStoriesForAdmin } from '../services/stories/storiesService';
import type { Story } from '../types/story';
import {
  hasConfiguredPassword,
  verifyAdminPassword,
  type AdminSecurityRecord,
} from '../utils/adminSecurity';
import { AdminSecurityPanel } from '../components/admin/AdminSecurityPanel';
import {
  BookStudioPanel,
  type StudioOrderTarget,
} from '../components/admin/BookStudioPanel';
import { DomainsManagerPanel } from '../components/admin/DomainsManagerPanel';
import { OrdersManagerPanel } from '../components/admin/OrdersManagerPanel';
import { StoriesManagerPanel } from '../components/admin/StoriesManagerPanel';
import { StorefrontEditorPanel } from '../components/admin/StorefrontEditorPanel';

type AdminTab = 'storefront' | 'stories' | 'domains' | 'orders' | 'editor' | 'security';

function getUnlockSessionKey(uid: string): string {
  return `mls_admin_unlocked_${uid}`;
}

function getSecurityFingerprint(record: AdminSecurityRecord | null): string {
  if (!record) return '';
  if (record.passwordHash && record.salt) {
    return `h:${record.salt}:${record.passwordHash}`;
  }
  if (record.password) {
    return `p:${record.password}`;
  }
  return '';
}

export function AdminPage() {
  const { t } = useLanguage();
  const {
    user,
    authReady,
    isAdmin,
    adminChecking,
    signInAdminWithGoogle,
    logout,
  } = useAuth();
  const { settings, reload: reloadSettings } = useStorefrontSettings();
  const { domains, reload: reloadDomains } = useStoryDomains(true);

  const [activeTab, setActiveTab] = useState<AdminTab>('storefront');
  const [studioTarget, setStudioTarget] = useState<StudioOrderTarget | null>(null);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState(false);
  const [securityConfig, setSecurityConfig] = useState<AdminSecurityRecord | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authFormError, setAuthFormError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const loadSecurityState = useCallback(async () => {
    if (!user || !isAdmin) {
      setSecurityConfig(null);
      setIsUnlocked(false);
      return;
    }

    setSecurityLoading(true);
    setSecurityError(false);
    try {
      const record = await fetchAdminSecurityConfig();
      setSecurityConfig(record);

      const fingerprint = getSecurityFingerprint(record);
      if (fingerprint && hasConfiguredPassword(record)) {
        const stored = sessionStorage.getItem(getUnlockSessionKey(user.uid));
        setIsUnlocked(stored === fingerprint);
      } else {
        setIsUnlocked(false);
      }
    } catch {
      setSecurityError(true);
      setIsUnlocked(false);
    } finally {
      setSecurityLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (authReady && !adminChecking) {
      loadSecurityState();
    }
  }, [authReady, adminChecking, loadSecurityState]);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin || !isUnlocked) return;
    setDataLoading(true);
    try {
      const [storiesList, ordersList] = await Promise.all([
        fetchAllStoriesForAdmin(),
        fetchOrdersForAdmin().catch(() => []),
      ]);
      setAllStories(storiesList);
      setOrders(ordersList);
    } finally {
      setDataLoading(false);
    }
  }, [isAdmin, isUnlocked]);

  useEffect(() => {
    if (isAdmin && isUnlocked) {
      loadAdminData();
    }
  }, [isAdmin, isUnlocked, loadAdminData]);

  const handleLogout = async () => {
    if (user) {
      sessionStorage.removeItem(getUnlockSessionKey(user.uid));
    }
    setIsUnlocked(false);
    setPasswordInput('');
    setConfirmPasswordInput('');
    await logout();
  };

  const handleLockSession = () => {
    if (user) {
      sessionStorage.removeItem(getUnlockSessionKey(user.uid));
    }
    setIsUnlocked(false);
    setPasswordInput('');
    setConfirmPasswordInput('');
    setAuthFormError(null);
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAuthFormError(null);

    if (passwordInput.length < 6) {
      setAuthFormError(t.adminPasswordMinError);
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthFormError(t.adminPasswordMismatchError);
      return;
    }

    setAuthSubmitting(true);
    try {
      await saveAdminPasswordInFirestore(passwordInput);
      const updated = await fetchAdminSecurityConfig();
      setSecurityConfig(updated);
      const fp = getSecurityFingerprint(updated);
      if (fp) {
        sessionStorage.setItem(getUnlockSessionKey(user.uid), fp);
      }
      setPasswordInput('');
      setConfirmPasswordInput('');
      setIsUnlocked(true);
    } catch {
      setAuthFormError(t.adminSaveError);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleUnlockWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !securityConfig) return;
    setAuthFormError(null);

    setAuthSubmitting(true);
    try {
      const ok = await verifyAdminPassword(passwordInput, securityConfig);
      if (!ok) {
        setAuthFormError(t.adminPasswordWrongError);
        return;
      }
      const fp = getSecurityFingerprint(securityConfig);
      if (fp) {
        sessionStorage.setItem(getUnlockSessionKey(user.uid), fp);
      }
      setPasswordInput('');
      setIsUnlocked(true);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handlePasswordUpdatedFromPanel = async () => {
    const updated = await fetchAdminSecurityConfig();
    setSecurityConfig(updated);
    if (user) {
      const fp = getSecurityFingerprint(updated);
      if (fp) {
        sessionStorage.setItem(getUnlockSessionKey(user.uid), fp);
      }
    }
  };

  if (!authReady || adminChecking || (isAdmin && securityLoading)) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-8 w-64 bg-[#EADFD7] rounded" />
        <div className="h-64 rounded-3xl bg-white border border-[#EADFD7]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div
          data-testid="admin-signin-gate"
          className="bg-white rounded-3xl border border-[#EADFD7] p-8 text-center space-y-5"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F8E8DC] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-[#443B3B]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-[#443B3B]">{t.adminSignInTitle}</h1>
          <p className="text-sm text-[#706464] leading-relaxed">{t.adminSignInDesc}</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={signInAdminWithGoogle}
              data-testid="admin-google-signin-btn"
              className="w-full py-3.5 px-6 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] transition-colors cursor-pointer"
            >
              {t.adminSignInBtn}
            </button>
            <Link
              to="/"
              className="text-xs font-semibold text-[#706464] underline underline-offset-4 hover:text-[#443B3B]"
            >
              {t.adminBackToStore}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div
          data-testid="admin-access-denied"
          className="bg-white rounded-3xl border border-[#EADFD7] p-8 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5B8B8]/40 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-[#993636]" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-[#443B3B]">{t.adminAccessDeniedTitle}</h1>
          <p className="text-sm text-[#706464] leading-relaxed">{t.adminAccessDeniedDesc}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-bold cursor-pointer"
            >
              {t.accountSignOutBtn}
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-[#443B3B] text-xs font-bold"
            >
              {t.adminBackToStore}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (securityError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-[#EADFD7] p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-[#443B3B]">{t.errorLoadTitle}</h1>
          <p className="text-sm text-[#706464]">{t.errorLoadDesc}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={loadSecurityState}
              className="px-5 py-2.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-bold cursor-pointer"
            >
              {t.retryBtn}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-[#443B3B] text-xs font-bold cursor-pointer"
            >
              {t.accountSignOutBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasConfiguredPassword(securityConfig)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <form
          onSubmit={handleSetupPassword}
          data-testid="admin-password-setup"
          className="bg-white rounded-3xl border border-[#EADFD7] p-8 space-y-5"
        >
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#DCD6F7]/50 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 text-[#443B3B]" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-[#443B3B]">{t.adminPasswordSetupTitle}</h1>
            <p className="text-sm text-[#706464] leading-relaxed">{t.adminPasswordSetupDesc}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-setup-pw" className="block text-xs font-semibold text-[#443B3B]">
              {t.adminPasswordLabel}
            </label>
            <input
              id="admin-setup-pw"
              type="password"
              required
              minLength={6}
              maxLength={128}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-setup-pw-confirm"
              className="block text-xs font-semibold text-[#443B3B]"
            >
              {t.adminPasswordConfirmLabel}
            </label>
            <input
              id="admin-setup-pw-confirm"
              type="password"
              required
              minLength={6}
              maxLength={128}
              value={confirmPasswordInput}
              onChange={(e) => setConfirmPasswordInput(e.target.value)}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
            />
          </div>

          {authFormError && (
            <p role="alert" className="rounded-xl bg-[#F5B8B8]/40 px-4 py-2.5 text-xs font-semibold text-[#8F2828]">
              {authFormError}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={authSubmitting}
              data-testid="admin-setup-password-submit"
              className="w-full py-3.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {authSubmitting ? '...' : t.adminPasswordSaveBtn}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-[#706464] hover:text-[#443B3B] cursor-pointer"
            >
              {t.accountSignOutBtn}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <form
          onSubmit={handleUnlockWithPassword}
          data-testid="admin-password-unlock"
          className="bg-white rounded-3xl border border-[#EADFD7] p-8 space-y-5"
        >
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F8E8DC] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-[#443B3B]" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-[#443B3B]">{t.adminPasswordUnlockTitle}</h1>
            <p className="text-sm text-[#706464] leading-relaxed">{t.adminPasswordUnlockDesc}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-unlock-pw" className="block text-xs font-semibold text-[#443B3B]">
              {t.adminPasswordLabel}
            </label>
            <input
              id="admin-unlock-pw"
              type="password"
              required
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
            />
          </div>

          {authFormError && (
            <p role="alert" className="rounded-xl bg-[#F5B8B8]/40 px-4 py-2.5 text-xs font-semibold text-[#8F2828]">
              {authFormError}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={authSubmitting}
              data-testid="admin-unlock-password-submit"
              className="w-full py-3.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {authSubmitting ? '...' : t.adminPasswordBtn}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-[#706464] hover:text-[#443B3B] cursor-pointer"
            >
              {t.accountSignOutBtn}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Admin Header Bar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EADFD7]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#443B3B]">{t.adminTitle}</h1>
          <p className="text-sm text-[#706464]">{t.adminSubtitle}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl border border-[#EADFD7] bg-white text-xs font-bold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors whitespace-nowrap"
          >
            {t.adminBackToStore}
          </Link>
          <button
            type="button"
            onClick={handleLockSession}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-bold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.adminLockSessionBtn}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-bold hover:bg-[#332B2B] transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.accountSignOutBtn}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Admin sections"
        className="print:hidden flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#F8E8DC] border border-[#EADFD7]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'storefront'}
          onClick={() => setActiveTab('storefront')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'storefront'
              ? 'bg-[#443B3B] text-[#FFF9F2]'
              : 'text-[#443B3B] hover:bg-white/70'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" aria-hidden="true" />
          <span>{t.adminTabStorefront}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stories'}
          onClick={() => setActiveTab('stories')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'stories'
              ? 'bg-[#443B3B] text-[#FFF9F2]'
              : 'text-[#443B3B] hover:bg-white/70'
          }`}
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span>{t.adminTabStories}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'domains'}
          onClick={() => setActiveTab('domains')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'domains'
              ? 'bg-[#443B3B] text-[#FFF9F2]'
              : 'text-[#443B3B] hover:bg-white/70'
          }`}
        >
          <Layers className="w-4 h-4" aria-hidden="true" />
          <span>{t.adminTabDomains}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-[#443B3B] text-[#FFF9F2]'
              : 'text-[#443B3B] hover:bg-white/70'
          }`}
        >
          <PackageCheck className="w-4 h-4" aria-hidden="true" />
          <span>{t.adminTabOrders}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="admin-tab-editor"
          aria-selected={activeTab === 'editor'}
          onClick={() => setActiveTab('editor')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'editor'
              ? 'bg-[#443B3B] text-[#FFF9F2]'
              : 'text-[#443B3B] hover:bg-white/70'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" aria-hidden="true" />
          <span>{t.adminTabEditor}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'security'}
          onClick={() => setActiveTab('security')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#443B3B] text-[#FFF9F2]'
              : 'text-[#443B3B] hover:bg-white/70'
          }`}
        >
          <KeyRound className="w-4 h-4" aria-hidden="true" />
          <span>{t.adminTabSecurity}</span>
        </button>
      </div>

      {dataLoading && allStories.length === 0 ? (
        <div className="h-64 rounded-3xl bg-white border border-[#EADFD7] animate-pulse" />
      ) : (
        <>
          {activeTab === 'storefront' && (
            <StorefrontEditorPanel
              initialSettings={settings}
              onSaved={reloadSettings}
            />
          )}

          {activeTab === 'stories' && (
            <StoriesManagerPanel
              stories={allStories}
              onRefresh={loadAdminData}
            />
          )}

          {activeTab === 'domains' && (
            <DomainsManagerPanel
              domains={domains}
              stories={allStories}
              onRefresh={reloadDomains}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersManagerPanel
              orders={orders}
              onRefresh={loadAdminData}
              onOpenBookStudio={(order, itemIndex) => {
                setStudioTarget({ orderId: order.id, itemIndex });
                setActiveTab('editor');
              }}
            />
          )}

          {activeTab === 'editor' && (
            <BookStudioPanel
              orders={orders}
              stories={allStories}
              selectedTarget={studioTarget}
              onSelectTarget={setStudioTarget}
              onOrderUpdated={loadAdminData}
            />
          )}

          {activeTab === 'security' && (
            <AdminSecurityPanel
              onPasswordUpdated={handlePasswordUpdatedFromPanel}
              onLockNow={handleLockSession}
            />
          )}
        </>
      )}
    </div>
  );
}
