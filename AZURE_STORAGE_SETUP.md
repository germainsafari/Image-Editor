# Azure Blob Storage Integration Setup

This guide will help you set up Azure Blob Storage for persistent image versioning in your image editor application.

## Prerequisites

1. Azure Storage Account
2. Azure Storage Container
3. Azure Storage Account Key
4. Node.js and npm installed

## Azure Storage Setup

### 1. Create Azure Storage Account

1. Go to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Storage account" and select it
4. Click "Create"
5. Fill in the required information:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new or use existing
   - **Storage account name**: Choose a unique name (e.g., `myimageeditorstorage`)
   - **Location**: Choose a region close to your users
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage)
6. Click "Review + create" and then "Create"

### 2. Create Storage Container

1. Go to your storage account in the Azure Portal
2. In the left menu, click "Containers"
3. Click "+ Container"
4. Enter a name (e.g., `images`)
5. Set public access level to "Private"
6. Click "Create"

### 3. Get Storage Account Key

1. In your storage account, go to "Access keys" in the left menu
2. Copy the "key1" value (this is your account key)

## Environment Configuration

1. Create a `.env.local` file in your project root
2. Add your Azure Storage credentials:

```env
# Azure Blob Storage Configuration
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_CONTAINER=your_container_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key

# BFL.ai API Configuration
FLUX_KONTEXT_API_KEY=your_bfl_ai_api_key_here
```

## How It Works

### Image Versioning Flow

1. **Upload**: When you upload an image, it's stored as a blob URL initially
2. **Processing**: When you edit the image (AI, colors, etc.), the new version is:
   - Generated as a blob URL
   - Uploaded to Azure Blob Storage
   - Stored with metadata (prompt, type, timestamp, etc.)
3. **Storage**: All versions are stored in Azure with organized folder structure:
   ```
   images/
   ├── v1234567890/
   │   ├── upload-2024-01-15T10-30-00-000Z.jpg
   │   ├── flux-2024-01-15T10-31-00-000Z.jpg
   │   └── color-2024-01-15T10-32-00-000Z.jpg
   └── v1234567891/
       └── upload-2024-01-15T11-00-00-000Z.jpg
   ```

### Features

- **Persistent Storage**: All images are stored in Azure Blob Storage
- **Version History**: Complete history of all edits with metadata
- **Metadata Storage**: Prompts, settings, and timestamps are stored with each version
- **Cloud Icons**: Visual indicators show which versions are stored in Azure
- **Delete Functionality**: Remove unwanted versions (deletes from Azure too)
- **Download**: Download any version directly from Azure

## API Endpoints

### Azure Storage Management

- `GET /api/azure-storage?action=list&prefix=images/` - List all images
- `GET /api/azure-storage?action=metadata&filename=path/to/image.jpg` - Get image metadata
- `DELETE /api/azure-storage?filename=path/to/image.jpg` - Delete image from Azure

## Security Considerations

- **Private Access**: Container is set to private access
- **Server-side Only**: All Azure operations happen server-side
- **No Direct Access**: Client never directly accesses Azure Storage
- **Environment Variables**: Credentials stored in environment variables only

## Troubleshooting

### Common Issues

1. **"Azure Storage configuration is incomplete"**
   - Check that all three environment variables are set
   - Restart your development server after adding variables

2. **"Failed to upload to Azure Blob Storage"**
   - Verify your storage account name and key are correct
   - Check that the container exists and is accessible
   - Ensure your storage account has proper permissions

3. **"Failed to delete from Azure Blob Storage"**
   - Check that the blob path is correct
   - Verify your storage account has delete permissions

### Error Messages

- `Azure Storage configuration is incomplete`: Add all required environment variables
- `Failed to upload image to Azure Blob Storage`: Check Azure credentials and permissions
- `Failed to download image from Azure Blob Storage`: Check blob path and permissions
- `Failed to delete image from Azure Blob Storage`: Check delete permissions

## Development

To test the Azure Storage integration:

1. **Set up environment variables** as shown above
2. **Restart your development server**:
   ```bash
   npm run dev
   ```
3. **Upload an image** and go through the editing process
4. **Check the version manager** to see cloud icons indicating Azure storage
5. **Test version deletion** to ensure Azure cleanup works

## Cost Considerations

- **Storage**: Pay for actual storage used (typically very low for images)
- **Transactions**: Pay for read/write operations
- **Bandwidth**: Pay for data transfer (minimal for typical usage)
- **Monitoring**: Use Azure Monitor to track usage and costs

## Best Practices

1. **Regular Cleanup**: Implement automatic cleanup of old versions
2. **Compression**: Consider compressing images before upload
3. **CDN**: Use Azure CDN for faster image delivery
4. **Monitoring**: Set up alerts for storage usage
5. **Backup**: Consider backup strategies for important images

## Migration from Local Storage

If you have existing images in local storage:

1. **Export**: Download all existing images
2. **Upload**: Re-upload them through the new system
3. **Verify**: Check that all versions appear in the version manager
4. **Cleanup**: Remove old local storage files

The new system will automatically handle Azure storage for all new uploads and edits. 