'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SingleRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50 text-slate-700 font-bold text-sm">
      ダブルアップ専用 相性シミュレーターへ移動中...
    </div>
  );
}
