import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/lib/cart-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Amazon Neighborhood AI - Smart Shopping Assistant',
  description: 'AI-powered shopping assistant that transforms your intent into a ready-to-buy shopping cart',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <div className="min-h-screen bg-gradient-to-b from-amazon-blue-dark to-amazon-blue">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
