import { NextRequest, NextResponse } from 'next/server'
import { 
  BlobServiceClient, 
  StorageSharedKeyCredential, 
  generateBlobSASQueryParameters, 
  BlobSASPermissions, 
  SASProtocol 
} from '@azure/storage-blob'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filename = decodeURIComponent(searchParams.get('filename') || '')
    
    if (!filename) {
      return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
    }

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY
    const containerName = process.env.AZURE_STORAGE_CONTAINER

    if (!accountName || !accountKey || !containerName) {
      return NextResponse.json({ 
        error: 'Azure storage environment variables not set' 
      }, { status: 500 })
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
    const expiresOn = new Date(new Date().valueOf() + 5 * 60 * 1000) // 5 minutes from now

    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName: filename,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(),
      expiresOn,
      protocol: SASProtocol.Https,
    }, sharedKeyCredential).toString()

    const url = `https://${accountName}.blob.core.windows.net/${containerName}/${filename}?${sasToken}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error('❌ Error generating SAS URL:', error)
    return NextResponse.json({ 
      error: 'Failed to generate SAS URL' 
    }, { status: 500 })
  }
} 