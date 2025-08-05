import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob'

export interface AzureStorageConfig {
  account: string
  container: string
  accountKey: string
}

export class AzureStorageService {
  private blobServiceClient?: BlobServiceClient
  private containerClient?: ContainerClient
  private config: AzureStorageConfig
  private isConfigured: boolean = false

  constructor() {
    this.config = {
      account: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
      container: process.env.AZURE_STORAGE_CONTAINER || '',
      accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || ''
    }

    // Check if Azure Storage is configured
    if (!this.config.account || !this.config.container || !this.config.accountKey) {
      console.warn('Azure Storage configuration is incomplete. Images will be stored locally only.')
      this.isConfigured = false
      return
    }

    this.isConfigured = true
    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${this.config.account};AccountKey=${this.config.accountKey};EndpointSuffix=core.windows.net`
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    this.containerClient = this.blobServiceClient.getContainerClient(this.config.container)
  }

  /**
   * Upload an image to Azure Blob Storage
   */
  async uploadImage(imageData: string, filename: string, metadata?: Record<string, string>): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Azure Storage is not configured')
    }

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(imageData, 'base64')
      
      // Create blob client
      const blobClient = this.containerClient!.getBlockBlobClient(filename)
      
      // Upload with metadata
      await blobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'image/jpeg'
        },
        metadata
      })

      // Return the blob URL
      return blobClient.url
    } catch (error) {
      console.error('Error uploading to Azure Blob Storage:', error)
      throw new Error('Failed to upload image to Azure Blob Storage')
    }
  }

  /**
   * Upload a blob URL to Azure Blob Storage
   */
  async uploadBlobUrl(blobUrl: string, filename: string, metadata?: Record<string, string>): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Azure Storage is not configured')
    }

    try {
      // Fetch the blob data
      const response = await fetch(blobUrl)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Create blob client
      const blobClient = this.containerClient!.getBlockBlobClient(filename)
      
      // Upload with metadata
      await blobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: blob.type || 'image/jpeg'
        },
        metadata
      })

      // Return the blob URL
      return blobClient.url
    } catch (error) {
      console.error('Error uploading blob URL to Azure Blob Storage:', error)
      throw new Error('Failed to upload image to Azure Blob Storage')
    }
  }

  /**
   * Download an image from Azure Blob Storage
   */
  async downloadImage(filename: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Azure Storage is not configured')
    }

    try {
      const blobClient = this.containerClient!.getBlockBlobClient(filename)
      const downloadResponse = await blobClient.download()
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No readable stream from blob')
      }

      const chunks: Uint8Array[] = []
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk)
      }

      const buffer = Buffer.concat(chunks)
      return `data:image/jpeg;base64,${buffer.toString('base64')}`
    } catch (error) {
      console.error('Error downloading from Azure Blob Storage:', error)
      throw new Error('Failed to download image from Azure Blob Storage')
    }
  }

  /**
   * Delete an image from Azure Blob Storage
   */
  async deleteImage(filename: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Azure Storage is not configured')
    }

    try {
      const blobClient = this.containerClient!.getBlockBlobClient(filename)
      await blobClient.delete()
    } catch (error) {
      console.error('Error deleting from Azure Blob Storage:', error)
      throw new Error('Failed to delete image from Azure Blob Storage')
    }
  }

  /**
   * List all images in the container
   */
  async listImages(prefix?: string): Promise<string[]> {
    if (!this.isConfigured) {
      throw new Error('Azure Storage is not configured')
    }

    try {
      const blobs: string[] = []
      const listOptions = prefix ? { prefix } : {}
      
      for await (const blob of this.containerClient!.listBlobsFlat(listOptions)) {
        blobs.push(blob.name)
      }
      
      return blobs
    } catch (error) {
      console.error('Error listing blobs from Azure Blob Storage:', error)
      throw new Error('Failed to list images from Azure Blob Storage')
    }
  }

  /**
   * Generate a unique filename for versioning
   */
  generateFilename(versionId: string, type: string, extension: string = 'jpg'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `images/${versionId}/${type}-${timestamp}.${extension}`
  }

  /**
   * Get blob metadata
   */
  async getMetadata(filename: string): Promise<Record<string, string> | null> {
    if (!this.isConfigured) {
      return null
    }

    try {
      const blobClient = this.containerClient!.getBlockBlobClient(filename)
      const properties = await blobClient.getProperties()
      return properties.metadata || null
    } catch (error) {
      console.error('Error getting blob metadata:', error)
      return null
    }
  }

  /**
   * Check if Azure Storage is configured
   */
  isAzureConfigured(): boolean {
    return this.isConfigured
  }
}

// Singleton instance
let azureStorageService: AzureStorageService | null = null

export function getAzureStorageService(): AzureStorageService {
  if (!azureStorageService) {
    azureStorageService = new AzureStorageService()
  }
  return azureStorageService
} 