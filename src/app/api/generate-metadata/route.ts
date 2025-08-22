import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateMetadataEndpoint } from '../../../endpoints/generateMetadata'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const json = await request.json()

  const req: any = {
    body: json,
    payload,
    get: (header: string) => request.headers.get(header),
  }

  const res = {
    status: (statusCode: number) => ({
      json: (data: any) => NextResponse.json(data, { status: statusCode }),
    }),
    json: (data: any) => NextResponse.json(data),
  }

  try {
    const result = await generateMetadataEndpoint.handler(req, res as any)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
