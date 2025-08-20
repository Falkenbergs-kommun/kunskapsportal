// (frontend)/[...slug]/page.tsx
import { notFound } from 'next/navigation'

export default function CatchAll() {
  // This will trigger the not-found.tsx in the same route group
  notFound()
}
