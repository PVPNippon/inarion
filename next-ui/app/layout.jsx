import { inter, openSans } from './ui/fonts'
import '../app/ui/globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={openSans.className}>{children}</body>
    </html>
  )
}
