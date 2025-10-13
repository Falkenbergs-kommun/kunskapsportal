'use client'

import { User } from '@/payload-types'
import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import {
  Bars3Icon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const navigation = [
  { name: 'Funktioner', href: '#features' },
  { name: 'Hur det fungerar', href: '#how-it-works' },
  { name: 'Vanliga frågor', href: '#faq' },
]

const features = [
  {
    name: 'AI-drivet innehållsskapande',
    description:
      'Omvandla automatiskt statiska dokument (PDF, Word) till strukturerade, redigerbara artiklar. Vår AI extraherar text och bilder med bibehållen kontext.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Automatisk metadata & klassificering',
    description:
      'Glöm manuell taggning. Systemet analyserar innehåll för att generera titlar, sammanfattningar och nyckelord, vilket säkerställer enhetlighet och sökbarhet.',
    icon: SparklesIcon,
  },
  {
    name: 'Semantisk sök & chattbot',
    description:
      'Ställ frågor i naturligt språk och få svar från de mest relevanta dokumenten, även om du inte använder exakta nyckelord.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Strukturerad navigering',
    description:
      'Innehållet är organiserat i en tydlig hierarki av avdelningar, vilket gör det enkelt att bläddra och hitta information intuitivt.',
    icon: BookOpenIcon,
  },
]

const faqs = [
  {
    id: 1,
    question: 'Vad är denna plattform?',
    answer:
      'Detta är en AI-driven kunskapsbas utformad för att omvandla kommunens statiska dokument till en dynamisk, intelligent och lätt sökbar resurs.',
  },
  {
    id: 2,
    question: 'Vilka typer av dokument kan jag ladda upp?',
    answer:
      'Systemet stöder ett brett utbud av format, inklusive PDF, Microsoft Word (.docx) och PowerPoint (.pptx). Allt innehåll bearbetas för att extrahera text och bilder.',
  },
  {
    id: 3,
    question: 'Hur fungerar AI-chattboten?',
    answer:
      'Chattboten använder semantisk sök för att förstå dina frågor. Den hittar sedan den mest relevanta informationen från alla publicerade artiklar för att ge dig ett direkt svar.',
  },
  {
    id: 4,
    question: 'Vem är systemet till för?',
    answer:
      'Det är utformat för alla anställda inom kommunen för att enkelt komma åt och hantera intern kunskap, från policys och riktlinjer till rapporter och rutiner.',
  },
  {
    id: 5,
    question: 'Var laddar jag upp dokument?',
    answer:
      'För att ladda upp dokument behöver du vara innehållsadministratör för din avdelning eller enhet.',
  },
]

export default function WelcomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="w-full">
      <main>
        {/* Hero section */}
        <div>
          <div className="py-8 sm:py-12">
            <div className="mx-auto max-w-4xl px-4 lg:px-6">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
                  En smartare kunskapsbas för en modern kommun
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                  Från statiska dokument till dynamisk kunskap. Sök, fråga och hitta svar snabbare
                  än någonsin med hjälp av AI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div id="features" className="mx-auto mt-12 max-w-4xl px-4 sm:mt-16 lg:px-6">
          <div className="mx-auto max-w-4xl ">
            <h2 className="text-base font-semibold leading-7 text-gray-500">Allt du behöver</h2>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              En intelligent plattform för kunskapshantering
            </h3>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              Vår plattform är byggd för att göra kunskap tillgänglig och användbar, inte bara
              lagrad.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-4xl sm:mt-16 lg:mt-20">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 dark:bg-white">
                      <feature.icon
                        aria-hidden="true"
                        className="h-6 w-6 text-white dark:text-black"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* How it works section */}
        <div id="how-it-works" className="mx-auto my-20 max-w-4xl px-4 sm:my-24 lg:px-6">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-gray-500">Steg-för-steg</h2>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Från dokument till sökbar kunskap
            </h3>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              Processen är enkel och nästan helt automatiserad.
            </p>
          </div>
          <div className="relative mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white dark:bg-white dark:text-black">
                  1
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Ladda upp
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Börja med att ladda upp dina befintliga dokument i format som PDF, Word eller
                  PowerPoint.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white dark:bg-white dark:text-black">
                  2
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Generera med AI
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Med ett klick analyserar AI:n dokumenten, extraherar allt innehåll och skapar en
                  strukturerad artikel.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white dark:bg-white dark:text-black">
                  3
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Publicera & Sök
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Efter en snabb granskning publicerar du artikeln, som omedelbart blir sökbar för
                  alla användare.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div
          id="faq"
          className="mx-auto max-w-4xl divide-y divide-gray-900/10 px-4 pb-8 sm:pb-16 sm:pt-12 lg:px-6 lg:pb-20"
        >
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900 dark:text-white">
            Vanliga frågor
          </h2>
          <dl className="mt-10 space-y-8 divide-y divide-gray-900/10 dark:divide-white/10">
            {faqs.map((faq) => (
              <div key={faq.id} className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8">
                <dt className="text-base font-semibold leading-7 text-gray-900 lg:col-span-5 dark:text-white">
                  {faq.question}
                </dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base leading-7 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-16 max-w-4xl px-4 lg:px-6">
        <div className="border-t border-gray-900/10 py-16 dark:border-white/10">
          <p className="text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Kommunens Kunskapsbas. Alla rättigheter förbehållna.
          </p>
        </div>
      </footer>
    </div>
  )
}
