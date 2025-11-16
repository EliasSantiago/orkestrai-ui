'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { enableCustomAuth } from '@/const/auth';
import { customAuthService } from '@/services/customAuth';

const CustomAuthProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!enableCustomAuth) {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      // Allow access to login and register pages
      if (pathname === '/login' || pathname === '/signup') {
        setIsChecking(false);
        return;
      }

      // Check if user is authenticated
      const isAuthenticated = customAuthService.isAuthenticated();

      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push('/login');
        setIsChecking(false);
        return;
      }

      // Verify token is still valid by fetching user info
      try {
        const user = await customAuthService.getCurrentUser();
        if (!user) {
          // Token is invalid, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to verify authentication:', error);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isChecking && enableCustomAuth) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return children;
};

export default CustomAuthProvider;

