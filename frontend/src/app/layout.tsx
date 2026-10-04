import type { Metadata } from 'next';
import { Roboto, Geist_Mono } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Converge — Front-line People Manager HR Intelligence',
  description:
    'Turn messy enterprise data (Slack chats, 50-page PDFs) into actionable HR insights and automated ADP workflows for front-line managers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7f6f4] text-ink font-sans selection:bg-blue-500/20 selection:text-ink">
        {children}
      </body>
    </html>
  );
}
