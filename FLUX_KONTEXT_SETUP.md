# BFL.ai API Integration Setup

This guide will help you set up and use the BFL.ai API integration in your image editor application.

## Prerequisites

1. A BFL.ai API key
2. Node.js and npm installed
3. The image editor application running

## Environment Setup

1. Create a `.env.local` file in the root directory of your project
2. Add your BFL.ai API key:

```env
FLUX_KONTEXT_API_KEY=your_actual_bfl_ai_api_key_here
FLUX_KONTEXT_API_URL=https://api.bfl.ai
```

## Testing Your API Configuration

Before using the image editor, test your API configuration:

1. **Visit the test endpoint**: Go to `http://localhost:3000/api/flux-kontext/test` in your browser
2. **Check the response**: You should see a JSON response indicating if your API key is configured correctly
3. **Look for errors**: If you see "API key not configured", make sure your `.env.local` file exists and contains the correct API key

## How to Use

1. **Upload an Image**: Start by uploading an image on the main page
2. **Edit Image Context**: Navigate to the "Edit image context" step
3. **Enter a Prompt**: Describe what changes you want to make to the image
4. **Generate**: Click the "Generate" button to process your image with BFL.ai
5. **Continue Editing**: The edited image will be available for further editing steps

## Example Prompts

Here are some example prompts you can try:

- "Remove the background and place on a clean white surface"
- "Change the lighting to be more dramatic and professional"
- "Add a subtle blue tint to match ABB brand colors"
- "Make the image more vibrant and modern"
- "Remove any distracting elements in the background"
- "Apply a professional corporate style filter"

## API Integration Details

The integration works as follows:

1. **Image Processing**: The uploaded image is converted to base64 format
2. **API Call**: The image and prompt are sent to the BFL.ai API via our internal API route
3. **Response Handling**: The edited image is returned as base64 and converted back to a blob URL
4. **Version Management**: The edited image is stored as a new version in the application

## Troubleshooting

### Common Issues

1. **401 Unauthorized Error**: This means your API key is invalid or the authentication method is incorrect
   - Check that your API key is correct in `.env.local`
   - Verify the API key format (some APIs require different formats)
   - Try restarting your development server after adding the API key

2. **API Key Not Found**: Make sure your `.env.local` file contains the correct API key
3. **Network Errors**: Check your internet connection and API endpoint availability
4. **Image Processing Errors**: Ensure your image is in a supported format (JPEG, PNG)

### Error Messages

- `BFL.ai API key not configured`: Add your API key to `.env.local`
- `Image and prompt are required`: Make sure you've entered a prompt
- `API error: 401`: Check your API key is valid and properly formatted
- `API error: 429`: You've exceeded your API rate limit

### Debugging Steps

1. **Check your `.env.local` file**:
   ```env
   FLUX_KONTEXT_API_KEY=your_actual_key_here
   FLUX_KONTEXT_API_URL=https://api.bfl.ai
   ```

2. **Test API configuration**: Visit `http://localhost:3000/api/flux-kontext/test`

3. **Check browser console**: Look for detailed error messages in the browser's developer tools

4. **Check server logs**: Look at your terminal where you're running `npm run dev` for server-side error messages

5. **Verify API key format**: BFL.ai uses Bearer token authentication:
   - Bearer token: `Bearer your_key_here`

## Development

To run the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

- `POST /api/flux-kontext`: Internal API route that handles BFL.ai API calls
  - Body: `{ image: string, prompt: string }`
  - Returns: `{ image: string }` (base64 encoded image)
- `GET /api/flux-kontext/test`: Test endpoint to verify API configuration

## Security Notes

- API keys are stored server-side only
- All external API calls are made through our internal API route
- No sensitive data is exposed to the client-side code

## BFL.ai API Documentation

For more information about the BFL.ai API, visit:
- Playground: https://playground.bfl.ai/image/edit
- API Documentation: Check the BFL.ai documentation for detailed API specifications 