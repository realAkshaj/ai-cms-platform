import { Metadata } from 'next';
import ContentList from './ContentList';

export const metadata: Metadata = {
  title: 'Content Management - AI CMS Platform',
  description: 'Manage all your content in one place',
};

export default function ContentListPage() {
  return <ContentList />;
}