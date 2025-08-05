#!/usr/bin/env node

/**
 * Azure Storage Test Script
 * 
 * This script helps you test your Azure Storage configuration
 * Run it with: node test-azure-storage.js
 */

const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config({ path: '.env.local' });

async function testAzureStorage() {
  console.log('🔍 Azure Storage Configuration Test\n');

  // Check environment variables
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const containerName = process.env.AZURE_STORAGE_CONTAINER;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;

  console.log('📋 Environment Variables Check:');
  console.log(`  SAS Token: ${sasToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Connection String: ${connectionString ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Account Name: ${accountName ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Container: ${containerName ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Account Key: ${accountKey ? '✅ Set' : '❌ Missing'}`);

  // Check if we have any valid configuration
  const hasSasConfig = sasToken && accountName && containerName;
  const hasConnectionString = connectionString && containerName;
  const hasIndividualCredentials = accountName && containerName && accountKey;

  if (!hasSasConfig && !hasConnectionString && !hasIndividualCredentials) {
    console.log('\n❌ Missing environment variables. Please check your .env.local file.');
    console.log('   You need one of these configurations:');
    console.log('   1. SAS Token: AZURE_STORAGE_SAS_TOKEN + AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_CONTAINER');
    console.log('   2. Connection String: AZURE_STORAGE_CONNECTION_STRING + AZURE_STORAGE_CONTAINER');
    console.log('   3. Individual Credentials: AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_CONTAINER + AZURE_STORAGE_ACCOUNT_KEY');
    return;
  }

  // Validate individual credentials only if not using SAS or connection string
  if (!sasToken && !connectionString) {
    // Validate account name format
    if (!/^[a-z0-9]{3,24}$/.test(accountName)) {
      console.log('\n❌ Invalid account name format. Must be 3-24 characters, lowercase letters and numbers only.');
      return;
    }

    // Validate account key format
    if (!/^[A-Za-z0-9+/]{88}==$/.test(accountKey)) {
      console.log('\n❌ Invalid account key format. Should be 88 characters ending with ==');
      return;
    }
  }

  console.log('\n✅ Environment variables are valid');

  try {
    // Test connection
    console.log('\n🔗 Testing Azure Storage Connection...');
    
    let blobServiceClient;
    if (sasToken && accountName) {
      console.log('🔐 Using SAS token for connection');
      blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net?${sasToken}`
      );
    } else if (connectionString) {
      console.log('🔗 Using connection string for connection');
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else {
      console.log('🔑 Using account key for connection');
      const constructedConnectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
      blobServiceClient = BlobServiceClient.fromConnectionString(constructedConnectionString);
    }
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Test container access
    const properties = await containerClient.getProperties();
    console.log('✅ Successfully connected to Azure Storage');
    console.log(`   Container: ${containerName}`);
    console.log(`   Last Modified: ${properties.lastModified}`);

    // Test upload (small test file)
    console.log('\n📤 Testing Upload...');
    const testBlobName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for Azure Storage connectivity.';
    const blockBlobClient = containerClient.getBlockBlobClient(testBlobName);
    
    await blockBlobClient.uploadData(Buffer.from(testContent), {
      blobHTTPHeaders: { blobContentType: 'text/plain' }
    });
    console.log(`✅ Successfully uploaded test file: ${testBlobName}`);

    // Test download
    console.log('\n📥 Testing Download...');
    const downloadResponse = await blockBlobClient.download();
    const downloadedContent = await streamToString(downloadResponse.readableStreamBody);
    console.log(`✅ Successfully downloaded test file: ${downloadedContent}`);

    // Clean up test file
    console.log('\n🧹 Cleaning up test file...');
    await blockBlobClient.delete();
    console.log('✅ Test file deleted');

    console.log('\n🎉 All tests passed! Your Azure Storage is configured correctly.');

  } catch (error) {
    console.log('\n❌ Azure Storage test failed:');
    
    if (error.statusCode === 404) {
      console.log('   Error: Container not found');
      console.log('   Solution: Check that the container exists in your Azure Storage account');
    } else if (error.statusCode === 403) {
      console.log('   Error: Access denied');
      console.log('   Solution: Check your account key and permissions');
    } else if (error.statusCode === 400) {
      console.log('   Error: Invalid request');
      console.log('   Solution: Check your account name and key format');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n📖 For more help, see AZURE_TROUBLESHOOTING.md');
  }
}

// Helper function to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}

// Run the test
testAzureStorage().catch(console.error); 