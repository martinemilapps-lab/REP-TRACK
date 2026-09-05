'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Lock, ShieldCheck, CheckCircle2, XCircle, LogOut } from 'lucide-react';

interface ChangePasswordModalProps {
  username?: string;
  onSuccess: () => void;
  onLogout: () => void;
}

export function ChangePasswordModal({
  username,
  onSuccess,
  onLogout,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Criteria checks for visual user guidance
  const criteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasDigit: /[0-9]/.test(newPassword),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
      matchesConfirm: newPassword.length > 0 && newPassword === confirmPassword,
      differsFromCurrent: newPassword.length > 0 && newPassword !== currentPassword,
    };
  }, [newPassword, confirmPassword, currentPassword]);

  const isFormValid = useMemo(() => {
    return (
      currentPassword.trim().length > 0 &&
      criteria.minLength &&
      criteria.hasUpper &&
      criteria.hasLower &&
      criteria.hasDigit &&
      criteria.hasSymbol &&
      criteria.matchesConfirm &&
      criteria.differsFromCurrent
    );
  }, [currentPassword, criteria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'فشل تحديث كلمة المرور');
      } else {
        onSuccess();
      }
    } catch {
      setErrorMsg('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl animate-fade-in my-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-48 h-20 mb-2 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="REP TRACK"
              width={220}
              height={100}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>إلزام أمني: تعيين كلمة المرور الدائمة</span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-[var(--ink)]">
            تحديث كلمة المرور لأول مرة
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-1.5 max-w-sm leading-relaxed">
            مرحباً بك {username ? `(${username})` : ''}. تم تسجيل الدخول بكلمة مرور مؤقتة. لدواعي الأمان والخصوصية، يرجى تعيين كلمة مرور جديدة خاصة بك قبل الوصول للوحة التحكم.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs font-semibold text-red-500 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
              كلمة المرور المؤقتة (الحالية)
            </label>
            <div className="relative">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور المؤقتة التي استلمتها"
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono text-[var(--ink)] placeholder-[var(--ink-muted)] shadow-2xs transition-all focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة مرور قوية جديدة"
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono text-[var(--ink)] placeholder-[var(--ink-muted)] shadow-2xs transition-all focus:outline-none focus:border-amber-500"
              />
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
              تأكيد كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono text-[var(--ink)] placeholder-[var(--ink-muted)] shadow-2xs transition-all focus:outline-none focus:border-amber-500"
              />
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)] pointer-events-none" />
            </div>
          </div>

          {/* Criteria Checklist */}
          <div className="bg-[var(--surface-muted)] border border-[var(--line)] rounded-xl p-3.5 text-xs">
            <span className="font-bold text-[var(--ink)] block mb-2">معايير قوة كلمة المرور:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
              <div className={`flex items-center gap-1.5 ${criteria.minLength ? 'text-emerald-500 font-bold' : 'text-[var(--ink-soft)]'}`}>
                {criteria.minLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-gray-400 inline-block" />}
                <span>8 أحرف على الأقل</span>
              </div>
              <div className={`flex items-center gap-1.5 ${criteria.hasUpper ? 'text-emerald-500 font-bold' : 'text-[var(--ink-soft)]'}`}>
                {criteria.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-gray-400 inline-block" />}
                <span>حرف كبير واحد (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${criteria.hasLower ? 'text-emerald-500 font-bold' : 'text-[var(--ink-soft)]'}`}>
                {criteria.hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-gray-400 inline-block" />}
                <span>حرف صغير واحد (a-z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${criteria.hasDigit ? 'text-emerald-500 font-bold' : 'text-[var(--ink-soft)]'}`}>
                {criteria.hasDigit ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-gray-400 inline-block" />}
                <span>رقم واحد على الأقل (0-9)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${criteria.hasSymbol ? 'text-emerald-500 font-bold' : 'text-[var(--ink-soft)]'}`}>
                {criteria.hasSymbol ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-gray-400 inline-block" />}
                <span>رمز خاص واحد (!@#$%^&*)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${criteria.matchesConfirm ? 'text-emerald-500 font-bold' : 'text-[var(--ink-soft)]'}`}>
                {criteria.matchesConfirm ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-gray-400 inline-block" />}
                <span>تطابق التأكيد</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2.5 mt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!isFormValid || loading}
              isLoading={loading}
              className="flex-1"
            >
              حفظ وتأمين الحساب
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={loading}
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 text-xs text-[var(--ink-soft)]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
