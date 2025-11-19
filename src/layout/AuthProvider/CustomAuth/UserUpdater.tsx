'use client';

import { memo, useEffect } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { enableCustomAuth } from '@/const/auth';
import { customAuthService } from '@/services/customAuth';
import { useUserStore } from '@/store/user';
import { LobeUser } from '@/types/user';

// Update the user data into the context when using custom auth
const CustomAuthUserUpdater = memo(() => {
  const useStoreUpdater = createStoreUpdater(useUserStore);

  useEffect(() => {
    if (!enableCustomAuth) {
      return;
    }

    const updateUserState = async () => {
      const isAuthenticated = customAuthService.isAuthenticated();
      
      // Update isLoaded and isSignedIn
      useStoreUpdater('isLoaded', true);
      useStoreUpdater('isSignedIn', isAuthenticated);

      if (isAuthenticated) {
        try {
          // Fetch current user info
          const user = await customAuthService.getCurrentUser();
          
          if (user) {
            // Convert backend user format to LobeUser format
            const lobeUser: LobeUser = {
              id: user.id.toString(),
              email: user.email,
              fullName: user.name,
              username: user.email.split('@')[0], // Use email prefix as username
              avatar: '', // Avatar can be set later if available
            };

            // Update user store
            useUserStore.setState({ user: lobeUser });
          }
        } catch (error) {
          console.error('[CustomAuthUserUpdater] Failed to fetch user:', error);
          // If fetch fails, user might not be authenticated
          useStoreUpdater('isSignedIn', false);
        }
      } else {
        // Clear user data if not authenticated
        useUserStore.setState({ user: undefined });
      }
    };

    // Initial update
    updateUserState();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'custom_auth_token' || e.key === 'custom_auth_user') {
        updateUserState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically (in case token expires)
    const interval = setInterval(() => {
      updateUserState();
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [useStoreUpdater]);

  return null;
});

CustomAuthUserUpdater.displayName = 'CustomAuthUserUpdater';

export default CustomAuthUserUpdater;

