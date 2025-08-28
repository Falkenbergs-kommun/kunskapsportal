import Link from 'next/link'
import { FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8 text-center">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FileX className="mx-auto h-16 w-16 text-slate-400 mb-6" />
        <h1 className="text-4xl font-bold text-slate-900 mb-2">404 - Sidan hittades inte</h1>
        <p className="text-slate-600 mb-8">
          Vi kunde inte hitta sidan du letade efter. Den kan ha flyttats eller avpublicerats.
        </p>
        <Button asChild>
          <Link href="/">Gå tillbaka till startsidan</Link>
        </Button>
      </div>
    </div>
  )
}
