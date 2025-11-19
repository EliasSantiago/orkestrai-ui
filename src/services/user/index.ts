import type { AdapterAccount } from 'next-auth/adapters';
import type { PartialDeep } from 'type-fest';

import { lambdaClient } from '@/libs/trpc/client';
import { customApiService } from '@/services/customApi';
import { restApiService } from '@/services/restApi';
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
    if (enableCustomAuth) {
      return restApiService.getUserRegistrationDuration();
    }
    return lambdaClient.user.getUserRegistrationDuration.query();
  };

  getUserState = async (): Promise<UserInitializationState> => {
    if (enableCustomAuth) {
      return restApiService.getUserState();
    }
    return lambdaClient.user.getUserState.query();
  };

  getUserSSOProviders = async (): Promise<AdapterAccount[]> => {
    if (enableCustomAuth) {
      return restApiService.getUserSSOProviders();
    }
    return lambdaClient.user.getUserSSOProviders.query();
  };

  unlinkSSOProvider = async (provider: string, providerAccountId: string) => {
    if (enableCustomAuth) {
      return restApiService.unlinkSSOProvider(provider, providerAccountId);
    }
    return lambdaClient.user.unlinkSSOProvider.mutate({ provider, providerAccountId });
  };

  makeUserOnboarded = async () => {
    if (enableCustomAuth) {
      return restApiService.makeUserOnboarded();
    }
    return lambdaClient.user.makeUserOnboarded.mutate();
  };

  updateAvatar = async (avatar: string) => {
    if (enableCustomAuth) {
      return restApiService.updateAvatar(avatar);
    }
    return lambdaClient.user.updateAvatar.mutate(avatar);
  };

  updatePreference = async (preference: Partial<UserPreference>) => {
    if (enableCustomAuth) {
      // Update backend directly
      await restApiService.updatePreference(preference);
      // Also update local DB for compatibility
      return lambdaClient.user.updatePreference.mutate(preference);
    }
    // Update local DB (PGLite)
    return lambdaClient.user.updatePreference.mutate(preference);
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
        await customApiService.request('api/user/preferences', {
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
      const backendPrefs = await customApiService.request<Record<string, any>>('api/user/preferences');
      
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
    if (enableCustomAuth) {
      return restApiService.updateGuide(guide);
    }
    return lambdaClient.user.updateGuide.mutate(guide);
  };

  updateUserSettings = async (value: PartialDeep<UserSettings>, signal?: AbortSignal) => {
    if (enableCustomAuth) {
      // Update backend directly
      await restApiService.updateSettings(value);
      // Also update local DB for compatibility
      return lambdaClient.user.updateSettings.mutate(value, { signal });
    }
    return lambdaClient.user.updateSettings.mutate(value, { signal });
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
      
      await customApiService.request('api/user/preferences', {
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
      const backendPrefs = await customApiService.request<Record<string, any>>('api/user/preferences');
      
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
    if (enableCustomAuth) {
      await restApiService.resetSettings();
      // Also reset local DB for compatibility
      return lambdaClient.user.resetSettings.mutate();
    }
    return lambdaClient.user.resetSettings.mutate();
  };
}

export const userService = new UserService();
