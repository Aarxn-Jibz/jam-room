import { useEffect, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function FocusTrap({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => { root.current?.querySelector<HTMLElement>(selector)?.focus() }, [])
  const trap = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !root.current) return
    const items = [...root.current.querySelectorAll<HTMLElement>(selector)]
    if (!items.length) return
    const first = items[0]; const last = items.at(-1)!
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  return <div ref={root} onKeyDown={trap}>{children}</div>
}
