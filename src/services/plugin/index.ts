import { LobeTool } from '@lobechat/types';
import { LobeChatPluginManifest } from '@lobehub/chat-plugin-sdk';

import { lambdaClient } from '@/libs/trpc/client';
import { LobeToolCustomPlugin } from '@/types/tool/plugin';
import { restApiService } from '../restApi';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

export interface InstallPluginParams {
  customParams?: Record<string, any>;
  identifier: string;
  manifest: LobeChatPluginManifest;
  settings?: Record<string, any>;
  type: 'plugin' | 'customPlugin';
}

export class PluginService {
  installPlugin = async (plugin: InstallPluginParams): Promise<void> => {
    if (enableCustomAuth) {
      return restApiService.createOrInstallPlugin(plugin);
    }
    await lambdaClient.plugin.createOrInstallPlugin.mutate(plugin);
  };

  getInstalledPlugins = (): Promise<LobeTool[]> => {
    if (enableCustomAuth) {
      return restApiService.getPlugins();
    }
    return lambdaClient.plugin.getPlugins.query();
  };

  uninstallPlugin = async (identifier: string): Promise<void> => {
    if (enableCustomAuth) {
      return restApiService.removePlugin(identifier);
    }
    await lambdaClient.plugin.removePlugin.mutate({ id: identifier });
  };

  createCustomPlugin = async (customPlugin: LobeToolCustomPlugin): Promise<void> => {
    if (enableCustomAuth) {
      return restApiService.createPlugin({ ...customPlugin, type: 'customPlugin' });
    }
    await lambdaClient.plugin.createPlugin.mutate({ ...customPlugin, type: 'customPlugin' });
  };

  updatePlugin = async (id: string, value: Partial<LobeToolCustomPlugin>): Promise<void> => {
    if (enableCustomAuth) {
      return restApiService.updatePlugin(id, {
        customParams: value.customParams,
        manifest: value.manifest,
        settings: value.settings,
      });
    }
    await lambdaClient.plugin.updatePlugin.mutate({
      customParams: value.customParams,
      id,
      manifest: value.manifest,
      settings: value.settings,
    });
  };

  updatePluginManifest = async (id: string, manifest: LobeChatPluginManifest): Promise<void> => {
    if (enableCustomAuth) {
      return restApiService.updatePlugin(id, { manifest });
    }
    await lambdaClient.plugin.updatePlugin.mutate({ id, manifest });
  };

  removeAllPlugins = async (): Promise<void> => {
    if (enableCustomAuth) {
      return restApiService.removeAllPlugins();
    }
    await lambdaClient.plugin.removeAllPlugins.mutate();
  };

  updatePluginSettings = async (id: string, settings: any, signal?: AbortSignal): Promise<void> => {
    if (enableCustomAuth) {
      return restApiService.updatePlugin(id, { settings });
    }
    await lambdaClient.plugin.updatePlugin.mutate({ id, settings }, { signal });
  };
}

export const pluginService = new PluginService();
