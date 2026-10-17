import React, { useMemo, useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { analyticsApi } from '../services/analyticsApi';
import { CardItem } from '../components/cards/CardItem';
import { CARD_MAP } from '../data/cards';
import {
  BarChart3,
  TrendingUp,
  Droplets,
  Trophy,
  Crown,
  Layers,
  Sparkles,
  PieChart,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { activeTournament, fixtures } = useTournament();
  const [remoteData, setRemoteData] = useState<any>(null);

  useEffect(() => {
    if (activeTournament) {
      analyticsApi.fetchRemoteTournamentAnalytics(activeTournament.id).then((data) => {
        if (data) setRemoteData(data);
      });
    }
  }, [activeTournament]);

  const analytics = useMemo(() => {
    if (!activeTournament) return null;
    return analyticsApi.getTournamentAnalytics(activeTournament, fixtures, remoteData);
  }, [activeTournament, fixtures, remoteData]);

  if (!activeTournament || !analytics) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm">
        Sélectionnez un tournoi pour voir les statistiques.
      </div>
    );
  }

  const topCards = analytics.cardAnalytics.slice(0, 8);
  const highestWinRateCards = [...analytics.cardAnalytics]
    .filter((c) => c.usageCount >= 2)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 8);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0b2559] to-[#1746a0] p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Statistiques & Analytique
            </h2>
            <p className="text-xs text-blue-100/70 mt-0.5">
              Méta breakdown, épuisements de cartes, scores clutch et courbes de win-rate.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
            {activeTournament.name}
          </span>
          <span className="text-xs text-white/70">
            {analytics.matchesCompleted} / {analytics.totalMatches} Matchs Finalisés
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm card-hover">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span>Matchs Terminés</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-slate-900">
            {analytics.matchesCompleted}{' '}
            <span className="text-sm text-slate-400 font-sans font-medium">/ {analytics.totalMatches}</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            {Math.round((analytics.matchesCompleted / (analytics.totalMatches || 1)) * 100)}% Progression
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm card-hover">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span>Couronnes Totales</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-amber-600">
            {analytics.totalCrowns}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Moy. {analytics.averageCrownsPerGame} couronnes/match
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm card-hover">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span>Coût Élixir Moyen</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-purple-500 fill-purple-500" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-purple-600">
            {analytics.averageDeckElixir}
          </div>
          <div className="text-[11px] text-purple-500 mt-1 font-medium">
            Cycle Rapide / Bridge-Spam Méta
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm card-hover">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span>Pool de Cartes</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-blue-600">
            {analytics.cardAnalytics.length}
          </div>
          <div className="text-[11px] text-blue-500 mt-1 font-medium">
            Cartes uniques déployées
          </div>
        </div>
      </div>

      {/* Competitor Analytics Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-wider">
              Performances des Compétiteurs
            </h3>
            <p className="text-xs text-slate-400">
              Win rates, scores de couronnes, performances clutch et diversité de decks.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Joueur</th>
                <th className="py-3 px-4">Win Rate</th>
                <th className="py-3 px-4 text-center">Matchs</th>
                <th className="py-3 px-4 text-center">Efficacité Couronnes</th>
                <th className="py-3 px-4 text-center">Score Clutch</th>
                <th className="py-3 px-4 text-center">Decks Uniques</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {analytics.playerAnalytics.map((p) => (
                <tr key={p.playerId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <div>{p.playerName}</div>
                    <div className="text-[10px] font-mono text-[#0b2559]/70">{p.playerTag}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full"
                          style={{ width: `${p.winRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-emerald-600">{p.winRate}%</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                    {p.matchesWon} / {p.matchesPlayed}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-amber-600">
                    {p.crownEfficiency} <span className="text-[10px] text-slate-400 font-normal">cr/m</span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                      {p.clutchPerformance}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                    {p.deckDiversity} Decks
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequent Cards */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Cartes les Plus Jouées</span>
            </h3>
            <span className="text-[11px] text-slate-400">Usage Méta</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {topCards.map((cardStat) => {
              const card = CARD_MAP.get(cardStat.cardId);
              if (!card) return null;
              return (
                <div key={cardStat.cardId} className="flex flex-col items-center gap-1">
                  <CardItem card={card} size="sm" />
                  <span className="text-[10px] font-bold text-[#0b2559]">
                    {cardStat.usageCount} Plays
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highest Win-Rate Cards */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Meilleur Win Rate</span>
            </h3>
            <span className="text-[11px] text-slate-400">Min 2 utilisations</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {highestWinRateCards.map((cardStat) => {
              const card = CARD_MAP.get(cardStat.cardId);
              if (!card) return null;
              return (
                <div key={cardStat.cardId} className="flex flex-col items-center gap-1">
                  <CardItem card={card} size="sm" />
                  <span className="text-[10px] font-bold text-emerald-600">
                    {cardStat.winRate}% WR
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Elixir Distribution */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Droplets className="w-4 h-4 text-purple-500" />
              <span>Courbe Coût Élixir</span>
            </h3>
            <span className="text-xs text-slate-400">Nombre de Cartes</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-40 pt-4">
            {analytics.elixirDistribution.map((d) => {
              const maxCount = Math.max(...analytics.elixirDistribution.map((i) => i.count), 1);
              const heightPercent = Math.max(12, Math.round((d.count / maxCount) * 100));

              return (
                <div key={d.cost} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-[10px] font-bold text-purple-600">{d.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-lg transition-all"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-bold text-slate-400">{d.cost}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rarity Breakdown */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              <span>Répartition par Rareté</span>
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
                Champion: 'bg-amber-500',
              };

              return (
                <div key={r.rarity} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{r.rarity}</span>
                    <span className="text-slate-400">{r.count} cartes ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
