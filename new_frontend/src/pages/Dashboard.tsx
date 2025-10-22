import { motion } from "motion/react";
import { TrendCard } from "../components/TrendCard";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Sparkles, Clock, Star, Filter } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import { fetchDashboardData, getUserInterests, updateUserInterests, PLATFORM_CONFIG } from "../services/api";
import type { DashboardData, TrendData, InterestsData } from "../services/api";

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl text-slate-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600 mb-4">{error || 'No data available'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const { kpis, recommendations, trending, userInterests: interestCounts, currentInterests } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-yellow-300 to-orange-300 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 opacity-20 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2 text-slate-900">Your Personalized Dashboard</h1>
          <p className="text-xl text-slate-600">
            Discover trends tailored to your interests
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Trends Tracked", value: kpis.trendsTracked.toLocaleString(), icon: Sparkles, color: "blue" },
            { label: "Active Topics", value: kpis.activeTopics.toLocaleString(), icon: Star, color: "purple" },
            { label: "Updates Today", value: kpis.updatesToday.toLocaleString(), icon: Clock, color: "green" },
            { label: "Relevance Score", value: `${kpis.relevanceScore}%`, icon: Filter, color: "pink" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-slate-50 border-2 p-6 shadow-lg hover:shadow-xl transition-all group" style={{
                borderColor: `var(--${stat.color}-400)`
              }}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br from-${stat.color}-400 to-${stat.color}-500 shadow-md`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-2xl bg-gradient-to-br from-${stat.color}-600 to-${stat.color}-500 bg-clip-text text-transparent`}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends Feed */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="foryou" className="w-full">
              <TabsList className="bg-white border border-slate-200 mb-6">
                <TabsTrigger value="foryou">For You</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>

              <TabsContent value="foryou" className="space-y-4">
                {recommendations.map((trend, index) => (
                  <TrendCard key={trend.id} {...trend} />
                ))}
              </TabsContent>

              <TabsContent value="trending" className="space-y-4">
                {trending.map((trend, index) => (
                  <TrendCard key={trend.id} {...trend} />
                ))}
              </TabsContent>

              <TabsContent value="following" className="space-y-4">
                <div className="text-center py-12 text-slate-500">
                  <p>Follow topics to see them here</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Interests */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Your Interests</h3>
              <div className="space-y-3">
                {Object.entries(interestCounts).map(([interest, count], index) => {
                  const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
                  const color = colors[index % colors.length];
                  const maxCount = Math.max(...Object.values(interestCounts));
                  
                  return (
                    <motion.div
                      key={interest}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700">{interest}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full text-white shadow-sm" style={{ backgroundColor: color }}>
                          {count}
                        </span>
                      </div>
                      <div className="h-2 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          className="h-full rounded-full shadow-sm"
                          style={{ 
                            background: `linear-gradient(90deg, ${color}, ${color}dd)`
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxCount) * 100}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <Button variant="outline" className="w-full mt-4 border-slate-300 text-slate-700">
                Manage Interests
              </Button>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-300 text-slate-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Discover New Topics
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-300 text-slate-700"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Refine Preferences
                </Button>
              </div>
            </Card>

            {/* Platform Distribution */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Platform Distribution</h3>
              <div className="space-y-2">
                {Object.entries(PLATFORM_CONFIG).map(([platformKey, config], index) => {
                  // Calculate percentage based on platform data from trends
                  const platformTrends = recommendations.filter(t => t.platform === platformKey).length;
                  const totalTrends = recommendations.length;
                  const percentage = totalTrends > 0 ? Math.round((platformTrends / totalTrends) * 100) : 0;
                  
                  return (
                    <div key={platformKey}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="text-slate-700">{config.name}</span>
                        <span className="text-slate-500">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full"
                          style={{ backgroundColor: config.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
