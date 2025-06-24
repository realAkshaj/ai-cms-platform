import { Metadata } from 'next';
import RegisterPage from './RegisterPage';

export const metadata: Metadata = {
  title: 'Register - AI CMS Platform',
  description: 'Create your account to get started with AI-powered content management',
};

export default function Register() {
  return <RegisterPage />;
}