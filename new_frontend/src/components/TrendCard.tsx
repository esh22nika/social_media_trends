import { motion } from "motion/react";
import { ThumbsUp, Share2, MessageCircle, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { PLATFORM_CONFIG } from "../services/api";
import type { TrendData } from "../services/api";

interface TrendCardProps extends TrendData {
  // Additional props for styling
  platformColor?: string;
}

export function TrendCard({
  id,
  topic,
  platform,
  likes,
  shares,
  comments,
  sentiment,
  trend,
  relevanceScore,
  tags,
  url,
  author,
  created_at,
  platformColor,
}: TrendCardProps) {
  // Get platform config or use custom color
  const platformConfig = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG] || {
    color: platformColor || '#6B7280',
    name: platform,
    icon: '📱'
  };
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getSentimentColor = () => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const handleCardClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="bg-gradient-to-br from-white to-slate-50 border-2 hover:shadow-2xl transition-all overflow-hidden relative group cursor-pointer" 
        style={{
          borderImage: `linear-gradient(135deg, ${platformConfig.color}40, ${platformConfig.color}20) 1`,
          borderImageSlice: 1
        }}
        onClick={handleCardClick}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl" style={{ 
          backgroundImage: `linear-gradient(135deg, ${platformConfig.color}, transparent)` 
        }} />
        <div className="p-6 relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  className="uppercase text-xs shadow-sm"
                  style={{ 
                    background: `linear-gradient(135deg, ${platformConfig.color}30, ${platformConfig.color}20)`,
                    color: platformConfig.color,
                    border: `1px solid ${platformConfig.color}40`
                  }}
                >
                  {platformConfig.name}
                </Badge>
                {trend === "rising" && (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
                {trend === "falling" && (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <h3 className="text-slate-900 mb-2">{topic}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Relevance:</span>
                <div className="flex-1 max-w-[100px] bg-slate-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${relevanceScore}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <span className="text-sm text-slate-600">{relevanceScore}%</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col items-center gap-1 bg-green-500/10 rounded-lg p-2">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-400">{formatNumber(likes)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-blue-500/10 rounded-lg p-2">
              <Share2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-400">{formatNumber(shares)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-purple-500/10 rounded-lg p-2">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-purple-400">{formatNumber(comments)}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs border-slate-300 text-slate-700"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Sentiment:</span>
              <span className={`capitalize ${getSentimentColor()}`}>{sentiment}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">{formatDate(created_at)}</span>
              {url && (
                <ExternalLink className="w-3 h-3 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
