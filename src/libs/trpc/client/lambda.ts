import { TRPCLink, createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { observable } from '@trpc/server/observable';
import debug from 'debug';
import { ModelProvider } from 'model-bank';
import superjson from 'superjson';

import { isDesktop } from '@/const/version';
import type { LambdaRouter } from '@/server/routers/lambda';

const log = debug('lobe-image:lambda-client');

// 401 error debouncing: prevent showing multiple login notifications in short time
let last401Time = 0;
const MIN_401_INTERVAL = 5000; // 5 seconds

// handle error
const errorHandlingLink: TRPCLink<LambdaRouter> = () => {
  return ({ op, next }) =>
    observable((observer) =>
      next(op).subscribe({
        complete: () => observer.complete(),
        error: async (err) => {
          // Check if this is an abort error and should be ignored
          const isAbortError =
            err.message.includes('aborted') ||
            err.name === 'AbortError' ||
            err.cause?.name === 'AbortError' ||
            err.message.includes('signal is aborted without reason');

          const showError = (op.context?.showNotification as boolean) ?? true;
          const status = err.data?.httpStatus as number;

          // Don't show notifications for abort errors
          if (showError && !isAbortError) {
            const { loginRequired } = await import('@/components/Error/loginRequiredNotification');
            const { fetchErrorNotification } = await import(
              '@/components/Error/fetchErrorNotification'
            );

            switch (status) {
              case 401: {
                // Debounce: only show login notification once every 5 seconds
                const now = Date.now();
                if (now - last401Time > MIN_401_INTERVAL) {
                  last401Time = now;
                  loginRequired.redirect();
                }
                // Mark error as non-retryable to prevent SWR infinite retry loop
                err.meta = { ...err.meta, shouldRetry: false };
                break;
              }

              default: {
                if (fetchErrorNotification)
                  fetchErrorNotification.error({ errorMessage: err.message, status });
              }
            }
          }

          observer.error(err);
        },
        next: (value) => observer.next(value),
      }),
    );
};

// Get API base URL - use custom backend when custom auth is enabled
// NOTE: When NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1, all services use REST directly via restApiService.
// This lambdaClient is only used when custom auth is NOT enabled (local development mode).
const getApiUrl = (): string => {
  // Check if custom auth is enabled
  const enableCustomAuth =
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

  if (enableCustomAuth) {
    // When custom auth is enabled, services should use restApiService directly.
    // This lambdaClient should not be used, but if it is, return a placeholder.
    // The backend no longer has a /trpc/lambda proxy endpoint.
    const customApiUrl = process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL;
    if (customApiUrl) {
      // Return a non-existent endpoint to force errors if someone tries to use lambdaClient
      // with custom auth enabled. This helps catch any remaining tRPC calls.
      return `${customApiUrl}/trpc/lambda-deprecated`;
    }
  }

  // Default to local lambda endpoint (only used when custom auth is NOT enabled)
  return '/trpc/lambda';
};

// 2. httpBatchLink
const customHttpBatchLink = httpBatchLink({
  fetch: async (input, init) => {
    if (isDesktop) {
      const { desktopRemoteRPCFetch } = await import('@/utils/electron/desktopRemoteRPCFetch');

      // eslint-disable-next-line no-undef
      const res = await desktopRemoteRPCFetch(input as string, init as RequestInit);

      if (res) return res;
    }

    // eslint-disable-next-line no-undef
    return await fetch(input, init as RequestInit);
  },
  headers: async () => {
    // Check if custom auth is enabled
    const enableCustomAuth =
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

    if (enableCustomAuth) {
      // Use custom auth token for authenticated requests
      const { customAuthService } = await import('@/services/customAuth');
      const token = customAuthService.getAccessToken();
      
      if (token) {
        return {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
      }
    }

    // dynamic import to avoid circular dependency
    const { createHeaderWithAuth } = await import('@/services/_auth');

    let provider: ModelProvider | undefined;
    // for image page, we need to get the provider from the store
    log('Getting provider from store for image page: %s', location.pathname);
    if (location.pathname === '/image') {
      const { getImageStoreState } = await import('@/store/image');
      const { imageGenerationConfigSelectors } = await import(
        '@/store/image/slices/generationConfig/selectors'
      );
      provider = imageGenerationConfigSelectors.provider(getImageStoreState()) as ModelProvider;
      log('Getting provider from store for image page: %s', provider);
    }

    // Only include provider in JWT for image operations
    // For other operations (like knowledge base embedding), let server use its own config
    const headers = await createHeaderWithAuth(provider ? { provider } : undefined);
    log('Headers: %O', headers);
    return headers;
  },
  maxURLLength: 2083,
  transformer: superjson,
  url: getApiUrl(),
});

// 3. assembly links
const links = [errorHandlingLink, customHttpBatchLink];

export const lambdaClient = createTRPCClient<LambdaRouter>({
  links,
});

export const lambdaQuery = createTRPCReact<LambdaRouter>();

export const lambdaQueryClient = lambdaQuery.createClient({ links });
