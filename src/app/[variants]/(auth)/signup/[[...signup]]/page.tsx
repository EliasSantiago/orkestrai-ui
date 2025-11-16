import { SignUp } from '@clerk/nextjs';
import { notFound } from 'next/navigation';

import { enableClerk, enableCustomAuth } from '@/const/auth';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import CustomSignup from './CustomSignup';

export const generateMetadata = async (props: DynamicLayoutProps) => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('clerk', locale);
  return metadataModule.generate({
    description: t('signUp.start.subtitle'),
    title: t('signUp.start.title'),
    url: '/signup',
  });
};

const Page = () => {
  if (enableCustomAuth) {
    return <CustomSignup />;
  }

  if (!enableClerk) return notFound();

  return <SignUp path="/signup" />;
};

Page.displayName = 'SignUp';

export default Page;
