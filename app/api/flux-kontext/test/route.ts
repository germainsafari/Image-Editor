import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FLUX_KONTEXT_API_KEY || "cac4ce77-177f-4d9c-adb1-3ddcbc2fb6a4"

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key not configured',
          message: 'Please add FLUX_KONTEXT_API_KEY to your .env.local file'
        },
        { status: 500 }
      )
    }

    console.log('Testing BFL.ai Flux Kontext Pro API connection...')
    console.log('API Key present:', !!apiKey)
    console.log('API Key length:', apiKey.length)

    // Test the BFL.ai API connection
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-key': apiKey
    }

    // Try a simple test request to BFL.ai API
    const testResponse = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt: "test",
        input_image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
        output_format: "jpeg",
        safety_tolerance: 2,
        prompt_upsampling: false,
        num_images: 1
      })
    })

    return NextResponse.json({
      status: 'BFL.ai Flux Kontext Pro API configuration test',
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey.length,
      testResponseStatus: testResponse.status,
      testResponseOk: testResponse.ok,
      message: testResponse.ok 
        ? 'BFL.ai API connection successful' 
        : 'BFL.ai API connection failed - check your API key and endpoint'
    })

  } catch (error) {
    console.error('BFL.ai API test error:', error)
    return NextResponse.json(
      { 
        error: 'BFL.ai API test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 