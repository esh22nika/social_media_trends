import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useState, useEffect } from "react";
import { fetchTrendAnalysis } from "../services/api";
import type { TrendAnalysisData } from "../services/api";

export function TrendAnalysis() {
  const [analysisData, setAnalysisData] = useState<TrendAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setLoading(true);
        const data = await fetchTrendAnalysis();
        setAnalysisData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trend analysis data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trend analysis data...</p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl text-slate-900 mb-2">Error Loading Trend Analysis</h2>
          <p className="text-slate-600 mb-4">{error || 'No trend analysis data available'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const { kpis, timeline } = analysisData;

  // Mock data for charts (since timeline data structure may vary)
  const timeSeriesData = timeline.slice(0, 8).map((item, index) => ({
    date: `Week ${index + 1}`,
    ai: Math.random() * 10000 + 4000,
    webdev: Math.random() * 8000 + 3000,
    crypto: Math.random() * 6000 + 2000,
    climate: Math.random() * 5000 + 2000,
  }));

  const lifecycleData = [
    { stage: "Emerging", count: kpis.emergingTrends, percentage: Math.round((kpis.emergingTrends / kpis.activeTrends) * 100) },
    { stage: "Peak", count: kpis.peakThisWeek, percentage: Math.round((kpis.peakThisWeek / kpis.activeTrends) * 100) },
    { stage: "Declining", count: kpis.declining, percentage: Math.round((kpis.declining / kpis.activeTrends) * 100) },
  ];

  const platformComparison = [
    { platform: "YouTube", engagement: Math.random() * 15000 + 5000, growth: 23, sentiment: 78 },
    { platform: "Reddit", engagement: Math.random() * 12000 + 4000, growth: 31, sentiment: 82 },
    { platform: "Bluesky", engagement: Math.random() * 8000 + 3000, growth: 45, sentiment: 85 },
  ];

  const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];

  const trendingTopics = [
    {
      topic: "AI & Machine Learning",
      lifecycle: "Growing",
      velocity: "+245%",
      peak: "Expected in 2-3 weeks",
      color: "#3B82F6",
    },
    {
      topic: "Web Development",
      lifecycle: "Peak",
      velocity: "+12%",
      peak: "Currently at peak",
      color: "#8B5CF6",
    },
    {
      topic: "Climate Tech",
      lifecycle: "Emerging",
      velocity: "+189%",
      peak: "Expected in 4-6 weeks",
      color: "#10B981",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Vibrant background orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-400 to-blue-400 opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-pink-400 to-rose-400 opacity-20 rounded-full blur-3xl animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2 text-slate-900">Trend Analysis</h1>
          <p className="text-xl text-slate-600">
            Track temporal patterns and trend lifecycle evolution
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Trends", value: kpis.activeTrends.toString(), change: "+12%", icon: Activity, up: true },
            { label: "Peak This Week", value: kpis.peakThisWeek.toString(), change: "+8%", icon: TrendingUp, up: true },
            { label: "Emerging Trends", value: kpis.emergingTrends.toString(), change: "+23%", icon: TrendingUp, up: true },
            { label: "Declining", value: kpis.declining.toString(), change: "-15%", icon: TrendingDown, up: false },
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gradient-to-br ${metric.up ? "from-white to-green-50" : "from-white to-red-50"} border-2 p-6 shadow-lg hover:shadow-xl transition-all group`} style={{
                borderColor: metric.up ? "#10B98140" : "#EF444440"
              }}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${metric.up ? "bg-gradient-to-br from-green-400 to-emerald-500" : "bg-gradient-to-br from-red-400 to-rose-500"} shadow-md group-hover:scale-110 transition-transform`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-full ${metric.up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {metric.change}
                  </span>
                </div>
                <div className={`text-2xl mb-1 bg-gradient-to-r ${metric.up ? "from-green-600 to-emerald-600" : "from-red-600 to-rose-600"} bg-clip-text text-transparent`}>{metric.value}</div>
                <div className="text-sm text-slate-600">{metric.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="bg-white border border-slate-200 mb-6">
            <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle Stages</TabsTrigger>
            <TabsTrigger value="platforms">Platform Comparison</TabsTrigger>
          </TabsList>

          {/* Timeline Analysis */}
          <TabsContent value="timeline">
            <div className="space-y-6">
              {/* Time Series Chart */}
              <Card className="bg-white border-slate-200 p-6 shadow-md">
                <h3 className="text-slate-900 mb-6">Trend Evolution Over Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorWebdev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClimate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="ai"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorAi)"
                      name="AI & ML"
                    />
                    <Area
                      type="monotone"
                      dataKey="webdev"
                      stroke="#8B5CF6"
                      fillOpacity={1}
                      fill="url(#colorWebdev)"
                      name="Web Development"
                    />
                    <Area
                      type="monotone"
                      dataKey="crypto"
                      stroke="#EC4899"
                      fillOpacity={1}
                      fill="url(#colorCrypto)"
                      name="Cryptocurrency"
                    />
                    <Area
                      type="monotone"
                      dataKey="climate"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorClimate)"
                      name="Climate Tech"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Trend Velocity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trendingTopics.map((trend, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white border-slate-200 p-6 shadow-md">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-slate-900 mb-2">{trend.topic}</h3>
                          <Badge
                            className="text-xs"
                            style={{ backgroundColor: trend.color + "20", color: trend.color }}
                          >
                            {trend.lifecycle}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl ${trend.velocity.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                            {trend.velocity}
                          </div>
                          <div className="text-xs text-slate-600">velocity</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{trend.peak}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Lifecycle Stages */}
          <TabsContent value="lifecycle">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card className="bg-white border-slate-200 p-6 shadow-md">
                <h3 className="text-slate-900 mb-6">Trend Lifecycle Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={lifecycleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {lifecycleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Lifecycle Details */}
              <Card className="bg-white border-slate-200 p-6 shadow-md">
                <h3 className="text-slate-900 mb-6">Stage Details</h3>
                <div className="space-y-4">
                  {lifecycleData.map((stage, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="text-slate-900">{stage.stage}</span>
                        </div>
                        <span className="text-slate-600">{stage.count} trends</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full"
                          style={{ backgroundColor: COLORS[index] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Platform Comparison */}
          <TabsContent value="platforms">
            <div className="space-y-6">
              {/* Bar Chart */}
              <Card className="bg-white border-slate-200 p-6 shadow-md">
                <h3 className="text-slate-900 mb-6">Platform Performance Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={platformComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="platform" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="engagement" fill="#3B82F6" name="Engagement" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="growth" fill="#8B5CF6" name="Growth %" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="sentiment" fill="#10B981" name="Sentiment %" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Platform Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformComparison.map((platform, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white border-slate-200 p-6 shadow-md">
                      <h3 className="text-slate-900 mb-4">{platform.platform}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-slate-600 text-sm mb-1">Engagement</div>
                          <div className="text-xl text-slate-900">{(platform.engagement / 1000).toFixed(1)}K</div>
                        </div>
                        <div>
                          <div className="text-slate-600 text-sm mb-1">Growth</div>
                          <div className="text-xl text-green-600">+{platform.growth}%</div>
                        </div>
                        <div>
                          <div className="text-slate-600 text-sm mb-1">Sentiment</div>
                          <div className="text-xl text-slate-900">{platform.sentiment}%</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
