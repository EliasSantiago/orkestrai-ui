/**
 * Backend Sync Slice
 * Manages synchronization between LobeChat sessions and the custom backend
 */

import { StateCreator } from 'zustand/vanilla';

import { enableCustomAuth } from '@/const/auth';
import { customApiService } from '@/services/customApi';
import type { SessionStore } from '@/store/session';
import { LobeAgentSession } from '@/types/session';

/**
 * Mapping between LobeChat session IDs and backend agent IDs
 */
export interface BackendSyncState {
  /**
   * Map of LobeChat session ID -> Backend agent ID
   */
  backendAgentMap: Record<string, number>;
  /**
   * Whether the initial sync has completed
   */
  isSynced: boolean;
}

export interface BackendSyncAction {
  /**
   * Get backend agent ID for a session
   */
  getBackendAgentId: (sessionId: string) => number | undefined;
  /**
   * Load all agents from backend and create sessions for them
   */
  loadAgentsFromBackend: () => Promise<void>;
  /**
   * Register a mapping between session and backend agent
   */
  registerBackendAgent: (sessionId: string, backendAgentId: number) => void;
  /**
   * Sync a newly created agent session to the backend
   */
  syncAgentToBackend: (session: LobeAgentSession) => Promise<number | null>;
}

export const initialBackendSyncState: BackendSyncState = {
  backendAgentMap: {},
  isSynced: false,
};

export const createBackendSyncSlice: StateCreator<
  SessionStore,
  [['zustand/devtools', never]],
  [],
  BackendSyncAction & BackendSyncState
> = (set, get) => ({
  ...initialBackendSyncState,

  getBackendAgentId: (sessionId: string) => {
    const state = get();
    return state.backendAgentMap[sessionId];
  },

  registerBackendAgent: (sessionId: string, backendAgentId: number) => {
    set(
      (state) => ({
        backendAgentMap: {
          ...state.backendAgentMap,
          [sessionId]: backendAgentId,
        },
      }),
      false,
      'registerBackendAgent',
    );
  },

  syncAgentToBackend: async (session: LobeAgentSession) => {
    // Only sync if custom auth is enabled
    if (!enableCustomAuth) return null;

    // Check if this session already has a backend agent mapped
    const existingBackendAgentId = get().getBackendAgentId(session.id);
    if (existingBackendAgentId) {
      console.log('[BackendSync] Session already has backend agent, skipping sync:', {
        backendAgentId: existingBackendAgentId,
        sessionId: session.id,
      });
      return existingBackendAgentId;
    }

    try {
      const backendAgentData = customApiService.mapLobeAgentToBackend(session);
      const backendAgent = await customApiService.createAgent(backendAgentData);

      // Register the mapping
      get().registerBackendAgent(session.id, backendAgent.id);

      console.log('[BackendSync] Agent synced to backend:', {
        backendAgentId: backendAgent.id,
        sessionId: session.id,
        title: session.meta.title,
      });

      return backendAgent.id;
    } catch (error) {
      console.error('[BackendSync] Failed to sync agent to backend:', error);
      // Don't throw - allow local creation to proceed
      return null;
    }
  },

  loadAgentsFromBackend: async () => {
    // Only load if custom auth is enabled
    if (!enableCustomAuth) {
      set({ isSynced: true }, false, 'loadAgentsFromBackend/disabled');
      return;
    }

    try {
      console.log('[BackendSync] Loading agents from backend...');
      const backendAgents = await customApiService.listAgents();

      console.log(`[BackendSync] Found ${backendAgents.length} agents in backend`);

      // Get current mapping to avoid duplicates
      const currentMap = get().backendAgentMap;
      const existingBackendIds = new Set(Object.values(currentMap));

      // For each backend agent, check if we already have a session for it
      for (const backendAgent of backendAgents) {
        // Skip if already mapped
        if (existingBackendIds.has(backendAgent.id)) {
          console.log(`[BackendSync] Agent ${backendAgent.id} already mapped, skipping`);
          continue;
        }

        try {
          // Map backend agent to LobeChat format
          const { config, meta } = customApiService.mapBackendAgentToLobe(backendAgent);

          // Register the mapping BEFORE creating the session
          // This prevents syncAgentToBackend from trying to re-sync
          // Use a temporary ID that will be replaced with the real sessionId
          const tempId = `temp_${backendAgent.id}`;
          get().registerBackendAgent(tempId, backendAgent.id);

          try {
            // Create session locally (DON'T switch to it)
            const sessionId = await get().createSession(
              {
                config,
                meta,
              },
              false,
            );

            // Update mapping with the real sessionId
            const currentMap = get().backendAgentMap;
            delete currentMap[tempId];
            get().registerBackendAgent(sessionId, backendAgent.id);

            console.log('[BackendSync] Created local session for backend agent:', {
              backendAgentId: backendAgent.id,
              name: backendAgent.name,
              sessionId,
            });
          } catch (createError) {
            // Clean up temp mapping if session creation fails
            const currentMap = get().backendAgentMap;
            delete currentMap[tempId];
            throw createError;
          }
        } catch (error) {
          console.error('[BackendSync] Failed to create session for agent:', backendAgent.id, error);
          // Continue with other agents even if one fails
        }
      }

      set({ isSynced: true }, false, 'loadAgentsFromBackend/success');
    } catch (error) {
      console.error('[BackendSync] Failed to load agents from backend:', error);
      set({ isSynced: true }, false, 'loadAgentsFromBackend/error');
    }
  },
});


