'use client';

import React, { useState } from 'react';

interface ManagerAuthGateProps {
  onUnlock: () => void;
  onError: (msg: string) => void;
}

export function ManagerAuthGate({ onUnlock, onError }: ManagerAuthGateProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      onError('ادخل كلمة السر');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUnlock();
      } else {
        onError(data.message || 'كلمة السر غير صحيحة');
        setPassword('');
      }
    } catch {
      onError('حدث خطأ أثناء التحقق من كلمة السر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-6 max-w-md mx-auto shadow-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🔒</span>
        <h2 className="text-base font-bold text-[var(--ink)]">لوحة المدير محمية</h2>
      </div>
      <p className="text-xs text-[var(--ink-soft)] mb-4">
        دخّل كلمة السر عشان تشوف بيانات كل المندوبين وتفاصيل التغطية
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة السر"
          className="flex-1 px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)] font-mono"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-lg text-sm font-bold bg-[var(--teal)] text-white hover:bg-[var(--teal-deep)] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? 'جاري التحقق...' : 'دخول'}
        </button>
      </form>
    </div>
  );
}
