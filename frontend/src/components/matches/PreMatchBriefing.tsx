import React, { useState } from 'react';
import { BackendFixture, Card } from '../../types/api';
import { Tournament } from '../../types/tournament';
import { Button } from '../ui/Button';
import { CardItem } from '../cards/CardItem';
import { matchesApi } from '../../services/matchesApi';
import { CLASH_ROYALE_CARDS } from '../../data/cards';
import { Swords, Shield, Flame, Lock, CheckCircle, ChevronDown, ChevronUp, Trophy } from 'lucide-react';

interface PreMatchBriefingProps {
  fixture: BackendFixture;
  tournament: Tournament;
  onOpenRegister: (fixture: BackendFixture) => void;
  onBack: () => void;
}

export const PreMatchBriefing: React.FC<PreMatchBriefingProps> = ({
  fixture,
  tournament,
  onOpenRegister,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'p1_cards' | 'p2_cards'>('overview');

  // Cooldown calculation
  const cooldownEnabled = tournament.cooldown_duration > 0;

  // Use backend cards if present, otherwise calculate via matchesApi
  const p1Cooldowns = matchesApi.calculatePlayerCooldowns(
    fixture.player1.id,
    tournament.cooldown_duration,
    CLASH_ROYALE_CARDS
  );

  const p2Cooldowns = matchesApi.calculatePlayerCooldowns(
    fixture.player2.id,
    tournament.cooldown_duration,
    CLASH_ROYALE_CARDS
  );

  const p1BannedCards = fixture.player1.bannedCards?.length
    ? fixture.player1.bannedCards
    : p1Cooldowns.bannedCards;

  const p2BannedCards = fixture.player2.bannedCards?.length
    ? fixture.player2.bannedCards
    : p2Cooldowns.bannedCards;

  return (
    <div className="bg-[#101420] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <span>Match #{String(fixture.matchNumber).padStart(2, '0')}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">
              {fixture.isTiebreaker ? 'Tiebreaker BO5 Mini-Final' : `Best of ${tournament.match_format_bo}`}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-white mt-1">
            Pre-Match Tactical Briefing
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>
            Back to Fixtures
          </Button>
          {fixture.status !== 'completed' && (
            <Button
              variant="primary"
              onClick={() => onOpenRegister(fixture)}
              icon={<Swords className="w-4 h-4" />}
            >
              Record Match Result
            </Button>
          )}
        </div>
      </div>

      {/* Versus Centerpiece */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center bg-gradient-to-br from-[#141b2a] to-[#0c0f18] border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        {/* Player 1 */}
        <div className="md:col-span-5 flex flex-col items-center md:items-start gap-3 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20">
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80"
              alt={fixture.player1.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 shadow-lg shadow-blue-500/20"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                Blue Corner • Player 1
              </span>
              <h3 className="font-display font-black text-2xl text-white tracking-wide leading-tight">
                {fixture.player1.name}
              </h3>
              <span className="font-mono text-xs text-blue-300 font-semibold">
                {fixture.player1.tag}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
            <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 font-semibold">
              Tournament Points: <strong className="text-amber-400">{fixture.player1.points || 0}</strong>
            </span>
            {cooldownEnabled && (
              <span className="bg-rose-950/60 text-rose-300 px-2.5 py-1 rounded-lg border border-rose-500/30 font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {p1BannedCards.length} Exhausted Cards
              </span>
            )}
          </div>
        </div>

        {/* VS Badge */}
        <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black font-display text-lg tracking-wider shadow-lg shadow-amber-500/30 border border-amber-300">
            VS
          </div>
        </div>

        {/* Player 2 */}
        <div className="md:col-span-5 flex flex-col items-center md:items-end gap-3 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-right">
          <div className="flex items-center flex-row-reverse gap-4">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
              alt={fixture.player2.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-rose-400 shadow-lg shadow-rose-500/20"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                Red Corner • Player 2
              </span>
              <h3 className="font-display font-black text-2xl text-white tracking-wide leading-tight">
                {fixture.player2.name}
              </h3>
              <span className="font-mono text-xs text-rose-300 font-semibold">
                {fixture.player2.tag}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
            <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 font-semibold">
              Tournament Points: <strong className="text-amber-400">{fixture.player2.points || 0}</strong>
            </span>
            {cooldownEnabled && (
              <span className="bg-rose-950/60 text-rose-300 px-2.5 py-1 rounded-lg border border-rose-500/30 font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {p2BannedCards.length} Exhausted Cards
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <Shield className="w-4 h-4 text-amber-400" /> Active Series: Best of {tournament.match_format_bo}
          </span>
          <span>•</span>
          <span>
            Exhaustion Rule:{' '}
            <strong className="text-amber-400">
              {cooldownEnabled ? `${tournament.cooldown_duration} Matches Lockout` : 'Disabled'}
            </strong>
          </span>
          <span>•</span>
          <span>
            Duplicate Deck Bans:{' '}
            <strong className="text-amber-400">
              {tournament.ban_duplicate_decks ? 'Active (Strictly Enforced)' : 'Permitted'}
            </strong>
          </span>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          * Opponents may use overlapping cards. Secret decks remain hidden until match conclusion.
        </div>
      </div>

      {/* Card Cooldown Inspection (Adaptive) */}
      {cooldownEnabled ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Card Availability & Exhaustion Tracker</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Banned Summary
              </button>
              <button
                onClick={() => setActiveTab('p1_cards')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer ${
                  activeTab === 'p1_cards'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {fixture.player1.name}'s Banned Pool
              </button>
              <button
                onClick={() => setActiveTab('p2_cards')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer ${
                  activeTab === 'p2_cards'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {fixture.player2.name}'s Banned Pool
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* P1 Cooldowns */}
              <div className="bg-[#121724] border border-blue-500/20 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-blue-300 uppercase">
                    {fixture.player1.name}'s Locked Cards ({p1BannedCards.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Unavailable for Match #{fixture.matchNumber}</span>
                </div>
                {p1BannedCards.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {p1BannedCards.map((c) => (
                      <CardItem
                        key={c.id}
                        card={c}
                        size="sm"
                        isBanned={true}
                        cooldownRemaining={p1Cooldowns.remainingMatches.get(c.id) || 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No cards currently on cooldown. All cards are available.
                  </div>
                )}
              </div>

              {/* P2 Cooldowns */}
              <div className="bg-[#121724] border border-rose-500/20 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-rose-300 uppercase">
                    {fixture.player2.name}'s Locked Cards ({p2BannedCards.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Unavailable for Match #{fixture.matchNumber}</span>
                </div>
                {p2BannedCards.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {p2BannedCards.map((c) => (
                      <CardItem
                        key={c.id}
                        card={c}
                        size="sm"
                        isBanned={true}
                        cooldownRemaining={p2Cooldowns.remainingMatches.get(c.id) || 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No cards currently on cooldown. All cards are available.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'p1_cards' && (
            <div className="bg-[#121724] border border-slate-800 p-6 rounded-2xl">
              <div className="mb-4">
                <h4 className="font-bold text-sm text-white">
                  Exhausted Cards for {fixture.player1.name}
                </h4>
                <p className="text-xs text-slate-400">
                  Cards used in the most recent {tournament.cooldown_duration} individual games cannot be registered.
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {p1BannedCards.map((c) => (
                  <CardItem
                    key={c.id}
                    card={c}
                    size="md"
                    isBanned={true}
                    cooldownRemaining={p1Cooldowns.remainingMatches.get(c.id) || 1}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'p2_cards' && (
            <div className="bg-[#121724] border border-slate-800 p-6 rounded-2xl">
              <div className="mb-4">
                <h4 className="font-bold text-sm text-white">
                  Exhausted Cards for {fixture.player2.name}
                </h4>
                <p className="text-xs text-slate-400">
                  Cards used in the most recent {tournament.cooldown_duration} individual games cannot be registered.
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {p2BannedCards.map((c) => (
                  <CardItem
                    key={c.id}
                    card={c}
                    size="md"
                    isBanned={true}
                    cooldownRemaining={p2Cooldowns.remainingMatches.get(c.id) || 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
          Card Exhaustion is disabled for this tournament. All 109 Clash Royale cards are unrestricted for both competitors.
        </div>
      )}
    </div>
  );
};
