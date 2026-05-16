'use client';

import { signIn, signOut } from 'next-auth/react';

type SpotifySignInButtonProps = {
  className?: string;
  children: React.ReactNode;
  reconnect?: boolean;
};

export function SpotifySignInButton({
  className,
  children,
  reconnect = false,
}: SpotifySignInButtonProps) {
  const handleClick = async () => {
    if (reconnect) {
      // Clear all cookies first
      document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.split('=');
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      await signOut({ redirect: false });
      await signIn('spotify', {
        callbackUrl: '/analyzing',
        prompt: 'select_account', // Force Spotify account picker
      });
      return;
    }

    await signIn('spotify', { callbackUrl: '/analyzing' });
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
}