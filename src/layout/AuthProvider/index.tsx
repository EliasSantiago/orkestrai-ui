import { PropsWithChildren } from 'react';

import { enableCustomAuth } from '@/const/auth';
import { isDesktop } from '@/const/version';
import { authEnv } from '@/envs/auth';

import Clerk from './Clerk';
import CustomAuth from './CustomAuth';
import { MarketAuthProvider } from './MarketAuth';
import NextAuth from './NextAuth';
import NoAuth from './NoAuth';

const AuthProvider = ({ children }: PropsWithChildren) => {
  // 获取内部 AuthProvider
  let InnerAuthProvider;
  if (authEnv.NEXT_PUBLIC_ENABLE_CLERK_AUTH) {
    InnerAuthProvider = ({ children }: PropsWithChildren) => <Clerk>{children}</Clerk>;
  } else if (authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH) {
    InnerAuthProvider = ({ children }: PropsWithChildren) => <NextAuth>{children}</NextAuth>;
  } else if (enableCustomAuth) {
    InnerAuthProvider = ({ children }: PropsWithChildren) => (
      <CustomAuth>{children}</CustomAuth>
    );
  } else {
    InnerAuthProvider = ({ children }: PropsWithChildren) => <NoAuth>{children}</NoAuth>;
  }

  // 将 MarketAuthProvider 包装在内部 AuthProvider 之外
  return (
    <InnerAuthProvider>
      <MarketAuthProvider isDesktop={isDesktop}>{children}</MarketAuthProvider>
    </InnerAuthProvider>
  );
};

export default AuthProvider;
