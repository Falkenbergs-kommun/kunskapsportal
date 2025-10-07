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
  MousePointer,
  ChevronRight,
  Lightbulb,
  Users,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Välkommen till Kunskapsportalen
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Din kompletta guide till kommunens dokumenthanteringssystem. Här hittar du all information 
          om hur du effektivt navigerar, söker och använder portalens funktioner.
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-8 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Snabbstart
          </CardTitle>
          <CardDescription>De viktigaste funktionerna för att komma igång</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Snabbsök</p>
              <p className="text-sm text-slate-600">Tryck <Badge variant="outline" className="ml-1">⌘K</Badge> för att söka</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">AI-assistent</p>
              <p className="text-sm text-slate-600">Tryck <Badge variant="outline" className="ml-1">⌘J</Badge> för chatt</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Star className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Favoriter</p>
              <p className="text-sm text-slate-600">Klicka på stjärnan för att spara</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Features */}
      <div className="space-y-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">Huvudfunktioner</h2>

        {/* Search & Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Sök & Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Snabbsök (Command Palette)</h4>
              <p className="text-sm text-slate-600 mb-3">
                Det snabbaste sättet att hitta dokument och navigera i portalen. Tryck <Badge variant="outline">⌘K</Badge> eller <Badge variant="outline">Ctrl+K</Badge> var som helst för att öppna sökfältet.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Realtidssökning:</strong> Resultat visas direkt medan du skriver</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Smart matchning:</strong> Söker i titel, innehåll och sammanfattning</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Navigeringsgenvägar:</strong> Hoppa direkt till Admin eller Hem</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Avdelningsinfo:</strong> Se vilket område dokumentet tillhör</span>
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Avdelningsnavigering</h4>
              <p className="text-sm text-slate-600 mb-3">
                Använd sidomenyn till vänster för att bläddra genom kommunens olika avdelningar och enheter.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Hierarkisk struktur:</strong> Upp till 3 nivåer djup</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Expanderbara sektioner:</strong> Klicka för att visa underavdelningar</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Avdelningssidor:</strong> Översikt över alla dokument per avdelning</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI-assistent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm mb-1">Tips!</p>
                  <p className="text-sm text-slate-600">
                    AI-assistenten har tillgång till hela kunskapsdatabasen och kan hjälpa dig hitta rätt information snabbt.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Grundläggande användning</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Öppna chatten:</strong> Klicka på chattikonen eller tryck <Badge variant="outline">⌘J</Badge></span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Ställ frågor:</strong> Skriv din fråga på svenska eller engelska</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Få länkar:</strong> AI:n ger direktlänkar till relevanta dokument</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span><strong>Konversationshistorik:</strong> Chatten sparas mellan sessioner</span>
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Avdelningsfiltrering</h4>
              <p className="text-sm text-slate-600 mb-3">
                Begränsa AI-assistentens sökområde till specifika avdelningar för mer relevanta svar.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Filter className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span>Klicka på <strong>&ldquo;Filtrera avdelningar&rdquo;</strong> i chattfönstret</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span>Välj en eller flera avdelningar att söka inom</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span>Underavdelningar inkluderas automatiskt</span>
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Chatta om specifik artikel</h4>
              <p className="text-sm text-slate-600 mb-3">
                När du läser ett dokument kan du ställa frågor specifikt om dess innehåll.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <MousePointer className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span>Klicka på <strong>&ldquo;Chatta om artikel&rdquo;</strong> knappen i artikelvyn</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span>AI:n fokuserar på det aktuella dokumentets innehåll</span>
                </li>
                <li className="flex items-start gap-2">
                  <Search className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span>Kan fortfarande söka efter relaterade dokument vid behov</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Favoriter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Spara viktiga dokument och sidor för snabb åtkomst. Favoriterna visas i sidomenyn för enkel navigation.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">Lägg till favorit</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 mt-0.5 text-yellow-400 fill-yellow-400" />
                    <span>Klicka på stjärnikonen på valfri sida</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-slate-400" />
                    <span>Fungerar för artiklar och avdelningssidor</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Hantera favoriter</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5 text-slate-400" />
                    <span>Visa alla i sidomenyn under &ldquo;Favoriter&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-slate-400" />
                    <span>Sparas automatiskt mellan sessioner</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Tangentbordsgenvägar
          </CardTitle>
          <CardDescription>Arbeta snabbare med dessa genvägar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-sm">Navigation</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Snabbsök</span>
                  <div className="flex gap-1">
                    <Badge variant="outline">⌘</Badge>
                    <Badge variant="outline">K</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Växla vänster meny</span>
                  <div className="flex gap-1">
                    <Badge variant="outline">⌘</Badge>
                    <Badge variant="outline">B</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Växla AI-chatt</span>
                  <div className="flex gap-1">
                    <Badge variant="outline">⌘</Badge>
                    <Badge variant="outline">J</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">I chatten</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Skicka meddelande</span>
                  <Badge variant="outline">Enter</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ny rad</span>
                  <div className="flex gap-1">
                    <Badge variant="outline">Shift</Badge>
                    <Badge variant="outline">Enter</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rensa konversation</span>
                  <span className="text-sm text-slate-500">Klicka på ikonen</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Om dokumenten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-sm">Dokumenttyper</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Policy - Övergripande riktlinjer</li>
                <li>• Riktlinje - Detaljerade instruktioner</li>
                <li>• Anvisning - Praktisk vägledning</li>
                <li>• Plan - Strategiska dokument</li>
                <li>• Protokoll - Mötesanteckningar</li>
                <li>• Rapport - Analyser och utredningar</li>
                <li>• Beslut - Formella beslut</li>
                <li>• Avtal - Juridiska överenskommelser</li>
                <li>• Mall - Återanvändbara dokument</li>
                <li>• FAQ - Vanliga frågor</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm">Säkerhetsnivåer</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Globe className="h-4 w-4 mt-0.5 text-green-600" />
                  <span><strong>Offentlig:</strong> Tillgänglig för alla</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-blue-600" />
                  <span><strong>Intern:</strong> Endast för anställda</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 text-orange-600" />
                  <span><strong>Konfidentiell:</strong> Begränsad åtkomst</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 text-red-600" />
                  <span><strong>Begränsad:</strong> Strikt kontrollerad</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips & Tricks */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            Tips & tricks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 rounded">
                <ArrowRight className="h-3 w-3 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Använd snabbsök för allt</p>
                <p className="text-sm text-slate-600">
                  CMD+K är det snabbaste sättet att navigera. Du kan söka dokument, hoppa till sidor och mycket mer.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 rounded">
                <ArrowRight className="h-3 w-3 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Ställ följdfrågor till AI:n</p>
                <p className="text-sm text-slate-600">
                  AI-assistenten minns konversationen. Ställ följdfrågor för att fördjupa dig i ämnet.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 rounded">
                <ArrowRight className="h-3 w-3 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Organisera med favoriter</p>
                <p className="text-sm text-slate-600">
                  Markera dokument du ofta återkommer till som favoriter för snabb åtkomst från sidomenyn.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 rounded">
                <ArrowRight className="h-3 w-3 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Filtrera för precision</p>
                <p className="text-sm text-slate-600">
                  När du söker information från specifika avdelningar, använd avdelningsfiltret i chatten för bättre resultat.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 rounded">
                <ArrowRight className="h-3 w-3 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Läs sammanfattningar först</p>
                <p className="text-sm text-slate-600">
                  Många dokument har TLDR-sammanfattningar. Kolla dessa först för en snabb överblick.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Behöver du mer hjälp? Kontakta IT-support eller använd AI-assistenten.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Version 1.0</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}