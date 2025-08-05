# ABB Image Editor - 1.0

A comprehensive AI-powered image editing tool designed for ABB brand consistency and professional image processing workflows.

## Features

### 🚀 Test Image Flow Across Functions
The application provides a seamless flow where edited images are temporarily stored and can be reused across different functions. Each editing step creates a new version that's available for the next step in the workflow.

### 🤖 AI Image Detection (95%+ Accuracy)
- **Multi-Service Detection**: Uses Hive AI and Sightengine APIs for high-accuracy detection
- **Local Analysis Fallback**: Advanced computer vision analysis when APIs are unavailable
- **Real-time Analysis**: Instant detection during image upload
- **Confidence Scoring**: Detailed confidence levels with visual indicators
- **User Alerts**: Warns users about high-confidence AI-generated images
- **Gallery Integration**: AI detection badges displayed in image gallery

### ✨ Edit Image Context
- **Flux Kontext Integration**: Uses Flux Kontext API for AI-powered image editing
- **Text Prompt Interface**: Describe desired changes using natural language
- **Real-time Preview**: See changes applied to your image
- **Example Prompts**: Pre-built suggestions for common editing tasks

### 🎨 Color Edit
- **ABB Brand Colors**: Pre-configured ABB primary colors (red: #E60012, blue: #0066B3)
- **Professional Presets**: Multiple color style options for different use cases
- **Manual Controls**: Fine-tune saturation, brightness, and contrast
- **Brand Guidelines**: Built-in ABB brand consistency recommendations

### ✂️ Resize and Crop Functionalities
- **Manual Controls**: Drag and resize crop areas with precision
- **Preset Aspect Ratios**: Choose from common ratios (1:1, 3:4, 3:2, 5:4, etc.)
- **Real-time Preview**: See crop results instantly
- **Grid Overlays**: Rule of thirds, golden ratio, and custom grid options
- **Zoom Controls**: Adjust zoom level for precise cropping

### 📝 Image Description and Tagging
- **AI Analysis**: Automatic content analysis and description generation
- **Smart Tagging**: AI-suggested tags based on image content
- **Manual Input**: Add custom tags and descriptions
- **Media Bank Integration**: Preview how images will appear in media bank
- **Product Identification**: Manual input for specific products AI might miss

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **State Management**: Zustand
- **Image Processing**: React Image Crop
- **UI Components**: Custom components with ABB branding

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd abb-image-editor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Usage Workflow

1. **Upload Image**: Drag and drop or click to upload an image
2. **AI Check**: System automatically analyzes if image is AI-generated
3. **Edit Context**: Use text prompts to modify image with Flux Kontext
4. **Color Edit**: Apply ABB brand colors and professional filters
5. **Crop & Resize**: Adjust composition with manual controls and presets
6. **Description & Tagging**: AI generates metadata, add manual input
7. **Download**: Save the final edited image

## File Structure

```
├── app/                    # Next.js app directory
│   ├── edit/              # Editing pages
│   │   ├── context/       # Flux Kontext editing
│   │   ├── colors/        # Color editing
│   │   ├── crop/          # Crop and resize
│   │   └── meta/          # Description and tagging
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   └── EditorLayout.tsx   # Shared editor layout
├── lib/                   # Utilities and store
│   ├── store.ts          # Zustand state management
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```

## API Integration

The application is designed to integrate with:
- **Flux Kontext API**: For AI-powered image editing
- **AI Detection Services**: For checking AI-generated content
- **Image Analysis APIs**: For content description and tagging

## AI Detection Configuration

The application uses a multi-layered approach for AI image detection:

### Primary Detection Services
1. **Hive AI** (50% weight): High-accuracy AI detection service
2. **Sightengine** (30% weight): Secondary detection service for validation
3. **Local Analysis** (20% weight): Fallback using advanced computer vision

### Detection Methods
- **Noise Pattern Analysis**: Detects uniform noise patterns common in AI images
- **Symmetry Analysis**: Identifies unnaturally perfect symmetry
- **Artifact Detection**: Finds compression and generation artifacts
- **Color Distribution**: Analyzes unusual color patterns
- **Edge Detection**: Identifies overly perfect edges

### Accuracy Levels
- **95%+ Confidence**: High-confidence AI detection with user warnings
- **80-95% Confidence**: Likely AI with visual indicators
- **60-80% Confidence**: Possible AI with subtle indicators
- **<60% Confidence**: No indicators shown

## Brand Guidelines

The application follows ABB brand guidelines:
- **Primary Colors**: Red (#E60012), Blue (#0066B3)
- **Typography**: Inter font family
- **Professional Aesthetics**: Clean, corporate design
- **Consistency**: Maintains ABB brand identity across all features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary to ABB and confidential.

## Support

For technical support or questions about the ABB Image Editor, please contact the development team. 