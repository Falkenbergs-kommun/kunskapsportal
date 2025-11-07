import type { Endpoint, PayloadRequest } from 'payload'
import { Department } from '../payload-types'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Schema, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// 1. UPDATED: The new schema for Gemini's structured output
const metadataSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description:
        'En kort, koncis och informativ titel för dokumentet på svenska. Titeln ska korrekt spegla dokumentets huvudsakliga innehåll.',
    },
    summary: {
      type: SchemaType.STRING,
      description:
        'En sammanfattning av dokumentets syfte och viktigaste punkter på 2-4 meningar. Skriven på svenska.',
    },
    slug: {
      type: SchemaType.STRING,
      description:
        'En unik, URL-vänlig "slug" baserad på titeln. Använd små bokstäver, bindestreck istället för mellanslag och ta bort specialtecken.',
    },
    documentType: {
      type: SchemaType.STRING,
      description:
        "Klassificera dokumentet enligt en av de fastställda typerna: 'policy', 'guideline', 'instruction', 'routine', 'plan', 'protocol', 'report', 'decision', 'agreement', 'template', 'faq'",
    },
    department: {
      type: SchemaType.STRING,
      description:
        'Ange ID för det verksamhetsområde som är mest relevant för dokumentet. Välj från den angivna listan.',
    },
    targetAudience: {
      type: SchemaType.ARRAY,
      description:
        "Identifiera målgrupp(er). Välj från: 'citizens', 'staff', 'officials', 'businesses', 'municipalities'.",
      items: { type: SchemaType.STRING },
    },
    securityLevel: {
      type: SchemaType.STRING,
      description:
        "Bestäm säkerhetsnivån. Välj från: 'public', 'internal', 'confidential', 'restricted'.",
    },
    legalBasis: {
      type: SchemaType.ARRAY,
      description:
        'Om tillämpligt, identifiera den rättsliga grunden. Ange lag/förordning, kapitel/paragraf och en URL.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          law: { type: SchemaType.STRING },
          chapter: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING },
        },
      },
    },
    gdprRelevant: {
      type: SchemaType.BOOLEAN,
      description: 'Ange true om dokumentet innehåller personuppgifter, annars false.',
    },
    accessibilityCompliant: {
      type: SchemaType.BOOLEAN,
      description: 'Ange true om dokumentet bedöms vara WCAG 2.1 AA-kompatibelt, annars false.',
    },
    version: {
      type: SchemaType.STRING,
      description: 'Identifiera eller föreslå ett versionsnummer, t.ex. "1.0" eller "2.2".',
    },
    effectiveDate: {
      type: SchemaType.STRING,
      description:
        'Identifiera datum för fastställelse. Ange som YYYY-MM-DD. Om det inte finns, ange dagens datum.',
    },
    reviewInterval: {
      type: SchemaType.STRING,
      description:
        "Bestäm revideringsintervall. Välj från: 'as_needed', 'annual', 'biannual', 'triannual', 'five_years'.",
    },
    appliesTo: {
      type: SchemaType.STRING,
      description:
        'Beskriv vilka verksamheter, nämnder eller avdelningar dokumentet gäller för. Exempel: "Verksamheter som utför SoL, LSS, HSL".',
    },
    author: {
      type: SchemaType.STRING,
      description: 'Identifiera författarens namn. Om okänt, ange "Okänd".',
    },
    authorEmail: {
      type: SchemaType.STRING,
      description: 'Identifiera författarens e-post. Om okänt, lämna tom.',
    },
    reviewer: {
      type: SchemaType.STRING,
      description:
        'Identifiera revideringsansvarig (person eller avdelning). Om okänt, ange "Okänd".',
    },
    approver: {
      type: SchemaType.STRING,
      description: 'Identifiera beslutsfattare/godkännare. Om okänt, ange "Okänd".',
    },
    keywords: {
      type: SchemaType.ARRAY,
      description: 'En lista med 5-10 relevanta svenska nyckelord som underlättar sökning.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          keyword: { type: SchemaType.STRING },
        },
      },
    },
    language: {
      type: SchemaType.STRING,
      description: "Bestäm dokumentets språk. Välj från: 'sv', 'en', 'sv-lattlast'.",
    },
  },
  required: [
    'title',
    'summary',
    'slug',
    'documentType',
    'department',
    'securityLevel',
    'gdprRelevant',
    'accessibilityCompliant',
    'version',
    'effectiveDate',
    'appliesTo',
    'language',
  ],
}

export const generateMetadataEndpoint: Endpoint = {
  path: '/generate-metadata',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const body = req.body as any
      const id = body?.id

      if (!id) {
        return Response.json({ message: 'Article ID is required' }, { status: 400 })
      }

      const payload = req.payload
      // Fetch with draft: true to get draft content
      const article = await payload.findByID({ 
        collection: 'articles', 
        id, 
        draft: true,
        depth: 1 // Need depth to populate richText fields
      })

      if (!article) {
        return Response.json({ message: 'Article not found' }, { status: 404 })
      }

      if (!article.content) {
        return Response.json({ message: 'Article must have content to generate metadata.' }, { status: 400 })
      }

      // Fetch all departments to provide as context to the AI
      const departments = await payload.find({
        collection: 'departments',
        limit: 100, // Assuming there are not more than 100 departments
      })
      const departmentList = departments.docs
        .map((dep: Department) => `- ${dep.name} (ID: ${dep.id})`)
        .join('\n')

      // Content is now stored as plain markdown
      const markdown = typeof article.content === 'string' ? article.content : ''

      console.log('Extracted content for analysis:', markdown.substring(0, 1000)) // Show first 1000 chars in logs
      console.log(`Total content length: ${markdown.length} characters`)

      // Ensure we have meaningful content
      if (!markdown || markdown.trim().length < 10) {
        return Response.json({
          message: 'Article content is too short. Please ensure the article has meaningful content.'
        }, { status: 400 })
      }

      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_FLASH_MODEL || 'gemini-flash-latest',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: metadataSchema,
        },
      })

      const prompt = `
        Analysera följande kommunala dokument från Falkenbergs kommun. Agera som en erfaren och noggrann kommunal arkivarie och registrator. Ditt uppdrag är att extrahera, härleda och skapa strukturerad metadata på svenska för **ALLA** fält i det specificerade JSON-schemat. Varje fält måste fyllas i korrekt.

        **Dokumentinnehåll:**
        ---
        ${markdown}
        ---

        **Tillgängliga verksamhetsområden (Departments):**
        ---
        ${departmentList}
        ---

        **Instruktioner för varje fält:**
        1.  **title:** Skapa en ny, tydlig och beskrivande titel.
        2.  **summary:** Skriv en koncis sammanfattning (2-4 meningar) som förklarar syfte och huvudinnehåll.
        3.  **slug:** Skapa en URL-vänlig slug från titeln.
        4.  **documentType:** Välj den mest passande dokumenttypen från listan: 'policy', 'guideline', 'instruction', 'routine', 'plan', 'protocol', 'report', 'decision', 'agreement', 'template', 'faq'.
        5.  **department:** Välj det mest relevanta verksamhetsområdet från listan ovan och ange dess ID.
        6.  **targetAudience:** Identifiera alla relevanta målgrupper från listan: 'citizens', 'staff', 'officials', 'businesses', 'municipalities'.
        7.  **securityLevel:** Välj den mest lämpliga säkerhetsnivån från listan: 'public', 'internal', 'confidential', 'restricted'.
        8.  **legalBasis:** Om lagrum nämns, extrahera dem. Annars, lämna som en tom array [].
        9.  **gdprRelevant:** Analysera om texten hanterar personuppgifter. Svara true eller false.
        10. **accessibilityCompliant:** Gör en bedömning baserat på textens struktur. Svara true eller false.
        11. **version:** Hitta eller föreslå ett versionsnummer (t.ex. "1.0").
        12. **effectiveDate:** Hitta datum för fastställelse (YYYY-MM-DD). Om inget finns, använd dagens datum: ${new Date().toISOString().split('T')[0]}.
        13. **reviewInterval:** Välj det mest logiska revideringsintervallet från listan i schemat.
        14. **appliesTo:** Beskriv vilka dokumentet gäller för.
        15. **author:** Identifiera författare. Om okänt, ange "Okänd".
        16. **authorEmail:** Identifiera författarens e-post. Om okänt, lämna fältet tomt.
        17. **reviewer:** Identifiera revideringsansvarig. Om okänt, ange "Okänd".
        18. **approver:** Identifiera beslutsfattare. Om okänt, ange "Okänd".
        19. **keywords:** Extrahera 5-10 relevanta svenska sökord.
        20. **language:** Välj det primära språket från listan i schemat.

        Svara **endast** med ett JSON-objekt som följer det specificerade schemat och fyll i **ALLA** obligatoriska fält.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const generatedMetadata = JSON.parse(response.text())

      console.log('Generated metadata for article', id, ':', generatedMetadata)

      let slug = generatedMetadata.slug
      let isUnique = false
      let counter = 1

      while (!isUnique) {
        const existingArticle = await payload.find({
          collection: 'articles',
          where: {
            slug: {
              equals: slug,
            },
            id: {
              not_equals: id,
            },
          },
        })

        if (existingArticle.docs.length === 0) {
          isUnique = true
        } else {
          slug = `${generatedMetadata.slug}-${counter}`
          counter++
        }
      }

      // Validate the department from Gemini (can be ID or name)
      const departmentIdentifier = generatedMetadata.department
      const validDepartment = departments.docs.find(
        (dep: Department) =>
          dep.id === departmentIdentifier ||
          dep.id === parseInt(String(departmentIdentifier), 10) || // Also check parsed int
          (dep.name &&
            typeof departmentIdentifier === 'string' &&
            dep.name.toLowerCase() === departmentIdentifier.toLowerCase()),
      )

      const updateData: any = {
        ...generatedMetadata,
        slug,
      }

      if (validDepartment) {
        updateData.department = validDepartment.id // Ensure we use the correct ID from the found department
      } else {
        console.warn(
          `Gemini returned an invalid department identifier: '${departmentIdentifier}'. Skipping department update.`,
        )
        delete updateData.department // Remove invalid department
      }

      const updatedArticle = await payload.update({
        collection: 'articles',
        id,
        data: updateData,
      })

      return Response.json({ success: true, article: updatedArticle })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      console.error('Error generating metadata:', error)
      return Response.json({ success: false, message }, { status: 500 })
    }
  },
}
