import './tokens.css';
import './dashboard-components.css';
import './globals.css';
import dynamic from 'next/dynamic';
import { ThemeProvider } from './components/ThemeProvider';
import Script from 'next/script';

const DashboardShell = dynamic(() => import('./components/DashboardShell'), { ssr: false });

export const metadata = {
  title: {
    default: 'Freedly',
    template: 'Freedly - %s',
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
  robots: { index: true, follow: true },
  icons: { icon: '/icon.svg', shortcut: '/icon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()` }} />
      </head>
      <body>
        <ThemeProvider>
          <DashboardShell>{children}</DashboardShell>
        </ThemeProvider>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-FKDXKKM2R0" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-FKDXKKM2R0');` }} />
      </body>
    </html>
  );
}
