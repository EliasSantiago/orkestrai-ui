import { lambdaClient } from '@/libs/trpc/client';
import { globalHelpers } from '@/store/global/helpers';
import { PluginQueryParams } from '@/types/discover';
import { convertOpenAIManifestToLobeManifest, getToolManifest } from '@/utils/toolManifest';
import { restApiService } from './restApi';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

class ToolService {
  getOldPluginList = async (params: PluginQueryParams): Promise<any> => {
    const locale = globalHelpers.getCurrentLanguage();

    // If custom auth is enabled, use REST API
    if (enableCustomAuth) {
      return restApiService.getPluginList({
        ...params,
        locale,
        page: params.page ? Number(params.page) : 1,
        pageSize: params.pageSize ? Number(params.pageSize) : 20,
      });
    }

    // Otherwise use tRPC
    return lambdaClient.market.getPluginList.query({
      ...params,
      locale,
      page: params.page ? Number(params.page) : 1,
      pageSize: params.pageSize ? Number(params.pageSize) : 20,
    });
  };

  getToolManifest = getToolManifest;
  convertOpenAIManifestToLobeManifest = convertOpenAIManifestToLobeManifest;
}

export const toolService = new ToolService();
