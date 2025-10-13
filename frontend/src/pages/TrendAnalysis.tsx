import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function TrendAnalysis() {
  const timeSeriesData = [
    { date: "Jan 1", ai: 4200, webdev: 3100, crypto: 5600, climate: 2800 },
    { date: "Jan 8", ai: 5100, webdev: 3400, crypto: 4900, climate: 3200 },
    { date: "Jan 15", ai: 6800, webdev: 3800, crypto: 4200, climate: 3600 },
    { date: "Jan 22", ai: 8900, webdev: 4200, crypto: 3800, climate: 4100 },
    { date: "Jan 29", ai: 12400, webdev: 4800, crypto: 3200, climate: 4800 },
    { date: "Feb 5", ai: 15600, webdev: 5400, crypto: 2900, climate: 5600 },
    { date: "Feb 12", ai: 19200, webdev: 6100, crypto: 2600, climate: 6800 },
    { date: "Feb 19", ai: 23400, webdev: 6800, crypto: 2400, climate: 8200 },
  ];

  const lifecycleData = [
    { stage: "Emerging", count: 45, percentage: 18 },
    { stage: "Growing", count: 89, percentage: 36 },
    { stage: "Peak", count: 34, percentage: 14 },
    { stage: "Declining", count: 56, percentage: 22 },
    { stage: "Dormant", count: 26, percentage: 10 },
  ];

  const platformComparison = [
    { platform: "YouTube", engagement: 8900, growth: 23, sentiment: 78 },
    { platform: "Twitter", engagement: 12400, growth: 18, sentiment: 65 },
    { platform: "Reddit", engagement: 6700, growth: 31, sentiment: 82 },
    { platform: "Google", engagement: 5600, growth: 15, sentiment: 71 },
  ];

  const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];

  const trendingTopics = [
    {
      topic: "AI Image Generation",
      lifecycle: "Growing",
      velocity: "+245%",
      peak: "Expected in 2-3 weeks",
      color: "#3B82F6",
    },
    {
      topic: "Web3 Integration",
      lifecycle: "Peak",
      velocity: "+12%",
      peak: "Currently at peak",
      color: "#8B5CF6",
    },
    {
      topic: "Cryptocurrency",
      lifecycle: "Declining",
      velocity: "-34%",
      peak: "Peaked 2 weeks ago",
      color: "#EF4444",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2">Trend Analysis</h1>
          <p className="text-xl text-slate-300">
            Track temporal patterns and trend lifecycle evolution
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Trends", value: "247", change: "+12%", icon: Activity, up: true },
            { label: "Peak This Week", value: "34", change: "+8%", icon: TrendingUp, up: true },
            { label: "Emerging Trends", value: "45", change: "+23%", icon: TrendingUp, up: true },
            { label: "Declining", value: "56", change: "-15%", icon: TrendingDown, up: false },
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className={`w-5 h-5 ${metric.up ? "text-green-400" : "text-red-400"}`} />
                  <span className={`text-sm ${metric.up ? "text-green-400" : "text-red-400"}`}>
                    {metric.change}
                  </span>
                </div>
                <div className="text-2xl text-white mb-1">{metric.value}</div>
                <div className="text-sm text-slate-400">{metric.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
            <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle Stages</TabsTrigger>
            <TabsTrigger value="platforms">Platform Comparison</TabsTrigger>
          </TabsList>

          {/* Timeline Analysis */}
          <TabsContent value="timeline">
            <div className="space-y-6">
              {/* Time Series Chart */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white mb-6">Trend Evolution Over Time</h3>
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
                    <Card className="bg-slate-800/50 border-slate-700 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-white mb-2">{trend.topic}</h3>
                          <Badge
                            className="text-xs"
                            style={{ backgroundColor: trend.color + "40", color: trend.color }}
                          >
                            {trend.lifecycle}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl ${trend.velocity.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                            {trend.velocity}
                          </div>
                          <div className="text-xs text-slate-400">velocity</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
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
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white mb-6">Trend Lifecycle Distribution</h3>
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
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white mb-6">Stage Details</h3>
                <div className="space-y-4">
                  {lifecycleData.map((stage, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="text-white">{stage.stage}</span>
                        </div>
                        <span className="text-slate-400">{stage.count} trends</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
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
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white mb-6">Platform Performance Comparison</h3>
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
                    <Card className="bg-slate-800/50 border-slate-700 p-6">
                      <h3 className="text-white mb-4">{platform.platform}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-slate-400 text-sm mb-1">Engagement</div>
                          <div className="text-xl text-white">{(platform.engagement / 1000).toFixed(1)}K</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-sm mb-1">Growth</div>
                          <div className="text-xl text-green-400">+{platform.growth}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-sm mb-1">Sentiment</div>
                          <div className="text-xl text-white">{platform.sentiment}%</div>
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
