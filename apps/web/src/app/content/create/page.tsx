import { Metadata } from 'next';
import CreateContent from './CreateContent';

export const metadata: Metadata = {
  title: 'Create Content - AI CMS Platform',
  description: 'Create amazing content with AI assistance',
};

export default function CreateContentPage() {
  return <CreateContent />;
}

