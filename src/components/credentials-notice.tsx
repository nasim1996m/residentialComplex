'use client';

import type { Credentials } from '@/lib/types';

// Shown once after creating an account; the temporary password is never retrievable again.
export function CredentialsNotice({ credentials, onClose }: { credentials: Credentials; onClose: () => void }) {
  return (
    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-xs space-y-2">
      <p className="font-black text-green-400">تم إنشاء الحساب. سلّم بيانات الدخول التالية لصاحبها (لن تظهر مرة أخرى):</p>
      <p className="text-white">
        البريد: <span className="font-mono">{credentials.email}</span>
      </p>
      <p className="text-white">
        كلمة المرور المؤقتة: <span className="font-mono select-all">{credentials.temporaryPassword}</span>
      </p>
      <button onClick={onClose} className="px-3 py-1.5 bg-slate-800 rounded-lg text-gray-300 font-bold">
        تم
      </button>
    </div>
  );
}
