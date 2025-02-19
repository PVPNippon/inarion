import { figtree } from './ui/fonts'
import './ui/globals.css'
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body className={figtree.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
