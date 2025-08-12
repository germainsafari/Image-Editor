import { NextRequest, NextResponse } from 'next/server'
import { getAzureStorageService } from '@/lib/azure-storage'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, versionId, type, parent, prompt, metadata } = await request.json()

    // Validate required fields
    if (!imageUrl || !versionId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, versionId, type' },
        { status: 400 }
      )
    }

    const azureStorage = getAzureStorageService()
    
    if (!azureStorage.isAzureConfigured()) {
      return NextResponse.json(
        { error: 'Azure Storage is not configured' },
        { status: 500 }
      )
    }

    // Generate filename for Azure
    const filename = azureStorage.generateFilename(versionId, type)
    
    // Upload to Azure Blob Storage
    let azureUrl: string
    
    if (imageUrl.startsWith('blob:')) {
      // For blob URLs, we need to convert to base64 first
      // This should be done on the client side before calling this API
      throw new Error('Blob URLs cannot be processed server-side. Please convert to base64 on the client side.')
    } else if (imageUrl.startsWith('data:image')) {
      // Extract base64 data from data URL
      const base64Data = imageUrl.split(',')[1]
      azureUrl = await azureStorage.uploadImage(
        base64Data,
        filename,
        {
          versionId,
          type,
          parent: parent || '',
          prompt: prompt || '',
          timestamp: new Date().toISOString(),
          ...metadata
        }
      )
    } else {
      throw new Error('Invalid image format. Please provide a base64 data URL.')
    }

    return NextResponse.json({
      success: true,
      azureUrl,
      azureBlobPath: filename,
      message: 'Image uploaded to Azure successfully'
    })

  } catch (error: any) {
    console.error('Error uploading version to Azure:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image to Azure' },
      { status: 500 }
    )
  }
}
