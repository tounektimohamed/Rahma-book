import React, { useState } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { saveAdminPasswordInFirestore } from '../../services/admin/adminSecurityService';

interface AdminSecurityPanelProps {
  onPasswordUpdated: () => Promise<void>;
  onLockNow: () => void;
}

export function AdminSecurityPanel({
  onPasswordUpdated,
  onLockNow,
}: AdminSecurityPanelProps) {
  const { lang, t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.length < 6) {
      setStatusMsg({ type: 'err', text: t.adminPasswordMinError });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'err', text: t.adminPasswordMismatchError });
      return;
    }

    setSaving(true);
    try {
      await saveAdminPasswordInFirestore(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      await onPasswordUpdated();
      setStatusMsg({ type: 'ok', text: t.adminSaveSuccess });
    } catch {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl bg-white rounded-2xl border border-[#EADFD7] p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#443B3B]">
            <KeyRound className="w-4 h-4 shrink-0" aria-hidden="true" />
            <h2 className="text-base font-bold">{t.adminChangePasswordTitle}</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onLockNow}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-bold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer shrink-0"
        >
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t.adminLockSessionBtn}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="admin-change-pw" className="block text-xs font-semibold text-[#443B3B]">
            {t.adminPasswordLabel}
          </label>
          <input
            id="admin-change-pw"
            type="password"
            minLength={6}
            maxLength={128}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="admin-change-pw-confirm"
            className="block text-xs font-semibold text-[#443B3B]"
          >
            {t.adminPasswordConfirmLabel}
          </label>
          <input
            id="admin-change-pw-confirm"
            type="password"
            minLength={6}
            maxLength={128}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
          />
        </div>

        {statusMsg && (
          <p
            role="status"
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
              statusMsg.type === 'ok'
                ? 'bg-[#B8CDBA]/40 text-[#2E5436]'
                : 'bg-[#F5B8B8]/40 text-[#8F2828]'
            }`}
          >
            {statusMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          data-testid="admin-update-password-btn"
          className="px-6 py-3 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {saving ? '...' : t.adminPasswordSaveBtn}
        </button>
      </form>
    </div>
  );
}
