import type { Metadata } from 'next';
import './globals.css';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: `Happy ${site.age}rd Birthday, ${site.partner} | A little surprise`,
  description: `A birthday keepsake made with love by ${site.from} for ${site.partner}.`,
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
