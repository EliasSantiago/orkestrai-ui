'use client';

import { Button } from '@lobehub/ui';
import { Form as AntdForm, Input } from 'antd';
import { createStyles } from 'antd-style';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import BrandWatermark from '@/components/BrandWatermark';
import { customAuthService } from '@/services/customAuth';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    min-width: 360px;
    max-width: 400px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
    padding: 2.5rem 2rem;
  `,
  title: css`
    margin: 0 0 0.5rem 0;
    color: ${token.colorTextHeading};
    text-align: center;
  `,
  description: css`
    margin: 0 0 2rem 0;
    color: ${token.colorTextSecondary};
    text-align: center;
  `,
  form: css`
    width: 100%;
  `,
  submitButton: css`
    width: 100%;
    margin-top: 1rem;
  `,
  footer: css`
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid ${token.colorBorder};
    text-align: center;
    color: ${token.colorTextDescription};
  `,
  error: css`
    color: ${token.colorError};
    margin-bottom: 1rem;
    text-align: center;
  `,
  link: css`
    color: ${token.colorPrimary};
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  `,
}));

export default function CustomLogin() {
  const { styles } = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = AntdForm.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      await customAuthService.login({
        email: values.email,
        password: values.password,
      });

      // Redirect to callback URL or home
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Login</h2>
      <p className={styles.description}>Enter your credentials to access your account</p>

      {error && <div className={styles.error}>{error}</div>}

      <AntdForm
        form={form}
        className={styles.form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <AntdForm.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="your@email.com" size="large" />
        </AntdForm.Item>

        <AntdForm.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password placeholder="Enter your password" size="large" />
        </AntdForm.Item>

        <AntdForm.Item>
          <Button
            htmlType="submit"
            loading={loading}
            size="large"
            type="primary"
            className={styles.submitButton}
          >
            Login
          </Button>
        </AntdForm.Item>
      </AntdForm>

      <div className={styles.footer}>
        <div>
          Don&apos;t have an account?{' '}
          <span className={styles.link} onClick={() => router.push('/signup')}>
            Register
          </span>
        </div>
        <BrandWatermark style={{ marginTop: '1rem' }} />
      </div>
    </div>
  );
}

