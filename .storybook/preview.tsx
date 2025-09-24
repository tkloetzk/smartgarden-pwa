import type { Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initialize, mswLoader } from 'msw-storybook-addon'
import '../src/styles/globals.css'

// Initialize MSW
initialize()

// Mark that we're in Storybook so app modules can opt-out of heavy work
;(window as any).__STORYBOOK__ = true
if (typeof document !== "undefined") {
  document.documentElement.classList.add("antialiased"); // example
  // document.documentElement.classList.add("dark"); // uncomment if app default is dark
}

const queryClient = new QueryClient()

const withProviders = (Story: any, context: any) => {
  return (
    <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background text-foreground">
          <Story {...context} />
        </div>
    </QueryClientProvider>
  )
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // MSW parameters
    msw: {
      handlers: [],
    },

    a11y: {
      test: 'todo',
    },

    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f0f23' },
      ],
    },
  },

  loaders: [mswLoader],
  decorators: [withProviders],
}

export default preview
