import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ConvexClientProvider } from '@/components/providers/convex-provider'
import { Toaster } from 'sonner';
import { ModalProvider } from '@/components/providers/modal-provider'
import { EdgeStoreProvider } from '@/lib/edgestore'
const inter = Inter({ subsets: ['latin'] })



export const metadata: Metadata = {
  title: 'Notion-Clone',
  description: 'Empower Your Productivity with Notion: Where Ideas Become Reality',
  icons:{
    icon:[
    {
      media:"(prefers-color-schema :light)",
      url:"/jotion-logo.svg",
      href:"/jotion-logo.svg"
    },
    {
      media:"(prefers-color-schema :dark)",
      url:"/jotion-logo-dark.svg",
      href:"/jotion-logo-dark.svg"
    }
  ]
}
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexClientProvider>
          <EdgeStoreProvider>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
          storageKey='jotion-theme-2'
          >
            <Toaster position='bottom-center'/>
            <ModalProvider/>
          {children}
        </ThemeProvider>
          </EdgeStoreProvider>
        </ConvexClientProvider>
        </body>
    </html>
  )
}
