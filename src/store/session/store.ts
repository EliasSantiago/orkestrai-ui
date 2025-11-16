import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { StateCreator } from 'zustand/vanilla';

import { isDev } from '@/utils/env';

import { createDevtools } from '../middleware/createDevtools';
import { SessionStoreState, initialState } from './initialState';
import {
  BackendSyncAction,
  BackendSyncState,
  createBackendSyncSlice,
} from './slices/backendSync/action';
import { SessionAction, createSessionSlice } from './slices/session/action';
import { SessionGroupAction, createSessionGroupSlice } from './slices/sessionGroup/action';

//  ===============  聚合 createStoreFn ============ //

export interface SessionStore
  extends SessionAction,
    SessionGroupAction,
    BackendSyncAction,
    BackendSyncState,
    SessionStoreState {}

const createStore: StateCreator<SessionStore, [['zustand/devtools', never]]> = (...parameters) => ({
  ...initialState,
  ...createSessionSlice(...parameters),
  ...createSessionGroupSlice(...parameters),
  ...createBackendSyncSlice(...parameters),
});

//  ===============  implement useStore ============ //
const devtools = createDevtools('session');

export const useSessionStore = createWithEqualityFn<SessionStore>()(
  subscribeWithSelector(
    devtools(createStore, {
      name: 'LobeChat_Session' + (isDev ? '_DEV' : ''),
    }),
  ),
  shallow,
);

export const getSessionStoreState = () => useSessionStore.getState();
