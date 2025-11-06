'use client'

import {
  Search,
  MessageSquare,
  Star,
  Keyboard,
  FileText,
  Filter,
  BookOpen,
  Sparkles,
  Minus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { usePlatform } from '@/hooks/usePlatform'

export default function DocsPage() {
  const { modKey } = usePlatform()

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-5xl font-bold text-black mb-4">
          Användarguide
        </h1>
        <p className="text-lg text-slate-600">
          Lär dig använda Kunskapsportalen effektivt
        </p>
      </div>

      {/* Quick Start */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-black mb-6">Snabbstart</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg">
            <div className="p-2 bg-slate-100 rounded">
              <Search className="h-5 w-5 text-black" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">Snabbsök</h3>
              <p className="text-slate-600 text-sm mb-2">
                Tryck <Badge variant="outline" className="mx-1">{modKey}K</Badge> för att öppna snabbsökningen
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg">
            <div className="p-2 bg-slate-100 rounded">
              <MessageSquare className="h-5 w-5 text-black" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">AI-assistent</h3>
              <p className="text-slate-600 text-sm mb-2">
                Tryck <Badge variant="outline" className="mx-1">{modKey}J</Badge> för att öppna AI-chatten
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg">
            <div className="p-2 bg-slate-100 rounded">
              <Star className="h-5 w-5 text-black" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">Favoriter</h3>
              <p className="text-slate-600 text-sm mb-2">
                Klicka på stjärnan för att spara viktiga sidor
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-black mb-6">Sökning</h2>

        <h3 className="text-xl font-semibold text-black mb-4">Snabbsök ({modKey}K)</h3>
        <p className="text-slate-600 mb-4">
          Det snabbaste sättet att hitta dokument. Tryck <Badge variant="outline">{modKey}K</Badge> var som helst för att öppna sökfältet.
        </p>

        <ul className="space-y-2 mb-8">
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Realtidssökning - resultat visas direkt medan du skriver</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Smart matchning - söker i titel, innehåll och sammanfattning</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Navigeringsgenvägar - hoppa direkt till Admin eller Hem</span>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-black mb-4">Avdelningsnavigering</h3>
        <p className="text-slate-600 mb-4">
          Använd sidomenyn till vänster för att bläddra genom kommunens avdelningar.
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Hierarkisk struktur med upp till 3 nivåer</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Expanderbara sektioner för underavdelningar</span>
          </li>
        </ul>
      </section>

      {/* AI Assistant */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-black mb-6">AI-assistent</h2>

        <p className="text-slate-600 mb-6">
          AI-assistenten har tillgång till hela kunskapsdatabasen och kan hjälpa dig hitta rätt information snabbt.
        </p>

        <h3 className="text-xl font-semibold text-black mb-4">Grundläggande användning</h3>
        <ul className="space-y-2 mb-8">
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Öppna chatten med <Badge variant="outline">{modKey}J</Badge> eller klicka på "Fråga AI"</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Ställ frågor på svenska eller engelska</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Få direktlänkar till relevanta dokument</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Konversationshistorik sparas mellan sessioner</span>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-black mb-4">Källfiltrering</h3>
        <p className="text-slate-600 mb-4">
          Begränsa AI-assistentens sökområde till specifika avdelningar eller externa källor.
        </p>
        <ul className="space-y-2 mb-8">
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Klicka på "X källor valda" i chattfönstret</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Välj en eller flera avdelningar att söka inom</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Underavdelningar inkluderas automatiskt</span>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-black mb-4">Chatta om specifik artikel</h3>
        <p className="text-slate-600 mb-4">
          När du läser ett dokument kan du ställa frågor specifikt om dess innehåll.
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>Klicka på "Chatta om artikel" i artikelvyn</span>
          </li>
          <li className="flex items-start gap-2 text-slate-700">
            <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>AI:n fokuserar på det aktuella dokumentets innehåll</span>
          </li>
        </ul>
      </section>

      {/* Favorites */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-black mb-6">Favoriter</h2>
        <p className="text-slate-600 mb-6">
          Spara viktiga dokument och sidor för snabb åtkomst. Favoriterna visas i sidomenyn.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Lägg till favorit</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-slate-700">
                <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <span>Klicka på stjärnikonen på valfri sida</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700">
                <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <span>Fungerar för artiklar och avdelningssidor</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Hantera favoriter</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-slate-700">
                <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <span>Visa alla i sidomenyn under "Favoriter"</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700">
                <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <span>Sparas automatiskt mellan sessioner</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-black mb-6">Tangentbordsgenvägar</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Navigation</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-700">Snabbsök</span>
                <div className="flex gap-1">
                  <Badge variant="outline">{modKey}</Badge>
                  <Badge variant="outline">K</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-700">Växla vänster meny</span>
                <div className="flex gap-1">
                  <Badge variant="outline">{modKey}</Badge>
                  <Badge variant="outline">B</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-700">Öppna AI-chatt</span>
                <div className="flex gap-1">
                  <Badge variant="outline">{modKey}</Badge>
                  <Badge variant="outline">J</Badge>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-black mb-4">I chatten</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-700">Skicka meddelande</span>
                <Badge variant="outline">Enter</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-700">Ny rad</span>
                <div className="flex gap-1">
                  <Badge variant="outline">Shift</Badge>
                  <Badge variant="outline">Enter</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Document Types */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-black mb-6">Dokumenttyper</h2>

        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Policy</span>
            <span className="text-slate-500 text-sm">- Övergripande riktlinjer</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Riktlinje</span>
            <span className="text-slate-500 text-sm">- Detaljerade instruktioner</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Anvisning</span>
            <span className="text-slate-500 text-sm">- Praktisk vägledning</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Rutin</span>
            <span className="text-slate-500 text-sm">- Arbetsprocesser</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Plan</span>
            <span className="text-slate-500 text-sm">- Strategiska dokument</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Protokoll</span>
            <span className="text-slate-500 text-sm">- Mötesanteckningar</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Rapport</span>
            <span className="text-slate-500 text-sm">- Analyser och utredningar</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Beslut</span>
            <span className="text-slate-500 text-sm">- Formella beslut</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Avtal</span>
            <span className="text-slate-500 text-sm">- Juridiska överenskommelser</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">Mall</span>
            <span className="text-slate-500 text-sm">- Återanvändbara dokument</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-700">FAQ</span>
            <span className="text-slate-500 text-sm">- Vanliga frågor</span>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-black mb-6">Tips</h2>

        <div className="space-y-4">
          <div className="p-4 border-l-4 border-black bg-slate-50">
            <p className="font-semibold text-black mb-1">Använd snabbsök för allt</p>
            <p className="text-slate-600 text-sm">
              ⌘K är det snabbaste sättet att navigera. Sök dokument, hoppa till sidor och mycket mer.
            </p>
          </div>

          <div className="p-4 border-l-4 border-black bg-slate-50">
            <p className="font-semibold text-black mb-1">Ställ följdfrågor till AI:n</p>
            <p className="text-slate-600 text-sm">
              AI-assistenten minns konversationen. Ställ följdfrågor för att fördjupa dig i ämnet.
            </p>
          </div>

          <div className="p-4 border-l-4 border-black bg-slate-50">
            <p className="font-semibold text-black mb-1">Organisera med favoriter</p>
            <p className="text-slate-600 text-sm">
              Markera dokument du ofta återkommer till som favoriter för snabb åtkomst från sidomenyn.
            </p>
          </div>

          <div className="p-4 border-l-4 border-black bg-slate-50">
            <p className="font-semibold text-black mb-1">Filtrera för precision</p>
            <p className="text-slate-600 text-sm">
              När du söker information från specifika avdelningar, använd källfiltret i chatten för bättre resultat.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          Behöver du mer hjälp? Kontakta IT-support eller använd AI-assistenten.
        </p>
      </footer>
    </div>
  )
}
