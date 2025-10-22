import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Search, Youtube, ExternalLink, ThumbsUp, Share2, MessageCircle, Filter, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { fetchTopicExplorer, PLATFORM_CONFIG } from "../services/api";
import type { TopicExplorerData, TrendData } from "../services/api";

export function TopicExplorer() {
  const [searchQuery, setSearchQuery] = useState("AI");
  const [explorerData, setExplorerData] = useState<TopicExplorerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExplorerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTopicExplorer(searchQuery);
        setExplorerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load explorer data');
      } finally {
        setLoading(false);
      }
    };

    loadExplorerData();
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Trigger re-search when button is clicked
      const loadExplorerData = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await fetchTopicExplorer(searchQuery);
          setExplorerData(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load explorer data');
        } finally {
          setLoading(false);
        }
      };
      loadExplorerData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Colorful accents */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-cyan-400 to-blue-400 opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-400 opacity-15 rounded-full blur-3xl animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2 text-slate-900">Topic Explorer</h1>
          <p className="text-xl text-slate-600">
            Drill down into specific trends and discover detailed insights
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white border-slate-200 p-6 shadow-md">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search topics, hashtags, or keywords..."
                  className="pl-10 bg-white border-slate-300 text-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 shadow-md"
                onClick={handleSearch}
                disabled={loading}
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button variant="outline" className="border-slate-300 text-slate-700">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Feed */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-white border border-slate-200 mb-4">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="youtube">YouTube</TabsTrigger>
                <TabsTrigger value="reddit">Reddit</TabsTrigger>
                <TabsTrigger value="bluesky">Bluesky</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading posts...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">Error: {error}</p>
                  </div>
                ) : explorerData?.feed ? (
                  explorerData.feed.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-white border-slate-200 hover:border-slate-300 transition-colors overflow-hidden shadow-md hover:shadow-lg">
                        <div className="p-6">
                          {/* Post Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG]?.color + "20" }}
                              >
                                <span style={{ color: PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG]?.color }}>
                                  {PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG]?.icon}
                                </span>
                              </div>
                              <div>
                                <div className="text-slate-900">{post.author}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-0 px-0"
                                    style={{ color: PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG]?.color }}
                                  >
                                    {PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG]?.name}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Calendar className="w-4 h-4" />
                              {new Date(post.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Post Content */}
                          <p className="text-slate-700 mb-4">{post.topic}</p>

                          {/* Tags */}
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Engagement Metrics */}
                          <div className="flex items-center gap-6 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{post.likes.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Share2 className="w-4 h-4" />
                              <span>{post.shares.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments.toLocaleString()}</span>
                            </div>
                            {post.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto text-slate-600 hover:text-slate-900"
                                onClick={() => window.open(post.url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Original
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600">No posts found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="youtube" className="space-y-4">
                {explorerData?.feed
                  .filter((p) => p.platform === "youtube")
                  .map((post, index) => (
                    <Card key={post.id} className="bg-white border-slate-200 p-6 shadow-md">
                      <p className="text-slate-700">{post.topic}</p>
                      <p className="text-sm text-slate-500 mt-2">by {post.author}</p>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="reddit" className="space-y-4">
                {explorerData?.feed
                  .filter((p) => p.platform === "reddit")
                  .map((post, index) => (
                    <Card key={post.id} className="bg-white border-slate-200 p-6 shadow-md">
                      <p className="text-slate-700">{post.topic}</p>
                      <p className="text-sm text-slate-500 mt-2">by {post.author}</p>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="bluesky" className="space-y-4">
                {explorerData?.feed
                  .filter((p) => p.platform === "bluesky")
                  .map((post, index) => (
                    <Card key={post.id} className="bg-white border-slate-200 p-6 shadow-md">
                      <p className="text-slate-700">{post.topic}</p>
                      <p className="text-sm text-slate-500 mt-2">by {post.author}</p>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Topics */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Related Topics</h3>
              <div className="space-y-3">
                {explorerData?.relatedTopics ? Object.entries(explorerData.relatedTopics).map(([topic, count], index) => (
                  <motion.div
                    key={topic}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{topic}</span>
                      <span className="text-xs text-slate-500">{count} posts</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((count / Math.max(...Object.values(explorerData.relatedTopics))) * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
                      />
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-slate-500 text-sm">No related topics found</p>
                )}
              </div>
            </Card>

            {/* Top Contributors */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Top Contributors</h3>
              <div className="space-y-3">
                {explorerData?.topContributors ? Object.entries(explorerData.topContributors).map(([contributor, posts], index) => (
                  <motion.div
                    key={contributor}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-slate-900">{contributor}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-cyan-600">{posts} posts</div>
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-slate-500 text-sm">No contributors found</p>
                )}
              </div>
            </Card>

            {/* Trending Hashtags */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Trending Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: "#AI", color: "from-blue-400 to-cyan-400" },
                  { tag: "#MachineLearning", color: "from-purple-400 to-pink-400" },
                  { tag: "#TechNews", color: "from-orange-400 to-red-400" },
                  { tag: "#Innovation", color: "from-green-400 to-emerald-400" },
                  { tag: "#DataScience", color: "from-indigo-400 to-blue-400" },
                  { tag: "#Python", color: "from-yellow-400 to-orange-400" }
                ].map((item, index) => (
                    <Badge
                      key={index}
                      className={`bg-gradient-to-r ${item.color} text-white border-0 cursor-pointer hover:shadow-lg transition-all shadow-md`}
                    >
                      {item.tag}
                    </Badge>
                  )
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
