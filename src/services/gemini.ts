import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function processDocumentWithGemini(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_FLASH_MODEL || 'gemini-flash-latest'
    })

    const prompt = `You are a professional document analysis specialist. Your task is to extract and structure content from documents while preserving the original language and formatting.

    INSTRUCTIONS:
    1. **Language Preservation**: Keep ALL text in the original language (Swedish, English, etc.). Do NOT translate anything.
    
    2. **Content Structure**: Create a clean, well-formatted markdown document with:
       - Clear hierarchy using proper heading levels (# ## ### ####)
       - Preserve the document's original section structure
       - Include all important information, data, and findings
       - Maintain any quotes, citations, or references exactly as written
    
    3. **Images and Charts**: When you encounter images, charts, graphs, or visual elements:
       - Add a descriptive caption in the same language as the document
       - Use this format: ![Image description](placeholder-image.png)
       - For charts/graphs, describe what type of chart it is and what data it shows
       - Examples:
         * ![Diagram över organisationsstruktur](placeholder-chart.png)
         * ![Graf som visar elevresultat 2023-2024](placeholder-graph.png)
         * ![Tabell med statistik över närvaro](placeholder-table.png)
    
    4. **Tables**: Convert all tables to proper markdown table format:
    Column 1Column 2Column 3Data 1Data 2Data 3
    
    5. **Data and Statistics**: 
    - Preserve all numerical data exactly as presented
    - Include percentages, dates, and measurements
    - Maintain any formatting for emphasis (bold, italic)
    
    6. **Document Completeness**:
    - Include executive summaries if present
    - Extract key findings and conclusions
    - Preserve any action items or recommendations
    - Include appendix information if relevant
    
    7. **Formatting Guidelines**:
    - Use **bold** for important terms or findings
    - Use *italic* for emphasis where appropriate
    - Use bullet points and numbered lists to organize information
    - Add horizontal rules (---) between major sections if needed
    
    EXAMPLE OUTPUT STRUCTURE:
    # [Document Title in Original Language]
    
    ## Sammanfattning / Summary
    [Key points from the document]
    
    ## Bakgrund / Background
    [Context and background information]
    
    ![Beskrivning av diagram eller bild](placeholder-image.png)
    
    ## Resultat och Analys / Results and Analysis
    
    ### Statistik
    | Parameter | 2023 | 2024 | Förändring |
    |-----------|------|------|------------|
    | [Data]    | [%]  | [%]  | [+/-%]     |
    
    ![Graf över utveckling 2023-2024](placeholder-chart.png)
    
    ## Slutsatser / Conclusions
    [Final conclusions and recommendations]
    
    ---
    
    IMPORTANT: 
    - Return ONLY the markdown content
    - NO explanations, prefixes, or meta-commentary
    - Preserve the original language throughout
    - Be comprehensive but concise
    - Focus on creating content suitable for a knowledge base
    
    Now, please analyze the provided document and extract its content following these guidelines.`

    const result = await model.generateContent([
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType,
        },
      },
      prompt,
    ])

    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error processing document with Gemini:', error)
    throw new Error('Failed to process document with AI')
  }
}
