import { motion } from "motion/react";
import { NetworkGraph } from "../components/NetworkGraph";
import { TrendingUp, Database, Brain, Target, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

interface LandingProps {
  onNavigate: (page: string) => void;
}

export function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        {/* Hero Content */}
        <div className="relative z-10 px-8 pt-20 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full mb-6">
                  <span className="text-blue-300">Powered by AI & Data Mining</span>
                </div>
              </motion.div>

              <motion.h1
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Discover Social Media Trends
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Personalized Just For You
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-slate-300 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                An intelligent system that aggregates multi-platform social media data,
                discovers hidden patterns in trending content, and delivers personalized
                insights through advanced pattern mining and machine learning.
              </motion.p>

              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                  onClick={() => onNavigate("dashboard")}
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-800"
                  onClick={() => onNavigate("about")}
                >
                  Learn More
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Network Visualization Section */}
      <section className="relative px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4">Explore Trending Topics</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Interact with the network below. Hover over nodes to see connections
              and discover how topics co-trend across different platforms.
            </p>
          </motion.div>

          {/* Interactive Network Container */}
          <motion.div
            className="relative bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 overflow-hidden"
            style={{ height: "600px" }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <NetworkGraph />
          </motion.div>

          <motion.p
            className="text-center text-slate-400 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            💡 Hover over nodes to see connections • Click for details
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-300">
              Advanced data mining meets intuitive user experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Database,
                title: "Multi-Platform Warehousing",
                description:
                  "Aggregate data from Twitter/X, YouTube, Reddit, and Google Trends in a structured, queryable format",
                color: "blue",
              },
              {
                icon: Brain,
                title: "Pattern Mining",
                description:
                  "Discover hidden patterns using Apriori, FP-Growth, and Sequential Pattern Mining algorithms",
                color: "purple",
              },
              {
                icon: Target,
                title: "Personalized Recommendations",
                description:
                  "Get trend recommendations tailored to your interests with intelligent filtering",
                color: "pink",
              },
              {
                icon: TrendingUp,
                title: "Trend Analysis",
                description:
                  "Track trend lifecycle stages from emerging to peak to declining with temporal patterns",
                color: "cyan",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 h-full hover:border-white/20 transition-colors">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-3xl border border-white/10 p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { value: "4+", label: "Social Platforms" },
                { value: "1M+", label: "Trends Analyzed" },
                { value: "95%", label: "Pattern Accuracy" },
                { value: "24/7", label: "Real-time Updates" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-5xl mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6">Ready to Mine Your Trends?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of users discovering personalized insights from social media data
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
              onClick={() => onNavigate("dashboard")}
            >
              Start Exploring Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-8 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>© 2025 TrendMiner. Powered by advanced data mining & machine learning.</p>
        </div>
      </footer>
    </div>
  );
}
