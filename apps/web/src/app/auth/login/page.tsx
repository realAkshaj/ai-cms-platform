import { Metadata } from 'next';
import LoginPage from './LoginPage';

export const metadata: Metadata = {
  title: 'Login - AI CMS Platform',
  description: 'Sign in to your AI CMS Platform account',
};

export default function Login() {
  return <LoginPage />;
}