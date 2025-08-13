import Mistral from '@mistralai/mistralai'

const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

export default mistralClient
