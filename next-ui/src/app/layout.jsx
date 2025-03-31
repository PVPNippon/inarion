import { figtree } from './ui/fonts'
import '../app/globals.css'
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
