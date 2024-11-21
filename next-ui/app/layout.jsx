import { figtree } from './ui/fonts'
import '../app/ui/globals.css'
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={figtree.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
