import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wiom | Delhi-Saket Inventory Dashboard',
  description:
    'Live inventory tracking dashboard for Wiom Delhi-Saket warehouse — stock movement, DOI alerts, and reconciliation status.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
