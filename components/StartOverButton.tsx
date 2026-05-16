'use client';

import { signOut } from 'next-auth/react';

type StartOverButtonProps = {
  className?: string;
};

export function StartOverButton({ className }: StartOverButtonProps) {
  const handleStartOver = async () => {
    // Clear ALL cookies manually first
    document.cookie.split(';').forEach((cookie) => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Then sign out properly
    await signOut({
      redirect: false,
      callbackUrl: '/',
    });

    // Hard reload to clear any in-memory state
    window.location.href = '/';
  };

  return (
    <button type="button" className={className} onClick={handleStartOver}>
      Start over
    </button>
  );
}
