import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

export default function dynamic(loader: () => Promise<{ default: ComponentType<any> }>, options?: { loading?: () => ReactNode }) {
  const Lazy = lazy(loader)
  return function Dynamic(props: Record<string, unknown>) {
    const Loading = options?.loading
    return <Suspense fallback={Loading ? <Loading /> : null}><Lazy {...(props as Record<string, unknown>)} /></Suspense>
  }
}
