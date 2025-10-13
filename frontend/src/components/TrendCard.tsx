import { motion } from "motion/react";
import { ThumbsUp, ThumbsDown, Share2, MessageCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface TrendCardProps {
  topic: string;
  platform: string;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
  sentiment: "positive" | "negative" | "neutral";
  trend: "rising" | "falling" | "stable";
  relevanceScore: number;
  tags: string[];
  platformColor: string;
}

export function TrendCard({
  topic,
  platform,
  likes,
  dislikes,
  shares,
  comments,
  sentiment,
  trend,
  relevanceScore,
  tags,
  platformColor,
}: TrendCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getSentimentColor = () => {
    switch (sentiment) {
      case "positive":
        return "text-green-500";
      case "negative":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  className="uppercase text-xs"
                  style={{ backgroundColor: platformColor + "40", color: platformColor }}
                >
                  {platform}
                </Badge>
                {trend === "rising" && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
                {trend === "falling" && (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <h3 className="text-white mb-2">{topic}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Relevance:</span>
                <div className="flex-1 max-w-[100px] bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${relevanceScore}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <span className="text-sm text-slate-400">{relevanceScore}%</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="flex flex-col items-center gap-1 bg-green-500/10 rounded-lg p-2">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-400">{formatNumber(likes)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-red-500/10 rounded-lg p-2">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-400">{formatNumber(dislikes)}</span>
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
                className="text-xs border-slate-600 text-slate-300"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Sentiment */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Sentiment:</span>
            <span className={`capitalize ${getSentimentColor()}`}>{sentiment}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
