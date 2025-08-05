import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required." },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured." },
        { status: 500 }
      )
    }

    // Handle different image URL types
    let imageData = imageUrl
    
    if (imageUrl.startsWith('blob:')) {
      // For blob URLs, we need to handle this differently since we can't fetch blob URLs server-side
      // We'll return an error suggesting to use a different approach
      return NextResponse.json(
        { error: "Blob URLs cannot be processed server-side. Please convert to base64 on the client side." },
        { status: 400 }
      )
    } else if (imageUrl.startsWith('data:')) {
      // Already a data URL, use as is
      imageData = imageUrl
    } else if (imageUrl.startsWith('http')) {
      // External URL, try to fetch and convert
      try {
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const contentType = response.headers.get('content-type') || 'image/jpeg'
        imageData = `data:${contentType};base64,${base64}`
      } catch (error) {
        console.error('Error fetching external image:', error)
        return NextResponse.json(
          { error: "Failed to fetch external image." },
          { status: 500 }
        )
      }
    } else {
      // Assume it's already base64
      imageData = imageUrl
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                                 text: `Analyze this image and provide a professional description. Focus on:
- Visual composition and layout
- Colors, lighting, and technical aspects
- Business or industrial context if applicable
- Professional presentation elements

Provide your response in this exact JSON format (no additional text):
{
  "title": "Professional Image Title",
  "description": "A detailed description of the image focusing on visual elements and professional context.",
  "tags": ["professional", "business", "visual", "composition", "technical"]
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API')
    }

    const content = data.choices[0].message.content
    
    // Try to parse JSON from the response
    let parsedContent
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      // Fallback: create a basic response
      parsedContent = {
        title: 'Image Analysis',
        description: 'AI-generated description of the image.',
        tags: ['image', 'analysis', 'professional']
      }
    }

    return NextResponse.json({
      success: true,
      title: parsedContent.title || 'Untitled Image',
      description: parsedContent.description || 'No description available.',
      tags: Array.isArray(parsedContent.tags) ? parsedContent.tags : ['image', 'analysis']
    })

  } catch (error: any) {
    console.error('Error in OpenAI image analysis:', error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
} 