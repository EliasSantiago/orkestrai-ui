import debug from 'debug';
import { TRPCError } from '@trpc/server';

import { getServerFeatureFlagsStateFromEdgeConfig } from '@/config/featureFlags';
import { publicProcedure, router } from '@/libs/trpc/lambda';
import { getServerDefaultAgentConfig, getServerGlobalConfig } from '@/server/globalConfig';
import { GlobalRuntimeConfig } from '@/types/serverConfig';

const log = debug('config-router');

export const configRouter = router({
  getDefaultAgentConfig: publicProcedure.query(async () => {
    return getServerDefaultAgentConfig();
  }),

  getGlobalConfig: publicProcedure.query(async ({ ctx }): Promise<GlobalRuntimeConfig> => {
    log('[GlobalConfig] Starting global config retrieval for user:', ctx.userId || 'anonymous');

    try {
      const serverConfig = await getServerGlobalConfig();
      log('[GlobalConfig] Server config retrieved');

      const serverFeatureFlags = await getServerFeatureFlagsStateFromEdgeConfig(
        ctx.userId || undefined,
      );
      log(
        '[GlobalConfig] Final feature flags to return (evaluated booleans only):',
        serverFeatureFlags,
      );

      const result = { serverConfig, serverFeatureFlags };
      log(
        '[GlobalConfig] Returning global config with feature flags keys:',
        Object.keys(serverFeatureFlags),
      );

      return result;
    } catch (error) {
      // Log full error stack server-side for debugging
      log('[GlobalConfig] Error while building global config:', error);
      // Also output to stderr so container logs capture it clearly
      // eslint-disable-next-line no-console
      console.error('[GlobalConfig] Error while building global config:', error);

      // Throw sanitized TRPC error to return 500 to client while keeping logs for debugging
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to build global config' });
    }
  }),
});
