import { Metadata } from 'next';
import EditContent from './EditContent';

export const metadata: Metadata = {
  title: 'Edit Content - AI CMS Platform',
  description: 'Edit your content with ease',
};

export default function EditContentPage() {
  return <EditContent />;
}