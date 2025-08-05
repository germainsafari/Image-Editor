import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'

interface AIDetectionResult {
  isAI: boolean
  confidence: number
  details?: any
}

interface AIDetectionBadgeProps {
  result: AIDetectionResult
  showDetails?: boolean
}

export default function AIDetectionBadge({ result, showDetails = false }: AIDetectionBadgeProps) {
  const confidencePercentage = Math.round(result.confidence * 100)
  
  if (result.confidence < 0.3) {
    // Low confidence - don't show badge
    return null
  }

  const getBadgeConfig = () => {
    if (result.isAI) {
      if (result.confidence > 0.8) {
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          label: 'AI Generated'
        }
      } else {
        return {
          icon: Shield,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200',
          label: 'Likely AI'
        }
      }
    } else {
      if (result.confidence > 0.8) {
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          label: 'Authentic'
        }
      } else {
        return {
          icon: Shield,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          label: 'Likely Real'
        }
      }
    }
  }

  const config = getBadgeConfig()
  const IconComponent = config.icon

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      <IconComponent size={12} />
      <span>{config.label}</span>
      {showDetails && (
        <span className="text-xs opacity-75">({confidencePercentage}%)</span>
      )}
    </div>
  )
} 