import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Database, Brain, TrendingUp, Users, Cpu, BarChart3 } from "lucide-react";

export function About() {
  const features = [
    {
      icon: Database,
      title: "Multi-Dimensional Data Warehouse",
      description:
        "Star/snowflake schema design efficiently stores and queries social media trend data across time, platform, location, and content dimensions.",
    },
    {
      icon: Brain,
      title: "Advanced Pattern Mining",
      description:
        "Apriori, FP-Growth, and Sequential Pattern Mining algorithms discover frequent itemsets, association rules, and temporal patterns.",
    },
    {
      icon: TrendingUp,
      title: "Trend Lifecycle Analysis",
      description:
        "Track trends through their lifecycle stages: emerging, growing, peak, declining, and dormant with predictive capabilities.",
    },
    {
      icon: Users,
      title: "Personalized Recommendations",
      description:
        "Build user interest profiles to rank and filter trends according to individual relevance with cross-interest pattern discovery.",
    },
    {
      icon: Cpu,
      title: "Sentiment Analysis",
      description:
        "Understand public perception and emotional response to topics with automated sentiment classification.",
    },
    {
      icon: BarChart3,
      title: "Interactive Visualizations",
      description:
        "Real-time dashboards, network graphs, timeline visualizations with drill-down capabilities for detailed exploration.",
    },
  ];

  const technologies = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Language" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Motion", category: "Animation" },
    { name: "Recharts", category: "Visualization" },
    { name: "Python", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "scikit-learn", category: "ML" },
  ];

  const platforms = [
    { name: "Twitter/X", color: "#1DA1F2" },
    { name: "YouTube", color: "#FF0000" },
    { name: "Reddit", color: "#FF4500" },
    { name: "Google Trends", color: "#4285F4" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-4">About TrendMiner</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            A comprehensive social media trend analysis and pattern mining system that combines
            data warehousing, machine learning, and interactive visualizations
          </p>
        </motion.div>

        {/* Overview */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 p-8">
            <h2 className="text-white mb-4">Project Overview</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              In today's digital landscape, social media platforms generate massive volumes of data
              every second. TrendMiner addresses the critical need for an intelligent system that
              can aggregate multi-platform social media data, discover hidden patterns in trending
              content, and provide personalized insights through advanced data mining algorithms.
            </p>
            <p className="text-slate-300 leading-relaxed">
              By combining robust backend architecture with an engaging frontend experience, this
              project bridges the gap between academic data mining concepts and practical,
              user-friendly applications.
            </p>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <div className="mb-16">
          <motion.h2
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Key Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-800/50 border-slate-700 p-6 h-full hover:border-indigo-500/50 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technologies */}
        <div className="mb-16">
          <motion.h2
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Technologies Used
          </motion.h2>
          <Card className="bg-slate-800/50 border-slate-700 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {technologies.map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="bg-slate-700/30 rounded-lg p-4 text-center"
                >
                  <div className="text-white mb-1">{tech.name}</div>
                  <div className="text-xs text-slate-400">{tech.category}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Data Sources */}
        <div className="mb-16">
          <motion.h2
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Data Sources
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((platform, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className="bg-slate-800/50 border-slate-700 p-6 text-center hover:border-slate-600 transition-colors"
                  style={{ borderColor: platform.color + "40" }}
                >
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: platform.color + "20" }}
                  >
                    <div className="text-2xl" style={{ color: platform.color }}>
                      {platform.name[0]}
                    </div>
                  </div>
                  <h3 className="text-white">{platform.name}</h3>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="bg-slate-800/50 border-slate-700 p-8">
            <h2 className="text-white mb-6">Project Objectives</h2>
            <div className="space-y-4">
              {[
                "Design and implement a multi-dimensional data warehouse with optimized schema",
                "Develop ETL pipeline for extracting, transforming, and loading social media data",
                "Apply pattern mining algorithms to discover frequent itemsets and association rules",
                "Implement personalized recommendation engine based on user interests",
                "Perform sentiment analysis on trending content",
                "Create interactive visualizations for exploring trends and patterns",
              ].map((objective, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                  </div>
                  <p className="text-slate-300">{objective}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
