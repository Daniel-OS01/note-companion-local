'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import dynamic from 'next/dynamic'

// Dynamically import the PostHogPageView component to avoid SSR issues
const PostHogPageView = dynamic(() => import('./PostHogPageView'), {
  ssr: false,
})

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  }))

  useEffect(() => {
    // Only initialize PostHog in the browser, not during SSR
    if (typeof window !== 'undefined') {
      posthog.init('phc_f004Gv83AkfXh2WJ9XQ7zqaujgajgiS3YXEYa52Evfp', {
        api_host: "/ingest",
        ui_host: 'https://us.posthog.com',
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        capture_pageleave: true, // Enable pageleave capture
      })
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <PostHogProvider client={posthog}>
          <PostHogPageView />
          {children}
        </PostHogProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}