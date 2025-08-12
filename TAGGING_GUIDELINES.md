# ABB Image Editor - Tagging Guidelines

This document outlines the improved image description and tagging system for the ABB Image Editor, following ABB's corporate standards and best practices.

## Overview

The tagging system has been enhanced to provide:
- **Structured naming conventions** following ABB's top-down approach
- **Clear description guidelines** for consistent, searchable content
- **Smart AI-powered suggestions** with ABB-specific terminology
- **Comprehensive metadata management** for media bank integration

## Description Guidelines

### Character Limit
- **Maximum:** 400 characters
- **Style:** Descriptive but short, clear and searchable

### Content Requirements
1. **Key Visual Elements:** Describe main subjects, objects, and visual features
2. **Business Context:** Include industry, application, or use case information
3. **Professional Tone:** Use ABB brand voice and terminology
4. **Searchable Keywords:** Include relevant terms for easy discovery

### Example Descriptions
✅ **Good Example:**
> "Industrial robot arm performing precision welding in automotive manufacturing facility. Features ABB IRB 6700 series robot with advanced control system and safety fencing."

❌ **Poor Example:**
> "A robot doing something in a factory."

## Naming Convention

### Character Limit
- **Maximum:** 600 characters
- **Format:** Top-down convention

### Structure
```
division/business name*_asset type_campaign name_format_ratio
```

### Components

#### 1. Division/Business Name
- **Purpose:** Identifies the ABB business unit or division
- **Examples:** Robotics, Power Grids, Industrial Automation, Motion, Marine & Ports
- **Note:** Use underscores for multi-word divisions (e.g., `Industrial_Automation`)

#### 2. Asset Type
- **Purpose:** Categorizes the type of visual asset
- **Options:**
  - `product` - Product images, equipment, devices
  - `installation` - Installation sites, facilities, projects
  - `application` - Use cases, implementations, deployments
  - `technology` - Technology demonstrations, innovations
  - `solution` - Complete solutions, system overviews
  - `infrastructure` - Infrastructure, buildings, facilities
  - `equipment` - Machinery, tools, hardware
  - `system` - System diagrams, architectures

#### 3. Campaign Name
- **Purpose:** Identifies the marketing campaign or initiative
- **Examples:**
  - `Q4_2024` - Quarterly campaigns
  - `Digital_Transformation` - Initiative-based campaigns
  - `Sustainability_2025` - Theme-based campaigns
  - `Innovation_Week` - Event-based campaigns
  - `Customer_Stories` - Content type campaigns

#### 4. Format
- **Purpose:** Specifies the file format
- **Options:** jpg, png, tiff, webp, svg

#### 5. Aspect Ratio
- **Purpose:** Indicates the image dimensions
- **Options:**
  - `1_1` - Square (1:1)
  - `4_3` - Standard (4:3)
  - `16_9` - Widescreen (16:9)
  - `3_2` - Photo (3:2)
  - `5_4` - Portrait (5:4)
  - `2_1` - Panorama (2:1)

### Complete Examples

```
Robotics_product_Q4_2024_jpg_16_9
PowerGrids_installation_Sustainability_2025_png_4_3
IndustrialAutomation_equipment_DigitalTransformation_tiff_1_1
Motion_technology_Innovation_Week_jpg_3_2
MarinePorts_solution_Customer_Stories_png_16_9
```

## Tagging Best Practices

### Tag Categories
1. **Industry Terms:** industrial, manufacturing, automation, robotics
2. **Product Categories:** power, grid, energy, infrastructure
3. **Applications:** welding, assembly, quality control, safety
4. **Technology:** AI, IoT, digital, smart, connected
5. **ABB Specific:** ABB, brand, corporate, professional

### Recommended Tags
- **Core:** industrial, automation, robotics, power, technology
- **ABB Focus:** ABB, professional, corporate, brand
- **Industry:** manufacturing, energy, infrastructure, equipment
- **Applications:** solution, system, installation, application

### Tag Guidelines
- **Maximum:** 10 tags per image
- **Specificity:** Use specific, relevant terms
- **Consistency:** Maintain consistent terminology across similar images
- **Searchability:** Include terms users would search for

## AI-Powered Features

### Smart Description Generation
- **Technology:** OpenAI GPT-4 Vision
- **Focus:** ABB-specific terminology and industrial context
- **Guidelines:** Automatically enforces character limits and style requirements
- **Enhancement:** Adds ABB-specific tags when relevant

### Intelligent Tagging
- **Automatic Detection:** Identifies objects, scenes, and context
- **ABB Enhancement:** Suggests industry-relevant tags
- **Smart Filtering:** Removes irrelevant or inappropriate tags
- **Context Awareness:** Considers business applications and use cases

## Implementation Details

### Required Fields
- **Description:** Must be filled (400 char limit)
- **Naming Convention:** Must be generated (600 char limit)
- **Tags:** AI-generated with manual editing capability

### Validation Rules
1. Description cannot exceed 400 characters
2. Naming convention cannot exceed 600 characters
3. At least one tag must be present
4. Save button is disabled until required fields are completed

### Data Persistence
- All metadata is stored in the image version history
- Supports Azure Blob Storage integration
- Maintains version chain for tracking changes
- Exports to media bank compatible formats

## Media Bank Integration

### Preview Functionality
- Real-time preview of how images will appear in media bank
- Shows title, description, naming convention, and tags
- Displays character counts and validation status
- Provides immediate feedback on metadata quality

### Export Compatibility
- Follows ABB media bank standards
- Supports bulk export operations
- Maintains metadata relationships
- Compatible with DAM systems

## Best Practices Summary

### Do's
✅ Use descriptive, professional language
✅ Follow the naming convention structure
✅ Include relevant business context
✅ Use ABB-specific terminology
✅ Keep descriptions under 400 characters
✅ Generate consistent naming conventions

### Don'ts
❌ Use vague or generic descriptions
❌ Skip required fields
❌ Exceed character limits
❌ Use inconsistent terminology
❌ Ignore business context
❌ Use inappropriate or unprofessional language

## Support and Resources

### Help Resources
- **In-App Guidelines:** Comprehensive guidelines displayed in the metadata editor
- **AI Assistance:** Smart suggestions and automatic generation
- **Validation:** Real-time feedback and error prevention
- **Examples:** Sample descriptions and naming conventions

### Training Materials
- **Video Tutorials:** Step-by-step guidance for users
- **Best Practices:** Regular updates and improvements
- **User Feedback:** Continuous enhancement based on usage patterns
- **Support Team:** Expert assistance for complex scenarios

---

*This document is part of the ABB Image Editor system and should be updated as guidelines evolve.*
