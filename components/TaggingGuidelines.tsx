import React from 'react'
import { FileText, Hash, Tag, Info } from 'lucide-react'

interface TaggingGuidelinesProps {
  showNamingConvention?: boolean
  showDescriptionGuidelines?: boolean
  showTagGuidelines?: boolean
  className?: string
}

export default function TaggingGuidelines({
  showNamingConvention = true,
  showDescriptionGuidelines = true,
  showTagGuidelines = true,
  className = ''
}: TaggingGuidelinesProps) {
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <FileText size={20} className="text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-blue-900">ABB Tagging Guidelines</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Description Guidelines */}
        {showDescriptionGuidelines && (
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-3">
              <FileText size={16} className="text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">Description Guidelines</h4>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Character Limit:</strong> 400 characters maximum
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Style:</strong> Descriptive but short, clear and searchable
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Focus:</strong> Key visual elements and business context
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Tone:</strong> Professional ABB terminology and voice
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                <strong>Example:</strong> "Industrial robot arm performing precision welding in automotive manufacturing facility. Features ABB IRB 6700 series robot with advanced control system and safety fencing."
              </div>
            </div>
          </div>
        )}

        {/* Naming Convention Guidelines */}
        {showNamingConvention && (
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-3">
              <Hash size={16} className="text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">Naming Convention</h4>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Character Limit:</strong> 600 characters maximum
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Format:</strong> Top-down convention
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Structure:</strong> division*_asset type_campaign name_format_ratio
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs font-mono">
                <strong>Examples:</strong><br/>
                Robotics_product_Q4_2024_jpg_16_9<br/>
                PowerGrids_installation_Sustainability_2025_png_4_3<br/>
                IndustrialAutomation_equipment_DigitalTransformation_tiff_1_1
              </div>
            </div>
          </div>
        )}

        {/* Tag Guidelines */}
        {showTagGuidelines && (
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-3">
              <Tag size={16} className="text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">Tagging Best Practices</h4>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Categories:</strong> Industry, product, application, technology
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>Keywords:</strong> Use searchable, relevant terms
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-abb-red font-bold mr-2">•</span>
                <div>
                  <strong>ABB Focus:</strong> Include brand-specific terminology
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                <strong>Recommended Tags:</strong> industrial, automation, robotics, power grids, manufacturing, energy, infrastructure, equipment, solution, technology, ABB, professional
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-center mb-2">
          <Info size={16} className="text-indigo-600 mr-2" />
          <h4 className="font-medium text-indigo-900">Quick Reference</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-indigo-800">
          <div>
            <strong>Common Divisions:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Robotics</li>
              <li>• Power Grids</li>
              <li>• Industrial Automation</li>
              <li>• Motion</li>
              <li>• Marine & Ports</li>
            </ul>
          </div>
          <div>
            <strong>Asset Types:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Product</li>
              <li>• Installation</li>
              <li>• Application</li>
              <li>• Technology</li>
              <li>• Solution</li>
            </ul>
          </div>
          <div>
            <strong>Campaign Examples:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Q4_2024</li>
              <li>• Digital_Transformation</li>
              <li>• Sustainability_2025</li>
              <li>• Innovation_Week</li>
              <li>• Customer_Stories</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
