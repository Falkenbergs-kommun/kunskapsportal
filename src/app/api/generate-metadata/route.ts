import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateMetadataEndpoint } from '../../../endpoints/generateMetadata'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const json = await request.json()

    // Authenticate the user making the request
    const { user } = await payload.auth({ headers: request.headers })

    // Create request object for the endpoint
    const req: any = {
      body: json,
      payload,
      user,
      get: (header: string) => request.headers.get(header),
    }

    // Call the endpoint handler
    const result = await generateMetadataEndpoint.handler(req)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    console.error('[Metadata API] Error:', message)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
