import type { AdapterAccount } from 'next-auth/adapters';
import type { PartialDeep } from 'type-fest';

import { lambdaClient } from '@/libs/trpc/client';
import { customApiService } from '@/services/customApi';
import { UserGuide, UserInitializationState, UserPreference } from '@/types/user';
import { UserSettings } from '@/types/user/settings';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

export class UserService {
  getUserRegistrationDuration = async (): Promise<{
    createdAt: string;
    duration: number;
    updatedAt: string;
  }> => {
    return lambdaClient.user.getUserRegistrationDuration.query();
  };

  getUserState = async (): Promise<UserInitializationState> => {
    return lambdaClient.user.getUserState.query();
  };

  getUserSSOProviders = async (): Promise<AdapterAccount[]> => {
    return lambdaClient.user.getUserSSOProviders.query();
  };

  unlinkSSOProvider = async (provider: string, providerAccountId: string) => {
    return lambdaClient.user.unlinkSSOProvider.mutate({ provider, providerAccountId });
  };

  makeUserOnboarded = async () => {
    return lambdaClient.user.makeUserOnboarded.mutate();
  };

  updateAvatar = async (avatar: string) => {
    return lambdaClient.user.updateAvatar.mutate(avatar);
  };

  updatePreference = async (preference: Partial<UserPreference>) => {
    // Update local DB (PGLite)
    const result = await lambdaClient.user.updatePreference.mutate(preference);
    
    // If custom auth is enabled, sync with backend
    if (enableCustomAuth) {
      try {
        // Get all preferences from local state to sync with backend
        await this.syncPreferencesToBackend(preference);
      } catch (error) {
        console.error('[UserService] Failed to sync preferences to backend:', error);
        // Don't throw - local update succeeded, backend sync is optional
      }
    }
    
    return result;
  };

  /**
   * Sync preferences to backend (only when custom auth is enabled)
   */
  private syncPreferencesToBackend = async (preferences: Partial<UserPreference>) => {
    if (!enableCustomAuth) return;
    
    try {
      // Convert UserPreference to backend format
      // Backend expects a flat JSON object with any keys
      const backendPrefs: Record<string, any> = {};
      
      // Map theme
      if (preferences.useCmdEnterToSend !== undefined) {
        backendPrefs.useCmdEnterToSend = preferences.useCmdEnterToSend;
      }
      
      // Map guide state
      if (preferences.guide) {
        backendPrefs.guide = preferences.guide;
      }
      
      // Map lab features
      if (preferences.lab) {
        backendPrefs.lab = preferences.lab;
      }
      
      // Map telemetry
      if (preferences.telemetry !== undefined) {
        backendPrefs.telemetry = preferences.telemetry;
      }
      
      // Only sync if there are preferences to update
      if (Object.keys(backendPrefs).length > 0) {
        await customApiService.request('/api/user/preferences', {
          method: 'PUT',
          body: JSON.stringify(backendPrefs),
        });
      }
    } catch (error) {
      console.error('[UserService] Backend sync failed:', error);
      throw error;
    }
  };

  /**
   * Load preferences from backend (only when custom auth is enabled)
   */
  loadPreferencesFromBackend = async (): Promise<Partial<UserPreference> | null> => {
    if (!enableCustomAuth) return null;
    
    try {
      const backendPrefs = await customApiService.request<Record<string, any>>('/api/user/preferences');
      
      // Convert backend format to UserPreference
      const userPrefs: Partial<UserPreference> = {};
      
      if (backendPrefs.useCmdEnterToSend !== undefined) {
        userPrefs.useCmdEnterToSend = backendPrefs.useCmdEnterToSend;
      }
      
      if (backendPrefs.guide) {
        userPrefs.guide = backendPrefs.guide;
      }
      
      if (backendPrefs.lab) {
        userPrefs.lab = backendPrefs.lab;
      }
      
      if (backendPrefs.telemetry !== undefined) {
        userPrefs.telemetry = backendPrefs.telemetry;
      }
      
      return userPrefs;
    } catch (error) {
      console.error('[UserService] Failed to load preferences from backend:', error);
      return null;
    }
  };

  updateGuide = async (guide: Partial<UserGuide>) => {
    return lambdaClient.user.updateGuide.mutate(guide);
  };

  updateUserSettings = async (value: PartialDeep<UserSettings>, signal?: AbortSignal) => {
    const result = await lambdaClient.user.updateSettings.mutate(value, { signal });
    
    // If custom auth is enabled, sync settings with backend
    if (enableCustomAuth) {
      try {
        await this.syncSettingsToBackend(value);
      } catch (error) {
        console.error('[UserService] Failed to sync settings to backend:', error);
        // Don't throw - local update succeeded
      }
    }
    
    return result;
  };

  /**
   * Sync settings to backend (only when custom auth is enabled)
   */
  private syncSettingsToBackend = async (settings: PartialDeep<UserSettings>) => {
    if (!enableCustomAuth) return;
    
    try {
      // Convert settings to backend format
      const backendPrefs: Record<string, any> = {
        settings: settings,
      };
      
      await customApiService.request('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(backendPrefs),
      });
    } catch (error) {
      console.error('[UserService] Backend settings sync failed:', error);
      throw error;
    }
  };

  /**
   * Load settings from backend (only when custom auth is enabled)
   */
  loadSettingsFromBackend = async (): Promise<PartialDeep<UserSettings> | null> => {
    if (!enableCustomAuth) return null;
    
    try {
      const backendPrefs = await customApiService.request<Record<string, any>>('/api/user/preferences');
      
      if (backendPrefs.settings) {
        return backendPrefs.settings as PartialDeep<UserSettings>;
      }
      
      return null;
    } catch (error) {
      console.error('[UserService] Failed to load settings from backend:', error);
      return null;
    }
  };

  resetUserSettings = async () => {
    const result = await lambdaClient.user.resetSettings.mutate();
    
    // If custom auth is enabled, reset backend preferences too
    if (enableCustomAuth) {
      try {
        await customApiService.request('/api/user/preferences', {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('[UserService] Failed to reset backend preferences:', error);
      }
    }
    
    return result;
  };
}

export const userService = new UserService();
