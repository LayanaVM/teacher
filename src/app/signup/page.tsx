'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login'); // Redirect to /login
  }, [router]);

  return null; // No UI shown during redirect
}
