# Azure Storage Troubleshooting Guide

This guide will help you diagnose and fix Azure Storage upload issues in your image editor application.

## Quick Diagnosis

### 1. Check Environment Variables

First, ensure you have a `.env.local` file in your project root. You can use either of these two methods:

**Option 1: Connection String (Recommended)**
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your_account;AccountKey=your_key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=your_container_name
```

**Option 2: Individual Credentials**
```env
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_CONTAINER=your_container_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
```

**Important**: Replace the placeholder values with your actual Azure Storage credentials.

### 2. Test Configuration

After setting up your environment variables, restart your development server and test the configuration:

```bash
# Restart your development server
npm run dev
```

Then visit: `http://localhost:3000/api/azure-storage?action=config`

This will show you if your environment variables are properly loaded.

### 3. Test Connection

Visit: `http://localhost:3000/api/azure-storage?action=test`

This will test the actual connection to Azure Storage and provide specific error messages.

## Common Issues and Solutions

### Issue 1: "Azure Storage configuration is incomplete"

**Symptoms**: Console shows warning about missing environment variables.

**Solution**:
1. Create a `.env.local` file in your project root
2. Add all three required environment variables
3. Restart your development server
4. Check the browser console for configuration status

### Issue 2: "Container not found"

**Symptoms**: 404 error when trying to upload.

**Solution**:
1. Verify the container name in Azure Portal
2. Check that the container exists in your storage account
3. Ensure the container name in `.env.local` matches exactly (case-sensitive)
4. Make sure the container is not deleted or renamed

### Issue 3: "Access denied"

**Symptoms**: 403 error when trying to upload.

**Solution**:
1. Verify your storage account key is correct
2. Check that you're using the primary or secondary key (not a SAS token)
3. Ensure your storage account has proper permissions
4. Verify the account name is correct

### Issue 4: "Invalid request"

**Symptoms**: 400 error when trying to upload.

**Solution**:
1. Check that your storage account name follows Azure naming rules (3-24 characters, lowercase letters and numbers only)
2. Verify your account key format (should be 88 characters ending with ==)
3. Ensure you're using the correct endpoint suffix

### Issue 5: CORS Issues

**Symptoms**: Network errors in browser console.

**Solution**:
1. In Azure Portal, go to your storage account
2. Navigate to "Settings" > "Resource sharing (CORS)"
3. Add a new CORS rule:
   - Allowed origins: `*` (or your specific domain)
   - Allowed methods: `GET, POST, PUT, DELETE, HEAD`
   - Allowed headers: `*`
   - Exposed headers: `*`
   - Max age: `86400`

### Issue 6: Container Access Level

**Symptoms**: Images can't be accessed after upload.

**Solution**:
1. In Azure Portal, go to your storage account
2. Navigate to "Containers"
3. Select your container
4. Click "Change access level"
5. Choose "Blob (anonymous read access for blobs only)" or "Container (anonymous read access for containers and blobs)"

## Step-by-Step Setup Verification

### 1. Azure Portal Setup

1. **Storage Account**:
   - Go to Azure Portal > Storage accounts
   - Verify your storage account exists and is active
   - Note the account name (lowercase, no spaces)

2. **Container**:
   - Go to your storage account > Containers
   - Verify your container exists
   - Note the exact container name (case-sensitive)

3. **Access Keys**:
   - Go to your storage account > Access keys
   - Copy the "key1" value (this is your account key)
   - The key should be 88 characters ending with ==

### 2. Environment Configuration

1. **Create `.env.local`**:
   ```env
   AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
   AZURE_STORAGE_CONTAINER=images
   AZURE_STORAGE_ACCOUNT_KEY=your_88_character_key_here==
   ```

2. **Restart Server**:
   ```bash
   npm run dev
   ```

### 3. Test Configuration

1. **Check Config**: Visit `http://localhost:3000/api/azure-storage?action=config`
   - Should show `configured: true`
   - All three variables should show `true`

2. **Test Connection**: Visit `http://localhost:3000/api/azure-storage?action=test`
   - Should show `success: true`

### 4. Test Upload

1. Upload an image in your application
2. Check the browser console for upload logs
3. Verify the image appears in Azure Portal

## Debugging Tools

### Browser Console

Check the browser console for detailed error messages. The enhanced Azure Storage service now provides specific error messages for different failure scenarios.

### Network Tab

1. Open browser DevTools
2. Go to Network tab
3. Try to upload an image
4. Look for failed requests to Azure Storage
5. Check the response for specific error messages

### Server Logs

Check your terminal where you're running `npm run dev` for server-side error messages.

## Advanced Troubleshooting

### Check Azure Storage SDK Version

Ensure you have the latest Azure Storage SDK:

```bash
npm install @azure/storage-blob@latest
```

### Verify Network Connectivity

Test if your application can reach Azure Storage:

```bash
# Test connectivity to Azure Storage
curl -I https://yourstorageaccount.blob.core.windows.net
```

### Check Storage Account Tier

Ensure your storage account supports the operations you're trying to perform. Some operations might not be available in certain tiers.

## Getting Help

If you're still experiencing issues:

1. **Check the browser console** for specific error messages
2. **Test the configuration endpoints** mentioned above
3. **Verify your Azure Storage setup** in the Azure Portal
4. **Check the server logs** for detailed error information

## Common Error Messages and Solutions

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Azure Storage is not configured" | Missing environment variables | Create `.env.local` with all required variables |
| "Container not found" | Wrong container name | Verify container name in Azure Portal |
| "Access denied" | Wrong account key | Use the correct primary/secondary key |
| "Invalid request" | Wrong account name format | Use lowercase letters and numbers only |
| "Failed to fetch blob URL" | CORS issue | Configure CORS in Azure Portal |

## Performance Tips

1. **Use appropriate blob tier** for your use case
2. **Enable CDN** for faster image delivery
3. **Compress images** before upload to reduce storage costs
4. **Use appropriate access levels** for your security requirements 