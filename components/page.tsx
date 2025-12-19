"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Shield,
  Crown,
  Star,
  Trophy,
  Swords,
  Target,
  TrendingUp,
  Gift,
  X,
  Search,
  Plus,
  Check,
  Lock,
  Zap,
  BookOpen,
  Flame,
  UserPlus,
  Settings,
  LogOut,
  Award,
  MessageSquare,
  Bell,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

export default function GuildSystemPage() {
  const [activeTab, setActiveTab] = useState("browse");
  const [showCreateGuild, setShowCreateGuild] = useState(false);
  const [showGuildDetails, setShowGuildDetails] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [guildName, setGuildName] = useState("");
  const [guildDescription, setGuildDescription] = useState("");
  const [selectedEmblem, setSelectedEmblem] = useState(0);

  // User's current guild status
  const [userGuild, setUserGuild] = useState(null); // null if not in guild

  // Mock guild data
  const [guilds, setGuilds] = useState([
    {
      id: 1,
      name: "Shadow Monarchs",
      emblem: "👑",
      level: 45,
      members: 48,
      maxMembers: 50,
      power: 285000,
      rank: 1,
      description: "Elite hunters seeking dominance",
      masterName: "ShadowKing",
      requirements: "Level 30+",
      type: "Competitive",
      weeklyXP: 125000,
      activities: ["Daily Raids", "Guild Wars", "Dungeon Runs"],
      perks: ["10% XP Boost", "Exclusive Guild Store", "Priority Events"],
    },
    {
      id: 2,
      name: "Gate Breakers",
      emblem: "⚔️",
      level: 38,
      members: 42,
      maxMembers: 50,
      power: 198000,
      rank: 2,
      description: "Breaking gates, making history",
      masterName: "GateHunter",
      requirements: "Level 25+",
      type: "Competitive",
      weeklyXP: 98000,
      activities: ["Gate Raids", "Speed Reading"],
      perks: ["8% XP Boost", "Guild Quests"],
    },
    {
      id: 3,
      name: "Midnight Readers",
      emblem: "🌙",
      level: 32,
      members: 35,
      maxMembers: 40,
      power: 156000,
      rank: 3,
      description: "Reading under the moonlight",
      masterName: "NightOwl",
      requirements: "Level 20+",
      type: "Casual",
      weeklyXP: 75000,
      activities: ["Night Reading", "Chill Sessions"],
      perks: ["5% XP Boost", "Social Events"],
    },
    {
      id: 4,
      name: "Hunter's Paradise",
      emblem: "🏆",
      level: 28,
      members: 30,
      maxMembers: 40,
      power: 124000,
      rank: 4,
      description: "Paradise for all hunters",
      masterName: "ParadiseLeader",
      requirements: "Level 15+",
      type: "Social",
      weeklyXP: 62000,
      activities: ["Social Reading", "Events"],
      perks: ["3% XP Boost", "Weekly Events"],
    },
    {
      id: 5,
      name: "Rising Phoenix",
      emblem: "🔥",
      level: 25,
      members: 28,
      maxMembers: 35,
      power: 98000,
      rank: 5,
      description: "Rising from the ashes",
      masterName: "Phoenix",
      requirements: "Level 10+",
      type: "Casual",
      weeklyXP: 48000,
      activities: ["Casual Reading", "Fun Events"],
      perks: ["3% XP Boost"],
    },
  ]);

  // Guild War rankings
  const [guildWars, setGuildWars] = useState([
    { rank: 1, guildName: "Shadow Monarchs", score: 58400, reward: "5000 Gold + Legendary Crest" },
    { rank: 2, guildName: "Gate Breakers", score: 52100, reward: "3000 Gold + Epic Crest" },
    { rank: 3, guildName: "Midnight Readers", score: 45800, reward: "2000 Gold + Rare Crest" },
  ]);

  // Guild activities/quests
  const [guildQuests, setGuildQuests] = useState([
    {
      id: 1,
      title: "Guild Raid: Demon Castle",
      description: "Complete 500 chapters as a guild",
      progress: 342,
      total: 500,
      reward: "5000 Guild XP",
      difficulty: "S",
      timeLeft: "2d 14h",
    },
    {
      id: 2,
      title: "Weekly Reading Marathon",
      description: "Read 1000 chapters collectively",
      progress: 756,
      total: 1000,
      reward: "3000 Guild XP",
      difficulty: "A",
      timeLeft: "4d 8h",
    },
    {
      id: 3,
      title: "Guild Recruitment",
      description: "Recruit 5 new members",
      progress: 3,
      total: 5,
      reward: "2000 Guild XP",
      difficulty: "B",
      timeLeft: "6d 12h",
    },
  ]);

  // Available emblems for guild creation
  const guildEmblems = ["👑", "⚔️", "🛡️", "🔥", "⚡", "🌙", "⭐", "💎", "🏆", "🎯", "👹", "🐉", "🦅", "🐺", "🦁", "🌟"];

  const getDifficultyColor = (difficulty) => {
    const colors = {
      E: "text-gray-400",
      D: "text-green-400",
      C: "text-blue-400",
      B: "text-purple-400",
      A: "text-orange-400",
      S: "text-red-400",
      SS: "text-pink-400",
    };
    return colors[difficulty] || colors.E;
  };

  const getTypeColor = (type) => {
    const colors = {
      Competitive: "from-red-500 to-orange-500",
      Casual: "from-blue-500 to-cyan-500",
      Social: "from-purple-500 to-pink-500",
    };
    return colors[type] || colors.Casual;
  };

  const filteredGuilds = guilds.filter((guild) =>
    guild.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guild.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createGuild = () => {
    if (!guildName.trim()) return;
    
    const newGuild = {
      id: guilds.length + 1,
      name: guildName,
      emblem: guildEmblems[selectedEmblem],
      level: 1,
      members: 1,
      maxMembers: 20,
      power: 2847,
      rank: guilds.length + 1,
      description: guildDescription || "A new guild ready for adventure",
      masterName: "You",
      requirements: "Level 1+",
      type: "Casual",
      weeklyXP: 0,
      activities: ["Getting Started"],
      perks: ["Guild Chat"],
    };

    setGuilds([...guilds, newGuild]);
    setUserGuild(newGuild);
    setShowCreateGuild(false);
    setGuildName("");
    setGuildDescription("");
    setSelectedEmblem(0);
  };

  const joinGuild = (guild) => {
    setUserGuild(guild);
    setShowGuildDetails(false);
  };

  const leaveGuild = () => {
    setUserGuild(null);
  };

  const pct = (val, tot) => (tot === 0 ? 0 : Math.round((val / tot) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 blur-3xl -z-10" />
          
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Guild System
              </h1>
              <p className="text-purple-400/60 font-mono text-sm mb-2">
                UNITE | COMPETE | CONQUER
              </p>
              {userGuild && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 rounded-lg flex items-center gap-2">
                    <span className="text-2xl">{userGuild.emblem}</span>
                    <div>
                      <p className="text-xs text-purple-400/60 font-mono">YOUR GUILD</p>
                      <p className="text-sm font-bold text-white">{userGuild.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!userGuild && (
              <Button
                onClick={() => setShowCreateGuild(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-black shadow-lg shadow-purple-500/30"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Guild
              </Button>
            )}
          </div>
        </div>

        {/* Guild Stats Overview (if in guild) */}
        {userGuild && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/40">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-2xl font-black text-purple-300">{userGuild.members}/{userGuild.maxMembers}</span>
              </div>
              <p className="text-xs text-purple-400/60 font-mono uppercase">Members</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/40">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-black text-cyan-300">#{userGuild.rank}</span>
              </div>
              <p className="text-xs text-cyan-400/60 font-mono uppercase">Rank</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-orange-500/40">
              <div className="flex items-center justify-between mb-2">
                <Swords className="w-5 h-5 text-orange-400" />
                <span className="text-2xl font-black text-orange-300">{(userGuild.power / 1000).toFixed(0)}K</span>
              </div>
              <p className="text-xs text-orange-400/60 font-mono uppercase">Power</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-green-500/40">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-black text-green-300">{(userGuild.weeklyXP / 1000).toFixed(0)}K</span>
              </div>
              <p className="text-xs text-green-400/60 font-mono uppercase">Weekly XP</p>
            </Card>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "browse", label: userGuild ? "My Guild" : "Browse Guilds", icon: Search },
            { id: "rankings", label: "Rankings", icon: Trophy },
            { id: "wars", label: "Guild Wars", icon: Swords },
            { id: "quests", label: "Guild Quests", icon: Target },
            ...(userGuild ? [{ id: "members", label: "Members", icon: Users }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                  : "bg-slate-900/50 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeTab === "browse" && !userGuild && (
          <div>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search guilds by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 text-base"
              />
            </div>

            {/* Guild Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuilds.map((guild) => (
                <Card
                  key={guild.id}
                  className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/30 p-6 hover:border-purple-500/50 transition-all cursor-pointer hover:scale-105"
                  onClick={() => {
                    setSelectedGuild(guild);
                    setShowGuildDetails(true);
                  }}
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center font-black text-white shadow-lg">
                      #{guild.rank}
                    </div>
                  </div>

                  {/* Emblem & Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 flex items-center justify-center text-3xl">
                      {guild.emblem}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-white mb-1">{guild.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{guild.description}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Members</p>
                      <p className="text-sm font-bold text-white">{guild.members}/{guild.maxMembers}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Level</p>
                      <p className="text-sm font-bold text-cyan-300">{guild.level}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Power</p>
                      <p className="text-sm font-bold text-orange-300">{(guild.power / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Type</p>
                      <p className="text-sm font-bold text-purple-300">{guild.type}</p>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTypeColor(guild.type)} text-white text-xs font-bold text-center`}>
                    {guild.type}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "browse" && userGuild && (
          <div className="space-y-6">
            {/* Guild Overview Card */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/40 p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl -z-10" />
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-4 border-purple-500/40 flex items-center justify-center text-5xl shadow-2xl">
                    {userGuild.emblem}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">{userGuild.name}</h2>
                    <p className="text-slate-400 mb-2">{userGuild.description}</p>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTypeColor(userGuild.type)} text-white text-xs font-bold`}>
                        {userGuild.type}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                        Level {userGuild.level}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Guild Perks */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">Guild Perks</h3>
                <div className="flex flex-wrap gap-2">
                  {userGuild.perks.map((perk, idx) => (
                    <div key={idx} className="px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-300">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guild Master */}
              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-slate-500">Guild Master</p>
                    <p className="text-sm font-bold text-white">{userGuild.masterName}</p>
                  </div>
                </div>
                <Button
                  onClick={leaveGuild}
                  variant="outline"
                  className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Guild
                </Button>
              </div>
            </Card>

            {/* Guild Activities */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/40 hover:border-cyan-500/60 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-cyan-400" />
                  <Bell className="w-5 h-5 text-cyan-400/60" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Guild Chat</h3>
                <p className="text-sm text-slate-400 mb-4">12 new messages</p>
                <Button className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30">
                  Open Chat
                </Button>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-orange-500/40 hover:border-orange-500/60 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <Gift className="w-8 h-8 text-orange-400" />
                  <Sparkles className="w-5 h-5 text-orange-400/60" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Guild Store</h3>
                <p className="text-sm text-slate-400 mb-4">Exclusive items</p>
                <Button className="w-full bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30">
                  Browse Store
                </Button>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-green-500/40 hover:border-green-500/60 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="w-8 h-8 text-green-400" />
                  <TrendingUp className="w-5 h-5 text-green-400/60" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Guild Events</h3>
                <p className="text-sm text-slate-400 mb-4">2 active events</p>
                <Button className="w-full bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30">
                  View Events
                </Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "rankings" && (
          <Card className="p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/40">
            <div className="space-y-4">
              {guilds.map((guild, idx) => (
                <div
                  key={guild.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    userGuild && guild.id === userGuild.id
                      ? "bg-purple-500/10 border-purple-500/40"
                      : "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex items-center justify-center w-12">
                    {idx < 3 ? (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                          idx === 0
                            ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white"
                            : idx === 1
                            ? "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                            : "bg-gradient-to-br from-orange-700 to-orange-800 text-white"
                        }`}
                      >
                        {idx + 1}
                      </div>
                    ) : (
                      <span className="text-2xl font-black text-slate-600">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 flex items-center justify-center text-2xl">
                    {guild.emblem}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">{guild.name}</h4>
                      {userGuild && guild.id === userGuild.id && (
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">Level {guild.level} • {guild.members} Members</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-cyan-300">
                      {guild.power.toLocaleString()}
                    </p>
                    <p className="text-xs text-cyan-400/60 font-mono">POWER</p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "wars" && (
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/40">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">Current Guild War</h2>
                  <p className="text-slate-400 mb-2">Battle for supremacy and exclusive rewards</p>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
                      <span className="text-xs font-bold text-red-300">ACTIVE</span>
                    </div>
                    <span className="text-sm text-slate-400 font-mono">Ends in 2d 14h 32m</span>
                  </div>
                </div>
                <Swords className="w-12 h-12 text-red-400" />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-red-500/30">
                  <p className="text-xs text-slate-500 mb-2">Total Chapters Read</p>
                  <p className="text-2xl font-black text-white">125,840</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-orange-500/30">
                  <p className="text-xs text-slate-500 mb-2">Participating Guilds</p>
                  <p className="text-2xl font-black text-white">48</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-500/30">
                  <p className="text-xs text-slate-500 mb-2">Prize Pool</p>
                  <p className="text-2xl font-black text-white">50K Gold</p>
                </div>
              </div>

              {userGuild && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-400/60 mb-1">Your Guild's Position</p>
                      <p className="text-xl font-black text-purple-300">#{userGuild.rank}</p>
                    </div>
                    <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 font-bold">
                      Contribute Now
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* War Leaderboard */}
            <Card className="p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-orange-500/40">
              <h3 className="text-xl font-black text-orange-400 mb-4 uppercase tracking-wider">War Rankings</h3>
              <div className="space-y-3">
                {guildWars.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-orange-500/30"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                          entry.rank === 1
                            ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white"
                            : entry.rank === 2
                            ? "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                            : "bg-gradient-to-br from-orange-700 to-orange-800 text-white"
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-bold text-white">{entry.guildName}</p>
                        <p className="text-xs text-slate-400">{entry.score.toLocaleString()} points</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Reward</p>
                      <p className="text-sm font-bold text-yellow-300">{entry.reward}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "quests" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500" />
              <h2 className="text-xl font-black text-purple-400 uppercase tracking-wide">
                Guild Quests
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
            </div>

            {guildQuests.map((quest) => (
              <Card
                key={quest.id}
                className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/30 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {quest.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${getDifficultyColor(quest.difficulty)} bg-slate-800/50 border border-current`}>
                        RANK {quest.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      {quest.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-400" />
                        <span className="text-orange-300 font-mono">{quest.timeLeft}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-yellow-300 font-bold">{quest.reward}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-purple-400/70 font-mono">
                      GUILD PROGRESS
                    </span>
                    <span className="text-purple-300 font-bold">
                      {quest.progress} / {quest.total}
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-slate-900/80 rounded-full overflow-hidden border border-purple-500/30">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"
                      style={{
                        width: `${pct(quest.progress, quest.total)}%`,
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "members" && userGuild && (
          <Card className="p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-purple-400 uppercase tracking-wider">Guild Members</h3>
              <div className="text-sm text-slate-400 font-mono">
                {userGuild.members} / {userGuild.maxMembers} Members
              </div>
            </div>

            <div className="space-y-3">
              {Array.from({ length: Math.min(userGuild.members, 10) }, (_, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/40">
                    <Image
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=member-${idx}`}
                      alt={`Member ${idx + 1}`}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">
                        {idx === 0 ? userGuild.masterName : `Hunter${idx + 1}`}
                      </h4>
                      {idx === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Level {45 - idx * 3} • {2847 - idx * 150} Power
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-cyan-300">{8500 - idx * 500} XP</p>
                    <p className="text-xs text-cyan-400/60">This Week</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      <Footer />

      {/* Create Guild Modal */}
      {showCreateGuild && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full">
            <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/50 p-8 shadow-2xl">
              <button
                onClick={() => setShowCreateGuild(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-purple-400 mb-2 uppercase tracking-wider">
                  Create Your Guild
                </h2>
                <p className="text-slate-400 text-sm">
                  Establish your legacy and unite hunters under your banner
                </p>
              </div>

              <div className="space-y-6">
                {/* Guild Name */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Guild Name *
                  </label>
                  <Input
                    placeholder="Enter guild name..."
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>

                {/* Guild Description */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe your guild's purpose..."
                    value={guildDescription}
                    onChange={(e) => setGuildDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                    rows={3}
                  />
                </div>

                {/* Emblem Selection */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Select Guild Emblem
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {guildEmblems.map((emblem, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedEmblem(idx)}
                        className={`aspect-square rounded-lg border-2 text-2xl flex items-center justify-center transition-all hover:scale-110 ${
                          selectedEmblem === idx
                            ? "border-purple-500 bg-purple-500/20 scale-110"
                            : "border-slate-700 bg-slate-900/50 hover:border-purple-500/50"
                        }`}
                      >
                        {emblem}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Creation Cost */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-400 mb-1">Creation Cost</p>
                      <p className="text-xs text-slate-400">One-time fee to establish your guild</p>
                    </div>
                    <p className="text-2xl font-black text-purple-300">5,000 Gold</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowCreateGuild(false)}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createGuild}
                    disabled={!guildName.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-black shadow-lg disabled:from-slate-700 disabled:to-slate-700"
                  >
                    Create Guild
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Guild Details Modal */}
      {showGuildDetails && selectedGuild && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/50 p-8 shadow-2xl">
              <button
                onClick={() => setShowGuildDetails(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Guild Header */}
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-4 border-purple-500/40 flex items-center justify-center text-5xl">
                  {selectedGuild.emblem}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-white">{selectedGuild.name}</h2>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center font-black text-white">
                      #{selectedGuild.rank}
                    </div>
                  </div>
                  <p className="text-slate-400 mb-3">{selectedGuild.description}</p>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTypeColor(selectedGuild.type)} text-white text-xs font-bold`}>
                      {selectedGuild.type}
                    </div>
                    <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                      Level {selectedGuild.level}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/30">
                  <Users className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-2xl font-black text-white mb-1">{selectedGuild.members}/{selectedGuild.maxMembers}</p>
                  <p className="text-xs text-slate-400">Members</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/30">
                  <Swords className="w-5 h-5 text-cyan-400 mb-2" />
                  <p className="text-2xl font-black text-white mb-1">{(selectedGuild.power / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-slate-400">Power</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-orange-500/30">
                  <TrendingUp className="w-5 h-5 text-orange-400 mb-2" />
                  <p className="text-2xl font-black text-white mb-1">{(selectedGuild.weeklyXP / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-slate-400">Weekly XP</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/30">
                  <Star className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-2xl font-black text-white mb-1">#{selectedGuild.rank}</p>
                  <p className="text-xs text-slate-400">Rank</p>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">Requirements</h3>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-white font-mono">{selectedGuild.requirements}</span>
                </div>
              </div>

              {/* Activities */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">Guild Activities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGuild.activities.map((activity, idx) => (
                    <div key={idx} className="px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <span className="text-sm text-purple-300">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perks */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Guild Perks
                </h3>
                <div className="space-y-2">
                  {selectedGuild.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded border border-purple-500/20">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-white">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guild Master */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <div>
                    <p className="text-xs text-yellow-400/60 mb-1">Guild Master</p>
                    <p className="text-lg font-bold text-white">{selectedGuild.masterName}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => joinGuild(selectedGuild)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-black text-lg py-6 shadow-lg shadow-purple-500/30"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Request to Join Guild
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Invite Members Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full">
            <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/50 p-8 shadow-2xl">
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-cyan-400 mb-2 uppercase tracking-wider">
                  Invite Hunters
                </h2>
                <p className="text-slate-400 text-sm">
                  Share this link to invite hunters to your guild
                </p>
              </div>

              <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-4 mb-6">
                <p className="text-xs text-slate-500 mb-2">Guild Invite Link</p>
                <div className="flex gap-2">
                  <Input
                    value={`https://himanga.app/guild/invite/${userGuild?.id}`}
                    readOnly
                    className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono text-sm"
                  />
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-cyan-400">Invites Sent</span>
                    <span className="text-lg