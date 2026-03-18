import './globals.css';

export const metadata = {
  title: {
    default: 'Subsort — Organise & Discover the Best YouTube Channels',
    template: '%s | Subsort',
  },
  description: 'Automatically categorise your YouTube subscriptions, discover quality creators, and keep your feed clean. Free forever.',
  keywords: ['YouTube', 'subscriptions', 'organise', 'categorise', 'channels', 'discover', 'feed management'],
  authors: [{ name: 'Subsort' }],
  openGraph: {
    title: 'Subsort — Organise & Discover the Best YouTube Channels',
    description: 'Automatically categorise your YouTube subscriptions, discover quality creators, and keep your feed clean.',
    url: 'https://subsort.vercel.app',
    siteName: 'Subsort',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Subsort — Organise & Discover the Best YouTube Channels',
    description: 'Automatically categorise your YouTube subscriptions and discover quality creators.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
