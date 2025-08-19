import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const results = {
      sightengine: { configured: false, status: 'Not configured' },
      local: { configured: true, status: 'Available' }
    }

    // Check Sightengine configuration
    if (process.env.SIGHTENGINE_API_KEY && process.env.SIGHTENGINE_API_USER) {
      try {
        // Test with a larger sample image (8x8 pixels) using direct upload
        const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+', 'base64')
        
        // Web FormData + Blob for multipart upload
        const form = new FormData()
        const blob = new Blob([testImageBuffer], { type: 'image/jpeg' })
        form.append('media', blob, 'test.jpg')
        form.append('models', 'genai')
        form.append('api_user', process.env.SIGHTENGINE_API_USER)
        form.append('api_secret', process.env.SIGHTENGINE_API_KEY)

        const testResponse = await fetch('https://api.sightengine.com/1.0/check.json', {
          method: 'POST',
          body: form
        })

        if (testResponse.ok) {
          results.sightengine = { configured: true, status: 'Working' }
        } else {
          const errorText = await testResponse.text()
          results.sightengine = { configured: true, status: `API Error: ${testResponse.status} - ${errorText}` }
        }
      } catch (error) {
        results.sightengine = { configured: true, status: 'Connection failed' }
      }
    } else if (process.env.SIGHTENGINE_API_KEY || process.env.SIGHTENGINE_API_USER) {
      results.sightengine = { configured: false, status: 'Missing API key or user' }
    }

    return NextResponse.json({
      success: true,
      services: results,
      summary: {
        totalServices: 2,
        configuredServices: Object.values(results).filter(r => r.configured).length,
        workingServices: Object.values(results).filter(r => r.status === 'Working' || r.status === 'Available').length
      }
    })
  } catch (error) {
    console.error('AI detection test error:', error)
    return NextResponse.json(
      { error: 'Failed to test AI detection services' },
      { status: 500 }
    )
  }
} 