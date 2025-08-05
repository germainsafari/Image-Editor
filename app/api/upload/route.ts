import { NextRequest, NextResponse } from 'next/server'
import { BlobServiceClient } from '@azure/storage-blob'

export async function POST(req: NextRequest) {
  try {
    console.log('📤 Upload request received')
    
    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file || typeof file === 'string') {
      console.error('❌ No file uploaded or invalid file type')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    console.log('📁 File received:', file.name, file.size, file.type)

    // Read file as Buffer (Node.js only)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('📊 File converted to buffer, size:', buffer.length)

    // Get Azure configuration
    const account = process.env.AZURE_STORAGE_ACCOUNT_NAME
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY
    const container = process.env.AZURE_STORAGE_CONTAINER
    const sas = process.env.AZURE_STORAGE_SAS_TOKEN
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING

    let blobServiceClient: BlobServiceClient

    if (sas && account && container) {
      console.log('🔐 Using SAS token for Azure connection')
      blobServiceClient = new BlobServiceClient(
        `https://${account}.blob.core.windows.net?${sas}`
      )
    } else if (connectionString && container) {
      console.log('🔗 Using connection string for Azure connection')
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    } else if (account && accountKey && container) {
      console.log('🔑 Using account key for Azure connection')
      const connStr = `DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
      blobServiceClient = BlobServiceClient.fromConnectionString(connStr)
    } else {
      console.error('❌ No Azure configuration available')
      return NextResponse.json({ 
        error: 'Azure Storage not configured. Please check environment variables.' 
      }, { status: 500 })
    }

    const containerClient = blobServiceClient.getContainerClient(container as string)
    
    // Generate unique filename to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const uniqueFilename = `images/${timestamp}-${file.name}`
    
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFilename)
    
    console.log('📤 Uploading to Azure:', uniqueFilename)
    
    // Use uploadData method (more reliable than upload)
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type || 'image/jpeg'
      }
    })

    const url = blockBlobClient.url
    console.log('✅ File uploaded successfully:', url)
    
    return NextResponse.json({ 
      url,
      filename: uniqueFilename,
      size: buffer.length,
      type: file.type
    })
    
  } catch (err) {
    console.error('❌ Azure upload error:', err)
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: (err as any).message 
    }, { status: 500 })
  }
} 