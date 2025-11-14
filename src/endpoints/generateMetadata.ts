import type { Endpoint, PayloadRequest } from 'payload'
import { Department } from '../payload-types'
import { getGeminiClient } from '@/services/geminiClient'

// Schema for Gemini's structured output (JSON Schema format)
const metadataSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description:
        'En kort, koncis och informativ titel för dokumentet på svenska. Titeln ska korrekt spegla dokumentets huvudsakliga innehåll.',
    },
    summary: {
      type: 'string',
      description:
        'En sammanfattning av dokumentets syfte och viktigaste punkter på 2-4 meningar. Skriven på svenska.',
    },
    slug: {
      type: 'string',
      description:
        'En unik, URL-vänlig "slug" baserad på titeln. Använd små bokstäver, bindestreck istället för mellanslag och ta bort specialtecken.',
    },
    documentType: {
      type: 'string',
      description:
        "Klassificera dokumentet enligt en av de fastställda typerna: 'policy', 'guideline', 'instruction', 'routine', 'plan', 'protocol', 'report', 'decision', 'agreement', 'template', 'faq'",
    },
    department: {
      type: 'string',
      description:
        'Ange ID för det verksamhetsområde som är mest relevant för dokumentet. Välj från den angivna listan.',
    },
    targetAudience: {
      type: 'array',
      description:
        "Identifiera målgrupp(er). Välj från: 'citizens', 'staff', 'officials', 'businesses', 'municipalities'.",
      items: { type: 'string' },
    },
    securityLevel: {
      type: 'string',
      description:
        "Bestäm säkerhetsnivån. Välj från: 'public', 'internal', 'confidential', 'restricted'.",
    },
    legalBasis: {
      type: 'array',
      description:
        'Om tillämpligt, identifiera den rättsliga grunden. Ange lag/förordning, kapitel/paragraf och en URL.',
      items: {
        type: 'object',
        properties: {
          law: { type: 'string' },
          chapter: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    gdprRelevant: {
      type: 'boolean',
      description: 'Ange true om dokumentet innehåller personuppgifter, annars false.',
    },
    accessibilityCompliant: {
      type: 'boolean',
      description: 'Ange true om dokumentet bedöms vara WCAG 2.1 AA-kompatibelt, annars false.',
    },
    version: {
      type: 'string',
      description: 'Identifiera eller föreslå ett versionsnummer, t.ex. "1.0" eller "2.2".',
    },
    effectiveDate: {
      type: 'string',
      description:
        'Identifiera datum för fastställelse. Ange som YYYY-MM-DD. Om det inte finns, ange dagens datum.',
    },
    reviewInterval: {
      type: 'string',
      description:
        "Bestäm revideringsintervall. Välj från: 'as_needed', 'annual', 'biannual', 'triannual', 'five_years'.",
    },
    appliesTo: {
      type: 'string',
      description:
        'Beskriv vilka verksamheter, nämnder eller avdelningar dokumentet gäller för. Exempel: "Verksamheter som utför SoL, LSS, HSL".',
    },
    author: {
      type: 'string',
      description: 'Identifiera författarens namn. Om okänt, ange "Okänd".',
    },
    authorEmail: {
      type: 'string',
      description: 'Identifiera författarens e-post. Om okänt, lämna tom.',
    },
    reviewer: {
      type: 'string',
      description:
        'Identifiera revideringsansvarig (person eller avdelning). Om okänt, ange "Okänd".',
    },
    approver: {
      type: 'string',
      description: 'Identifiera beslutsfattare/godkännare. Om okänt, ange "Okänd".',
    },
    keywords: {
      type: 'array',
      description: 'En lista med 5-10 relevanta svenska nyckelord som underlättar sökning.',
      items: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
        },
      },
    },
    language: {
      type: 'string',
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

      // Fetch all departments - we'll validate access when updating
      // Note: The department field has filterOptions that will enforce access control during update
      const departments = await payload.find({
        collection: 'departments',
        limit: 100,
        depth: 0,
      })

      const departmentList = departments.docs
        .map((dep: Department) => {
          // Use fullPath if available, otherwise use name
          const displayName = dep.fullPath || dep.name
          return `- ${displayName} (ID: ${dep.id})`
        })
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

      const ai = getGeminiClient()
      const modelName = process.env.GEMINI_FLASH_MODEL || 'gemini-flash-latest'

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

      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: metadataSchema,
        },
      })

      if (!result.text) {
        throw new Error('No response text from AI model')
      }

      const generatedMetadata = JSON.parse(result.text)

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
        delete updateData.department // Remove invalid department - let Payload validation handle if it's required
      }

      const updatedArticle = await payload.update({
        collection: 'articles',
        id,
        data: updateData,
        req, // Pass the authenticated request so Payload enforces access control
      })

      return Response.json({ success: true, article: updatedArticle })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      console.error('Error generating metadata:', error)
      return Response.json({ success: false, message }, { status: 500 })
    }
  },
}
