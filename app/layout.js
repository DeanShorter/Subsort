import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';

export const metadata = {
  title: {
    default: 'Freedly — Organise & Discover the Best YouTube Channels',
    template: '%s | Freedly',
  },
  description: 'Automatically categorise your YouTube subscriptions, discover quality creators, and keep your feed clean. Free forever.',
  keywords: ['YouTube', 'subscriptions', 'organise', 'categorise', 'channels', 'discover', 'feed management'],
  authors: [{ name: 'Freedly' }],
  openGraph: {
    title: 'Freedly — Organise & Discover the Best YouTube Channels',
    description: 'Automatically categorise your YouTube subscriptions, discover quality creators, and keep your feed clean.',
    url: 'https://usefreedly.com',
    siteName: 'Freedly',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Freedly — Organise & Discover the Best YouTube Channels',
    description: 'Automatically categorise your YouTube subscriptions and discover quality creators.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()` }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
