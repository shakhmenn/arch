import { Suspense } from 'react';
import { Navbar } from '@/widgets/navbar'
import { StoreProvider } from '@/app/providers/store'
import { AppRouter } from '@/app/providers/router'
import { withProviders } from '@/app/ui/providers'
import { Toaster } from 'sonner'

function AppComponent() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="h-[calc(100vh-64px)]">
          <Suspense fallback={<div>Загрузка...</div>}>
            <AppRouter />
          </Suspense>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </StoreProvider>
  )
}

export const App = withProviders(AppComponent)
