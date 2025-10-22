import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Network, GitBranch, TrendingUp, ArrowRight } from "lucide-react";
import { Progress } from "../components/ui/progress";
import { useState, useEffect } from "react";
import { fetchPatternMiningData } from "../services/api";
import type { PatternMiningData } from "../services/api";

export function PatternMining() {
  const [selectedRule, setSelectedRule] = useState<number | null>(null);
  const [patternData, setPatternData] = useState<PatternMiningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatternData = async () => {
      try {
        setLoading(true);
        const data = await fetchPatternMiningData();
        setPatternData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pattern mining data');
      } finally {
        setLoading(false);
      }
    };

    loadPatternData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pattern mining data...</p>
        </div>
      </div>
    );
  }

  if (error || !patternData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl text-slate-900 mb-2">Error Loading Pattern Data</h2>
          <p className="text-slate-600 mb-4">{error || 'No pattern data available'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const { kpis, association_rules, frequent_itemsets, sequential_patterns } = patternData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      {/* Colorful background elements */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-400 opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-violet-400 to-purple-400 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br from-blue-400 to-cyan-400 opacity-15 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2 text-slate-900">Pattern Mining</h1>
          <p className="text-xl text-slate-600">
            Discover hidden relationships and patterns in trending topics
          </p>
        </motion.div>

        {/* Algorithm Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Apriori Algorithm", value: `${kpis.rules.toLocaleString()} Rules`, icon: Network },
            { label: "FP-Growth", value: `${kpis.itemsets.toLocaleString()} Itemsets`, icon: GitBranch },
            { label: "Sequential Mining", value: `${kpis.patterns.toLocaleString()} Patterns`, icon: TrendingUp },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 p-6 hover:border-purple-400 hover:shadow-xl transition-all shadow-lg group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-400 opacity-30 blur-xl rounded-xl" />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-sm text-slate-600">{stat.label}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="association" className="w-full">
          <TabsList className="bg-white border border-slate-200 mb-6">
            <TabsTrigger value="association">Association Rules</TabsTrigger>
            <TabsTrigger value="frequent">Frequent Itemsets</TabsTrigger>
            <TabsTrigger value="sequential">Sequential Patterns</TabsTrigger>
          </TabsList>

          {/* Association Rules */}
          <TabsContent value="association">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rules List */}
              <div className="space-y-4">
                {association_rules.map((rule, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedRule(index)}
                  >
                    <Card
                      className={`bg-white border-slate-200 p-6 cursor-pointer transition-all hover:border-purple-400 shadow-md ${
                        selectedRule === index ? "border-purple-500 shadow-lg" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex flex-wrap gap-2">
                          {rule.antecedent.map((item, i) => (
                            <Badge
                              key={i}
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                        <ArrowRight className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          {rule.consequent.map((item, i) => (
                            <Badge
                              key={i}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500 mb-1">Lift</div>
                          <div className="text-slate-900 text-lg font-semibold">{rule.lift.toFixed(1)}x</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Rule Details */}
              <div className="sticky top-24">
                <Card className="bg-white border-slate-200 p-6 shadow-md">
                  {selectedRule !== null ? (
                    <>
                      <h3 className="text-slate-900 mb-4">Rule Details</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-slate-600 mb-2">Lift</div>
                          <div className="text-3xl text-slate-900 mb-1">
                            {association_rules[selectedRule].lift.toFixed(2)}x
                          </div>
                          <div className="text-xs text-slate-500">
                            {association_rules[selectedRule].lift > 1
                              ? "Strong positive correlation"
                              : "Weak or negative correlation"}
                          </div>
                        </div>

                        {association_rules[selectedRule].platforms && (
                          <div>
                            <div className="text-sm text-slate-600 mb-2">Active Platforms</div>
                            <div className="flex gap-2">
                              {association_rules[selectedRule].platforms.map((platform, i) => (
                                <Badge key={i} variant="outline" className="border-slate-300">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-200">
                          <div className="text-sm text-slate-700">
                            <strong>Interpretation:</strong> When users engage with content about{" "}
                            {association_rules[selectedRule].antecedent.join(" and ")}, they are{" "}
                            {association_rules[selectedRule].lift.toFixed(1)}x more likely to also
                            engage with content about{" "}
                            {association_rules[selectedRule].consequent.join(" and ")}.
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a rule to view details</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Frequent Itemsets */}
          <TabsContent value="frequent">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frequent_itemsets.map((itemset, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white border-slate-200 p-6 hover:border-purple-300 transition-colors shadow-md">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {itemset.items.map((item, i) => (
                        <Badge
                          key={i}
                          className="bg-gradient-to-r from-purple-400 to-pink-400 text-white border-0 shadow-md hover:shadow-lg transition-shadow"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Support</span>
                        <span className="text-slate-900">{(itemset.support * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={itemset.support * 100} className="h-2" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Sequential Patterns */}
          <TabsContent value="sequential">
            <div className="space-y-4">
              {sequential_patterns.map((pattern, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white border-slate-200 p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-900">Pattern {index + 1}</h3>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        {pattern.avgDuration}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      {pattern.sequence.map((step, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-lg px-4 py-3 text-center">
                              <div className="text-sm text-purple-700">{step}</div>
                            </div>
                          </div>
                          {i < pattern.sequence.length - 1 && (
                            <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Support: {(pattern.support * 100).toFixed(1)}%</span>
                      <span className="text-slate-600">
                        Found in {pattern.count} trend sequences
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
