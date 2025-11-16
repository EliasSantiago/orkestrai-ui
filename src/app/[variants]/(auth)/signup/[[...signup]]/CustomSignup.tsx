'use client';

import { Button } from '@lobehub/ui';
import { Form as AntdForm, Input } from 'antd';
import { createStyles } from 'antd-style';
import { useRouter } from 'next/navigation';
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
  success: css`
    color: ${token.colorSuccess};
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

export default function CustomSignup() {
  const { styles } = useStyles();
  const router = useRouter();
  const [form] = AntdForm.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values: {
    name: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate password confirmation
    if (values.password !== values.password_confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await customAuthService.register({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirm: values.password_confirm,
      });

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create Account</h2>
      <p className={styles.description}>Sign up to get started</p>

      {error && <div className={styles.error}>{error}</div>}
      {success && (
        <div className={styles.success}>
          Registration successful! Redirecting to login...
        </div>
      )}

      <AntdForm
        form={form}
        className={styles.form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <AntdForm.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input placeholder="Your name" size="large" />
        </AntdForm.Item>

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
          rules={[
            { required: true, message: 'Please enter your password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password placeholder="Enter your password" size="large" />
        </AntdForm.Item>

        <AntdForm.Item
          name="password_confirm"
          label="Confirm Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm your password" size="large" />
        </AntdForm.Item>

        <AntdForm.Item>
          <Button
            htmlType="submit"
            loading={loading}
            size="large"
            type="primary"
            className={styles.submitButton}
          >
            Register
          </Button>
        </AntdForm.Item>
      </AntdForm>

      <div className={styles.footer}>
        <div>
          Already have an account?{' '}
          <span className={styles.link} onClick={() => router.push('/login')}>
            Login
          </span>
        </div>
        <BrandWatermark style={{ marginTop: '1rem' }} />
      </div>
    </div>
  );
}

