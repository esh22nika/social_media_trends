import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { TrendCard } from "../components/TrendCard";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Sparkles, Clock, Star, Filter, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { apiService } from "../services/api";

interface DashboardProps {
  user?: any;
}

export function Dashboard({ user }: DashboardProps) {
  const [trends, setTrends] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("foryou");

  // Load trends data
  useEffect(() => {
    loadTrendsData();
  }, [user]);

  const loadTrendsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load personalized recommendations if user is logged in
      if (user?.id) {
        const response = await apiService.getPersonalizedRecommendations(user.id, 20);
        if (response.success) {
          setTrends(response.data || []);
        } else {
          // Fallback to general trends
          const generalResponse = await apiService.fetchTrends(20);
          if (generalResponse.success) {
            setTrends(generalResponse.data || []);
          }
        }
      } else {
        // Load general trends for non-logged in users
        const response = await apiService.fetchTrends(20);
        if (response.success) {
          setTrends(response.data || []);
        }
      }

      // Load stats
      const statsResponse = await apiService.getTrendStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      setError('Failed to load trends data');
      console.error('Error loading trends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadTrendsData();
  };

  // Transform trends data for display
  const transformedTrends = trends.map(trend => ({
    topic: trend.title || trend.topic || 'Untitled',
    platform: trend.platform || 'unknown',
    likes: trend.likes || 0,
    dislikes: trend.dislikes || 0,
    shares: trend.shares || 0,
    comments: trend.comments || 0,
    sentiment: trend.sentiment || 'neutral',
    trend: trend.engagement_score > 100 ? 'rising' : trend.engagement_score > 50 ? 'stable' : 'falling',
    relevanceScore: Math.min(Math.round((trend.engagement_score || 0) / 10), 100),
    tags: trend.tags || [],
    platformColor: getPlatformColor(trend.platform),
    url: trend.url,
    created_at: trend.created_at
  }));

  const getPlatformColor = (platform: string) => {
    const colors = {
      'youtube': '#FF0000',
      'reddit': '#FF4500',
      'twitter': '#1DA1F2',
      'instagram': '#E4405F',
      'google': '#4285F4'
    };
    return colors[platform as keyof typeof colors] || '#6B7280';
  };

  const userInterests = user?.interests?.map((interest: string, index: number) => ({
    name: interest,
    count: Math.floor(Math.random() * 200) + 50,
    color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 5]
  })) || [
    { name: "AI & Machine Learning", count: 245, color: "#8B5CF6" },
    { name: "Web Development", count: 189, color: "#3B82F6" },
    { name: "Climate & Environment", count: 156, color: "#10B981" },
    { name: "Space & Science", count: 134, color: "#F59E0B" },
    { name: "Cryptocurrency", count: 98, color: "#EF4444" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2">Your Personalized Dashboard</h1>
          <p className="text-xl text-slate-300">
            Discover trends tailored to your interests
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: "Trends Tracked", 
              value: stats?.total_trends?.toString() || trends.length.toString(), 
              icon: Sparkles, 
              color: "blue" 
            },
            { 
              label: "Active Topics", 
              value: transformedTrends.filter(t => t.trend === 'rising').length.toString(), 
              icon: Star, 
              color: "purple" 
            },
            { 
              label: "Updates Today", 
              value: transformedTrends.filter(t => {
                const today = new Date().toDateString();
                const trendDate = new Date(t.created_at).toDateString();
                return today === trendDate;
              }).length.toString(), 
              icon: Clock, 
              color: "green" 
            },
            { 
              label: "Avg Engagement", 
              value: stats?.average_engagement ? `${Math.round(stats.average_engagement)}` : "0", 
              icon: Filter, 
              color: "pink" 
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  <span className="text-2xl text-white">{stat.value}</span>
                </div>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends Feed */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-800/50 border border-slate-700">
                  <TabsTrigger value="foryou">For You</TabsTrigger>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="following">Following</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-slate-400">Loading trends...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="foryou" className="space-y-4">
                  {transformedTrends.map((trend, index) => (
                    <TrendCard key={index} {...trend} />
                  ))}
                </TabsContent>

                <TabsContent value="trending" className="space-y-4">
                  {transformedTrends
                    .filter((t) => t.trend === "rising")
                    .map((trend, index) => (
                      <TrendCard key={index} {...trend} />
                    ))}
                </TabsContent>

                <TabsContent value="following" className="space-y-4">
                  <div className="text-center py-12 text-slate-400">
                    <p>Follow topics to see them here</p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Interests */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-white mb-4">Your Interests</h3>
              <div className="space-y-3">
                {userInterests.map((interest, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{interest.name}</span>
                      <span className="text-xs text-slate-400">{interest.count}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: interest.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(interest.count / 245) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-slate-600 text-slate-300">
                Manage Interests
              </Button>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-600 text-slate-300"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Discover New Topics
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-600 text-slate-300"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Refine Preferences
                </Button>
              </div>
            </Card>

            {/* Platform Distribution */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-white mb-4">Platform Distribution</h3>
              <div className="space-y-2">
                {[
                  { name: "YouTube", percentage: 35, color: "#FF0000" },
                  { name: "Twitter", percentage: 28, color: "#1DA1F2" },
                  { name: "Reddit", percentage: 22, color: "#FF4500" },
                  { name: "Google", percentage: 15, color: "#4285F4" },
                ].map((platform, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="text-slate-300">{platform.name}</span>
                      <span className="text-slate-400">{platform.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full"
                        style={{ backgroundColor: platform.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${platform.percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
