'use client';

import { useEffect } from 'react';
import { logger } from '../lib/logger';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error('app.unhandled_global_error', { error, digest: error.digest });
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen flex items-center justify-center p-6 bg-[#f8f9fa] text-[#1a1d20]">
        <div className="max-w-md w-full bg-white border border-[#e9ecef] rounded-2xl p-6 text-center shadow-sm">
          <h2 className="text-lg font-extrabold mb-2">Terjadi gangguan sistem</h2>
          <p className="text-xs text-[#495057] mb-5">
            {error.message || 'Silakan muat ulang halaman untuk melanjutkan.'}
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="bg-[#f25c05] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border-none"
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
