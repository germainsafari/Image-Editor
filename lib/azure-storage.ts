import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob'

export interface AzureStorageConfig {
  account: string
  container: string
  accountKey: string
  connectionString?: string
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
      accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    }

    // Enhanced configuration validation
    this.validateConfiguration()
  }

  private validateConfiguration() {
    // Check if we have a connection string first (preferred method)
    if (this.config.connectionString) {
      try {
        this.isConfigured = true
        this.blobServiceClient = BlobServiceClient.fromConnectionString(this.config.connectionString)
        this.containerClient = this.blobServiceClient.getContainerClient(this.config.container)
        
        console.log(`Azure Storage configured successfully using connection string for container: ${this.config.container}`)
        return
      } catch (error) {
        console.error('Failed to initialize Azure Storage client with connection string:', error)
        this.isConfigured = false
        return
      }
    }

    // Fallback to individual credentials
    const missingVars = []
    
    if (!this.config.account) missingVars.push('AZURE_STORAGE_ACCOUNT_NAME')
    if (!this.config.container) missingVars.push('AZURE_STORAGE_CONTAINER')
    if (!this.config.accountKey) missingVars.push('AZURE_STORAGE_ACCOUNT_KEY')

    if (missingVars.length > 0) {
      console.warn(`Azure Storage configuration is incomplete. Missing: ${missingVars.join(', ')}`)
      console.warn('Images will be stored locally only.')
      this.isConfigured = false
      return
    }

    // Validate account name format
    if (!/^[a-z0-9]{3,24}$/.test(this.config.account)) {
      console.error('Invalid Azure Storage account name. Must be 3-24 characters, lowercase letters and numbers only.')
      this.isConfigured = false
      return
    }

    // Validate account key format (only if not using connection string)
    if (!/^[A-Za-z0-9+/]{88}==$/.test(this.config.accountKey)) {
      console.error('Invalid Azure Storage account key format.')
      this.isConfigured = false
      return
    }

    try {
      this.isConfigured = true
      const connectionString = `DefaultEndpointsProtocol=https;AccountName=${this.config.account};AccountKey=${this.config.accountKey};EndpointSuffix=core.windows.net`
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
      this.containerClient = this.blobServiceClient.getContainerClient(this.config.container)
      
      console.log(`Azure Storage configured successfully for account: ${this.config.account}, container: ${this.config.container}`)
    } catch (error) {
      console.error('Failed to initialize Azure Storage client:', error)
      this.isConfigured = false
    }
  }

  /**
   * Test Azure Storage connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'Azure Storage is not configured' }
    }

    try {
      // Test container access
      const properties = await this.containerClient!.getProperties()
      console.log('Azure Storage connection test successful')
      return { success: true }
    } catch (error: any) {
      console.error('Azure Storage connection test failed:', error)
      
      // Provide specific error messages
      if (error.statusCode === 404) {
        return { success: false, error: 'Container not found. Please check the container name.' }
      } else if (error.statusCode === 403) {
        return { success: false, error: 'Access denied. Please check your account key and permissions.' }
      } else if (error.statusCode === 400) {
        return { success: false, error: 'Invalid request. Please check your account name and key.' }
      } else {
        return { success: false, error: `Connection failed: ${error.message}` }
      }
    }
  }

  /**
   * Upload an image to Azure Blob Storage
   */
  async uploadImage(imageData: string, filename: string, metadata?: Record<string, string>): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Azure Storage is not configured')
    }

    try {
      console.log(`Attempting to upload image: ${filename}`)
      
      // Convert base64 to buffer
      const buffer = Buffer.from(imageData, 'base64')
      console.log(`Image buffer size: ${buffer.length} bytes`)
      
      // Create blob client
      const blobClient = this.containerClient!.getBlockBlobClient(filename)
      
      // Upload with metadata
      const uploadResult = await blobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'image/jpeg'
        },
        metadata
      })

      console.log(`Upload successful: ${filename}, ETag: ${uploadResult.etag}`)
      
      // Return the blob URL
      return blobClient.url
    } catch (error: any) {
      console.error('Error uploading to Azure Blob Storage:', error)
      
      // Provide specific error messages
      if (error.statusCode === 404) {
        throw new Error('Container not found. Please check the container name.')
      } else if (error.statusCode === 403) {
        throw new Error('Access denied. Please check your account key and permissions.')
      } else if (error.statusCode === 400) {
        throw new Error('Invalid request. Please check your account name and key.')
      } else {
        throw new Error(`Failed to upload image to Azure Blob Storage: ${error.message}`)
      }
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
      console.log(`Attempting to upload blob URL: ${filename}`)
      
      // Fetch the blob data
      const response = await fetch(blobUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blob URL: ${response.status} ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      console.log(`Blob buffer size: ${buffer.length} bytes, type: ${blob.type}`)
      
      // Create blob client
      const blobClient = this.containerClient!.getBlockBlobClient(filename)
      
      // Upload with metadata
      const uploadResult = await blobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: blob.type || 'image/jpeg'
        },
        metadata
      })

      console.log(`Upload successful: ${filename}, ETag: ${uploadResult.etag}`)
      
      // Return the blob URL
      return blobClient.url
    } catch (error: any) {
      console.error('Error uploading blob URL to Azure Blob Storage:', error)
      
      // Provide specific error messages
      if (error.statusCode === 404) {
        throw new Error('Container not found. Please check the container name.')
      } else if (error.statusCode === 403) {
        throw new Error('Access denied. Please check your account key and permissions.')
      } else if (error.statusCode === 400) {
        throw new Error('Invalid request. Please check your account name and key.')
      } else {
        throw new Error(`Failed to upload image to Azure Blob Storage: ${error.message}`)
      }
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