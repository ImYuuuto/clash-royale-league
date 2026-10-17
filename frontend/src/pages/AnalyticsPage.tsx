import React, { useMemo } from 'react';
import { useTournament } from '../context/TournamentContext';
import { analyticsApi } from '../services/analyticsApi';
import { CardItem } from '../components/cards/CardItem';
import { CARD_MAP } from '../data/cards';
import {
  BarChart3,
  TrendingUp,
  Droplets,
  Trophy,
  Flame,
  Crown,
  Layers,
  Sparkles,
  PieChart,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { activeTournament, fixtures } = useTournament();

  const analytics = useMemo(() => {
    if (!activeTournament) return null;
    return analyticsApi.getTournamentAnalytics(activeTournament, fixtures);
  }, [activeTournament, fixtures]);

  if (!activeTournament || !analytics) {
    return (
      <div className="p-12 text-center text-slate-500">
        Please select a tournament to view performance analytics.
      </div>
    );
  }

  const topCards = analytics.cardAnalytics.slice(0, 8);
  const highestWinRateCards = [...analytics.cardAnalytics]
    .filter((c) => c.usageCount >= 2)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 8);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#141b2b] to-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Tournament Intelligence & Analytics
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical meta breakdown, card exhaustions, clutch ratings, and win-rate curves.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            {activeTournament.name}
          </span>
          <span className="text-xs text-slate-400">
            {analytics.matchesCompleted} / {analytics.totalMatches} Matches Finalized
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#101420] border border-slate-800 p-5 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Matches Completed</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-black text-3xl text-white">
            {analytics.matchesCompleted}{' '}
            <span className="text-sm text-slate-500 font-sans font-medium">/ {analytics.totalMatches}</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium">
            {Math.round((analytics.matchesCompleted / (analytics.totalMatches || 1)) * 100)}% Tournament Progress
          </div>
        </div>

        <div className="bg-[#101420] border border-slate-800 p-5 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Total Crowns Scored</span>
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="font-display font-black text-3xl text-amber-300">
            {analytics.totalCrowns}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Avg {analytics.averageCrownsPerGame} crowns per game
          </div>
        </div>

        <div className="bg-[#101420] border border-slate-800 p-5 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Average Deck Elixir</span>
            <Droplets className="w-4 h-4 text-purple-400 fill-purple-400" />
          </div>
          <div className="font-display font-black text-3xl text-purple-300">
            {analytics.averageDeckElixir}
          </div>
          <div className="text-[11px] text-purple-400 mt-1 font-medium">
            Fast Cycle / Bridge-Spam Meta
          </div>
        </div>

        <div className="bg-[#101420] border border-slate-800 p-5 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Active Card Pool</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-display font-black text-3xl text-blue-300">
            {analytics.cardAnalytics.length}
          </div>
          <div className="text-[11px] text-blue-400 mt-1 font-medium">
            Unique cards deployed so far
          </div>
        </div>
      </div>

      {/* Competitor Analytics Table */}
      <div className="bg-[#101420] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
              Competitor Performance Metrics
            </h3>
            <p className="text-xs text-slate-400">
              Win rates, crown scoring rates, clutch performance, and deck diversity.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Win Rate</th>
                <th className="py-3 px-4 text-center">Matches</th>
                <th className="py-3 px-4 text-center">Crown Efficiency</th>
                <th className="py-3 px-4 text-center">Clutch Score</th>
                <th className="py-3 px-4 text-center">Unique Decks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {analytics.playerAnalytics.map((p) => (
                <tr key={p.playerId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div>{p.playerName}</div>
                    <div className="text-[10px] font-mono text-amber-400">{p.playerTag}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full"
                          style={{ width: `${p.winRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-emerald-400">{p.winRate}%</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-medium">
                    {p.matchesWon} / {p.matchesPlayed}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-amber-300">
                    {p.crownEfficiency} <span className="text-[10px] text-slate-500 font-normal">cr/m</span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {p.clutchPerformance}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-semibold text-slate-200">
                    {p.deckDiversity} Decks
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meta Analytics & Card Frequencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequent Cards */}
        <div className="bg-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Most Deployed Cards</span>
            </h3>
            <span className="text-[11px] text-slate-400">Meta Usage</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {topCards.map((cardStat) => {
              const card = CARD_MAP.get(cardStat.cardId);
              if (!card) return null;
              return (
                <div key={cardStat.cardId} className="flex flex-col items-center gap-1">
                  <CardItem card={card} size="sm" />
                  <span className="text-[10px] font-bold text-amber-300">
                    {cardStat.usageCount} Plays
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highest Win-Rate Cards */}
        <div className="bg-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Highest Win-Rate Cards</span>
            </h3>
            <span className="text-[11px] text-slate-400">Min 2 uses</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {highestWinRateCards.map((cardStat) => {
              const card = CARD_MAP.get(cardStat.cardId);
              if (!card) return null;
              return (
                <div key={cardStat.cardId} className="flex flex-col items-center gap-1">
                  <CardItem card={card} size="sm" />
                  <span className="text-[10px] font-bold text-emerald-400">
                    {cardStat.winRate}% WR
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Elixir & Rarity Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Elixir Distribution */}
        <div className="bg-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <Droplets className="w-4 h-4 text-purple-400" />
              <span>Elixir Cost Curve</span>
            </h3>
            <span className="text-xs text-slate-400">Card Counts</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-40 pt-4">
            {analytics.elixirDistribution.map((d) => {
              const maxCount = Math.max(...analytics.elixirDistribution.map((i) => i.count), 1);
              const heightPercent = Math.max(12, Math.round((d.count / maxCount) * 100));

              return (
                <div key={d.cost} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-[10px] font-bold text-purple-300">{d.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-purple-800 to-purple-500 rounded-t-lg transition-all"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-bold text-slate-400">{d.cost}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rarity Breakdown */}
        <div className="bg-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <span>Rarity Meta Breakdown</span>
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.rarityDistribution.map((r) => {
              const total = analytics.rarityDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
              const pct = Math.round((r.count / total) * 100);

              const colorMap: Record<string, string> = {
                Common: 'bg-slate-400',
                Rare: 'bg-orange-500',
                Epic: 'bg-purple-500',
                Legendary: 'bg-cyan-500',
                Champion: 'bg-amber-400',
              };

              return (
                <div key={r.rarity} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{r.rarity}</span>
                    <span className="text-slate-400">{r.count} cards ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorMap[r.rarity] || 'bg-amber-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
