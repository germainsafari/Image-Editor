import { NextRequest, NextResponse } from 'next/server'
import { getAzureStorageService } from '@/lib/azure-storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const prefix = searchParams.get('prefix')

    const azureStorage = getAzureStorageService()

    switch (action) {
      case 'list':
        const images = await azureStorage.listImages(prefix || undefined)
        return NextResponse.json({ images })
      
      case 'metadata':
        const filename = searchParams.get('filename')
        if (!filename) {
          return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
        }
        const metadata = await azureStorage.getMetadata(filename)
        return NextResponse.json({ metadata })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Azure Storage API error:', error)
    return NextResponse.json(
      { error: 'Failed to access Azure Storage' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const azureStorage = getAzureStorageService()
    await azureStorage.deleteImage(filename)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Azure Storage delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete from Azure Storage' },
      { status: 500 }
    )
  }
} 