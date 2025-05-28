// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AI Conversation System - Premium AI Collaboration Platform',
    template: '%s | AI Conversation System'
  },
  description: 'Experience the future of AI collaboration with our premium conversation platform. Create dynamic interactions between multiple AI agents with advanced text-to-speech capabilities.',
  keywords: [
    'AI conversation',
    'artificial intelligence',
    'AI collaboration',
    'text to speech',
    'machine learning',
    'conversational AI',
    'AI agents',
    'premium AI platform'
  ],
  authors: [
    {
      name: 'Piotr Tamulewicz',
      url: 'https://petertam.pro',
    }
  ],
  creator: 'Piotr Tamulewicz',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-conversation.vercel.app',
    siteName: 'AI Conversation System',
    title: 'AI Conversation System - Premium AI Collaboration',
    description: 'Experience the future of AI collaboration with our premium conversation platform.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Conversation System - Premium AI Collaboration Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Conversation System - Premium AI Collaboration',
    description: 'Experience the future of AI collaboration with our premium conversation platform.',
    images: ['/og-image.png'],
    creator: '@petertam',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#000000',
      },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#000000',
    'theme-color': '#ffffff',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical resources */}
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" 
          as="style" 
        />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
        
        {/* Performance optimization */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'AI Conversation System',
              description: 'Premium AI collaboration platform for dynamic conversations between AI agents',
              url: 'https://ai-conversation.vercel.app',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Person',
                name: 'Piotr Tamulewicz',
                url: 'https://petertam.pro',
              },
            }),
          }}
        />
      </head>
      
      <body 
        className={`${inter.className} min-h-screen bg-background font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Skip to main content
        </a>

        {/* Main application content */}
        <div id="main-content" className="relative flex min-h-screen flex-col">
          {children}
        </div>

        {/* Toast notifications */}
        <Toaster 
          position="bottom-right"
          expand={true}
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />

        {/* Loading indicator for better UX */}
        <div 
          id="global-loading" 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm hidden items-center justify-center"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-lg font-medium">Loading...</span>
          </div>
        </div>

        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />

        {/* Analytics placeholder */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics or your preferred analytics */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Analytics initialization
                  console.log('Analytics initialized for production');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}