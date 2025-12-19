"use client";

import { useState, useEffect } from "react";
import { Star, Sparkles, Trophy, Gift, Coins } from "lucide-react";
import Image from "next/image";

interface WaifuCard {
  id: number;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  image: string;
  series: string;
  power: number;
}

export default function GachaSystem() {
  const [gems, setGems] = useState(100);
  const [collection, setCollection] = useState<WaifuCard[]>([]);
  const [rolling, setRolling] = useState(false);
  const [newCard, setNewCard] = useState<WaifuCard | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  const rarityColors = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-yellow-400 to-orange-600",
  };

  const rarityChances = {
    common: 60,
    rare: 30,
    epic: 8,
    legendary: 2,
  };

  const gemPrices = [
    { amount: 50, price: 0.99, bonus: 0 },
    { amount: 120, price: 1.99, bonus: 20 },
    { amount: 300, price: 4.99, bonus: 50 },
    { amount: 650, price: 9.99, bonus: 150 },
    { amount: 1500, price: 19.99, bonus: 400 },
  ];

  const rollGacha = async () => {
    if (gems < 10) {
      setShowPricing(true);
      return;
    }

    setRolling(true);
    setGems(gems - 10);

    // Simulate API call to waifu.im
    setTimeout(async () => {
      const random = Math.random() * 100;
      let rarity: WaifuCard["rarity"] = "common";

      if (random < rarityChances.legendary) rarity = "legendary";
      else if (random < rarityChances.legendary + rarityChances.epic)
        rarity = "epic";
      else if (
        random <
        rarityChances.legendary + rarityChances.epic + rarityChances.rare
      )
        rarity = "rare";

      // Fetch from waifu.im API
      try {
        const response = await fetch(
          "https://api.waifu.im/search?is_nsfw=false"
        );
        const data = await response.json();
        const waifuData = data.images[0];

        const card: WaifuCard = {
          id: Date.now(),
          name: waifuData.tags[0]?.name || "Mysterious Waifu",
          rarity,
          image: waifuData.url,
          series: waifuData.tags[1]?.name || "Unknown Series",
          power:
            rarity === "legendary"
              ? 95
              : rarity === "epic"
              ? 85
              : rarity === "rare"
              ? 70
              : 50,
        };

        setNewCard(card);
        setCollection([...collection, card]);
      } catch (error) {
        console.error("Error fetching waifu:", error);
      }

      setRolling(false);
    }, 2000);
  };

  const roll10x = () => {
    if (gems < 90) {
      setShowPricing(true);
      return;
    }
    // Roll 10 times with guaranteed rare+
    alert("10x Roll: 90 gems (Save 10 gems + Guaranteed Rare!)");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
            Waifu Gacha Collection
          </h1>
          <p className="text-purple-200">
            Collect rare waifus and build your dream team!
          </p>
        </div>

        {/* Currency Display */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/50">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold">{gems}</span>
                <span className="text-yellow-200">Gems</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/50">
                <Trophy className="w-6 h-6 text-purple-400" />
                <span className="text-xl font-bold">{collection.length}</span>
                <span className="text-purple-200">Cards</span>
              </div>
            </div>
            <button
              onClick={() => setShowPricing(!showPricing)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full font-bold shadow-lg transition-all hover:scale-105"
            >
              <Gift className="w-5 h-5 inline mr-2" />
              Buy Gems
            </button>
          </div>
        </div>

        {/* Gem Store */}
        {showPricing && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Gem Packages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {gemPrices.map((pkg, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl p-4 hover:border-yellow-400 transition-all hover:scale-105 cursor-pointer"
                >
                  {pkg.bonus > 0 && (
                    <div className="bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">
                      +{pkg.bonus} BONUS
                    </div>
                  )}
                  <div className="text-center">
                    <Coins className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-yellow-400">
                      {pkg.amount + pkg.bonus}
                    </div>
                    <div className="text-sm text-purple-200 mb-3">Gems</div>
                    <div className="text-2xl font-bold">${pkg.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gacha Machine */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Summon Waifu</h2>

            {/* Roll Result */}
            {newCard && !rolling && (
              <div className="mb-8 animate-in fade-in zoom-in duration-500">
                <div
                  className={`relative bg-gradient-to-br ${
                    rarityColors[newCard.rarity]
                  } rounded-2xl p-6 max-w-md mx-auto border-4 border-white/50 shadow-2xl`}
                >
                  <div className="absolute top-2 right-2 flex gap-1">
                    {[
                      ...Array(
                        newCard.rarity === "legendary"
                          ? 5
                          : newCard.rarity === "epic"
                          ? 4
                          : newCard.rarity === "rare"
                          ? 3
                          : 2
                      ),
                    ].map((_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <Image
                    src={newCard.image}
                    alt={newCard.name}
                    className="w-full object-cover rounded-lg mb-4"
                  />
                  <div className="text-2xl font-bold mb-1">{newCard.name}</div>
                  <div className="text-purple-200 mb-2">{newCard.series}</div>
                  <div className="flex justify-center gap-4 text-sm">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      PWR: {newCard.power}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full uppercase">
                      {newCard.rarity}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Rolling Animation */}
            {rolling && (
              <div className="mb-8 flex justify-center items-center h-96">
                <div className="relative">
                  <div className="w-32 h-32 border-8 border-purple-500 border-t-yellow-400 rounded-full animate-spin"></div>
                  <Sparkles className="w-16 h-16 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>
            )}

            {/* Roll Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={rollGacha}
                disabled={rolling || gems < 10}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 rounded-2xl font-bold text-xl shadow-lg transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                Roll x1
                <div className="text-sm opacity-80">10 Gems</div>
              </button>

              <button
                onClick={roll10x}
                disabled={rolling || gems < 90}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 rounded-2xl font-bold text-xl shadow-lg transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed relative"
              >
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full">
                  SAVE 10
                </div>
                Roll x10
                <div className="text-sm opacity-80">90 Gems</div>
              </button>
            </div>

            {/* Drop Rates */}
            <div className="mt-6 text-sm text-purple-200">
              <button className="hover:text-white transition">
                ? Drop Rates: Legendary 2% | Epic 8% | Rare 30% | Common 60%
              </button>
            </div>
          </div>
        </div>

        {/* Collection Grid */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Your Collection
          </h2>

          {collection.length === 0 ? (
            <div className="text-center py-12 text-purple-200">
              <p className="text-xl mb-4">Your collection is empty!</p>
              <p>Start rolling to collect waifus!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {collection.map((card) => (
                <div
                  key={card.id}
                  className={`relative bg-gradient-to-br ${
                    rarityColors[card.rarity]
                  } rounded-xl p-3 border-2 border-white/50 hover:scale-105 transition-transform cursor-pointer`}
                >
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    {[
                      ...Array(
                        card.rarity === "legendary"
                          ? 5
                          : card.rarity === "epic"
                          ? 4
                          : card.rarity === "rare"
                          ? 3
                          : 2
                      ),
                    ].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <Image
                    src={card.image}
                    alt={card.name}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <div className="text-sm font-bold truncate">{card.name}</div>
                  <div className="text-xs opacity-80 truncate">
                    {card.series}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-8 text-center text-purple-200 text-sm">
          <p>All cards are stored permanently in your collection</p>
          <p className="mt-2">
            Trade, battle, and showcase your collection coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
