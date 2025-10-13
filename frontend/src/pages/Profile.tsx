import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { User, Settings, Bell, Database, Plus, X } from "lucide-react";
import { useState } from "react";

export function Profile() {
  const [interests, setInterests] = useState([
    "Artificial Intelligence",
    "Web Development",
    "Climate Change",
    "Space Exploration",
    "Cryptocurrency",
    "Machine Learning",
  ]);

  const [newInterest, setNewInterest] = useState("");

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const platforms = [
    { name: "Twitter", enabled: true, username: "@yourhandle" },
    { name: "YouTube", enabled: true, username: "Your Channel" },
    { name: "Reddit", enabled: false, username: "" },
    { name: "Google Trends", enabled: true, username: "" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2">Profile & Settings</h1>
          <p className="text-xl text-slate-300">
            Manage your preferences and personalize your experience
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 p-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-white mb-1">TrendMiner User</h2>
                <p className="text-slate-400 mb-4">user@trendminer.com</p>
                <div className="flex gap-4">
                  <div>
                    <div className="text-2xl text-white">247</div>
                    <div className="text-sm text-slate-400">Trends Tracked</div>
                  </div>
                  <div className="border-l border-slate-700 pl-4">
                    <div className="text-2xl text-white">89</div>
                    <div className="text-sm text-slate-400">Interests</div>
                  </div>
                  <div className="border-l border-slate-700 pl-4">
                    <div className="text-2xl text-white">1,234</div>
                    <div className="text-sm text-slate-400">Interactions</div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="border-slate-600 text-slate-300">
                Edit Profile
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs defaultValue="interests" className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Interests Tab */}
          <TabsContent value="interests">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-white mb-4">Your Interests</h3>
              <p className="text-slate-400 mb-6">
                Add topics you're interested in to get personalized trend recommendations
              </p>

              {/* Add Interest */}
              <div className="flex gap-2 mb-6">
                <Input
                  type="text"
                  placeholder="Add a new interest..."
                  className="bg-slate-900/50 border-slate-600 text-white"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addInterest()}
                />
                <Button
                  onClick={addInterest}
                  className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Interests List */}
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 pl-3 pr-2 py-2 text-sm">
                      {interest}
                      <button
                        onClick={() => removeInterest(interest)}
                        className="ml-2 hover:text-violet-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-white mb-4">Connected Platforms</h3>
              <p className="text-slate-400 mb-6">
                Manage which social media platforms to aggregate data from
              </p>

              <div className="space-y-4">
                {platforms.map((platform, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Switch checked={platform.enabled} />
                      <div>
                        <div className="text-white">{platform.name}</div>
                        {platform.username && (
                          <div className="text-sm text-slate-400">{platform.username}</div>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                      {platform.enabled ? "Configure" : "Connect"}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-white mb-4">Notification Preferences</h3>
              <p className="text-slate-400 mb-6">
                Choose what updates you want to receive
              </p>

              <div className="space-y-4">
                {[
                  { label: "New trending topics in your interests", enabled: true },
                  { label: "Pattern mining discoveries", enabled: true },
                  { label: "Weekly trend summary", enabled: false },
                  { label: "Breaking trends alerts", enabled: true },
                  { label: "New posts from followed topics", enabled: false },
                ].map((notification, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Bell className="w-5 h-5 text-slate-400" />
                      <span className="text-white">{notification.label}</span>
                    </div>
                    <Switch checked={notification.enabled} />
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white mb-4">Display Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="relevance" className="text-slate-300 mb-2 block">
                      Minimum Relevance Score
                    </Label>
                    <Input
                      id="relevance"
                      type="number"
                      defaultValue="70"
                      className="bg-slate-900/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="posts" className="text-slate-300 mb-2 block">
                      Posts per page
                    </Label>
                    <Input
                      id="posts"
                      type="number"
                      defaultValue="10"
                      className="bg-slate-900/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white mb-4">Data & Privacy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Database className="w-5 h-5 text-slate-400" />
                      <span className="text-white">Allow data collection for personalization</span>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                    Export My Data
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-600 text-red-400 hover:bg-red-500/10"
                  >
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
