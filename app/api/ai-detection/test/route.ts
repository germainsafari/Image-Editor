import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const results = {
      hive: { configured: false, status: 'Not configured' },
      sightengine: { configured: false, status: 'Not configured' },
      local: { configured: true, status: 'Available' }
    }

    // Check Hive AI configuration
    if (process.env.HIVE_AI_API_KEY) {
      try {
        // Test with a small sample image
        const testResponse = await fetch('https://api.thehive.ai/api/v2/classify', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.HIVE_AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 pixel
            models: ['ai-generated-content']
          })
        })

        if (testResponse.ok) {
          results.hive = { configured: true, status: 'Working' }
        } else {
          results.hive = { configured: true, status: `API Error: ${testResponse.status}` }
        }
      } catch (error) {
        results.hive = { configured: true, status: 'Connection failed' }
      }
    }

    // Check Sightengine configuration
    if (process.env.SIGHTENGINE_API_KEY) {
      try {
        const [apiUser, apiSecret] = process.env.SIGHTENGINE_API_KEY.split(':')
        if (apiUser && apiSecret) {
          results.sightengine = { configured: true, status: 'Configured' }
        } else {
          results.sightengine = { configured: true, status: 'Invalid format (should be user:secret)' }
        }
      } catch (error) {
        results.sightengine = { configured: true, status: 'Configuration error' }
      }
    }

    return NextResponse.json({
      success: true,
      services: results,
      summary: {
        totalServices: 3,
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