import { inter } from './ui/fonts'
import '../app/ui/globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
