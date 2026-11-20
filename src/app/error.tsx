'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-light-gray">
      <div className="max-w-md w-full bg-white border border-border-light-gray rounded-2xl p-6 text-center shadow-sm">
        <h2 className="text-lg font-extrabold text-text-slate-dark mb-2">
          Terjadi kesalahan tak terduga
        </h2>
        <p className="text-xs text-text-slate-medium mb-5">
          {error.message || 'Aplikasi mengalami kendala saat memuat halaman ini.'}
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="btn-primary text-xs"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
