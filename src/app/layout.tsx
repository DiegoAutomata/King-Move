import { Metadata } from 'next';
import './globals.css'
import { MainLayout } from '@/shared/components/layout/MainLayout'

export const metadata: Metadata = {
  title: 'King Move - Play Chess & Win Real Money',
  description: 'The premier competitive chess platform. Play for fun, train with AI, or bet real cash in ELO-based leagues.',
  icons: { icon: '/king-move-logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}
