import React, { useState } from 'react';
import { BackendFixture } from '../../types/api';
import { Tournament } from '../../types/tournament';
import { Button } from '../ui/Button';
import { CardItem } from '../cards/CardItem';
import { Swords, Shield, Flame, Lock, CalendarDays, PlayCircle, CheckCircle2 } from 'lucide-react';

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

  const cooldownEnabled = tournament.cooldown_duration > 0;
  const p1BannedCards = fixture.player1.bannedCards || [];
  const p2BannedCards = fixture.player2.bannedCards || [];
  const statusLabel = fixture.status === 'completed' ? 'Match completed' : fixture.status === 'in_progress' ? 'Series in Progress' : 'Upcoming Match';

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600">
            <span>Match #{String(fixture.matchNumber).padStart(2, '0')}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-bold">
              {fixture.isTiebreaker ? 'Mini-Finale Tiebreaker BO5' : 'Single Match'}
            </span>
          </div>
          <div className={`inline-flex items-center gap-1.5 mt-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${fixture.status === 'completed' ? 'bg-slate-100 border-slate-200 text-slate-600' : fixture.status === 'in_progress' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            {fixture.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : fixture.status === 'in_progress' ? <PlayCircle className="w-3.5 h-3.5" /> : <CalendarDays className="w-3.5 h-3.5" />}
            {statusLabel}
          </div>
          <h2 className="text-2xl font-black font-display uppercase tracking-wide text-slate-900 mt-1">
            Pre-Match Tactical Briefing
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            Back to Matches
          </Button>
          {fixture.game && (
            <Button
              variant="gold"
              onClick={() => onOpenRegister(fixture)}
              icon={<Swords className="w-4 h-4" />}
            >
              Edit Result
            </Button>
          )}
          {!fixture.game && fixture.status !== 'completed' && (
            <Button
              variant="gold"
              onClick={() => onOpenRegister(fixture)}
              icon={<Swords className="w-4 h-4" />}
            >
              Record Result
            </Button>
          )}
        </div>
      </div>

      {/* Versus Centerpiece */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center bg-slate-50 border border-slate-200/90 rounded-3xl p-6 shadow-sm">
        {/* Player 1 */}
        <div className="md:col-span-5 flex flex-col items-center md:items-start gap-3 p-5 rounded-2xl bg-blue-50/70 border border-blue-200">
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80"
              alt={fixture.player1.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-sm"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                Blue Corner • Player 1
              </span>
              <h3 className="font-display font-black text-2xl text-slate-900 tracking-wide leading-tight">
                {fixture.player1.name}
              </h3>
              <span className="font-mono text-xs text-blue-700 font-bold bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200 inline-block mt-0.5">
                {fixture.player1.tag}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-700 shadow-sm">
              Tournament Points: <strong className="text-amber-600">{fixture.player1.points || 0}</strong>
            </span>
            {cooldownEnabled && (
              <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200 font-bold flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                {p1BannedCards.length} Cards on Cooldown
              </span>
            )}
          </div>
        </div>

        {/* VS Badge */}
        <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black font-display text-lg tracking-wider shadow-md border-2 border-white">
            VS
          </div>
        </div>

        {/* Player 2 */}
        <div className="md:col-span-5 flex flex-col items-center md:items-end gap-3 p-5 rounded-2xl bg-rose-50/70 border border-rose-200 text-right">
          <div className="flex items-center flex-row-reverse gap-4">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
              alt={fixture.player2.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-rose-500 shadow-sm"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">
                Red Corner • Player 2
              </span>
              <h3 className="font-display font-black text-2xl text-slate-900 tracking-wide leading-tight">
                {fixture.player2.name}
              </h3>
              <span className="font-mono text-xs text-rose-700 font-bold bg-rose-100/70 px-2 py-0.5 rounded-md border border-rose-200 inline-block mt-0.5">
                {fixture.player2.tag}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-700 shadow-sm">
              Tournament Points: <strong className="text-amber-600">{fixture.player2.points || 0}</strong>
            </span>
            {cooldownEnabled && (
              <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200 font-bold flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                {p2BannedCards.length} Cards on Cooldown
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-4 text-slate-700 font-semibold flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-slate-900">
            <Shield className="w-4 h-4 text-amber-500" /> Format: Single Match
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Card Cooldown Rule:{' '}
            <strong className="text-amber-600">
              {cooldownEnabled ? `${tournament.cooldown_duration} cooldown matches` : 'Disabled'}
            </strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Anti-doublon de decks :{' '}
            <strong className="text-amber-600">
              {tournament.ban_duplicate_decks ? 'Active (Strictly Enforced)' : 'Allowed'}
            </strong>
          </span>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          * Both players may use the same cards. Secret decks are revealed when the result is submitted.
        </div>
      </div>

      {/* Card Cooldown Inspection (Adaptive) */}
      {cooldownEnabled ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
            <h3 className="font-display font-black text-lg text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              <span>Card Availability Tracking (Cooldown)</span>
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('overview')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                Vue d'Ensemble
              </button>
              <button
                onClick={() => setActiveTab('p1_cards')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                  activeTab === 'p1_cards'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                Cards de {fixture.player1.name}
              </button>
              <button
                onClick={() => setActiveTab('p2_cards')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                  activeTab === 'p2_cards'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                Cards de {fixture.player2.name}
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* P1 Cooldowns */}
              <div className="bg-slate-50 border border-blue-200 p-5 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-blue-900 uppercase">
                    Blocked Cards - {fixture.player1.name} ({p1BannedCards.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">Unavailable for this match</span>
                </div>
                {p1BannedCards.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {p1BannedCards.map((c) => (
                      <CardItem
                        key={c.id}
                        card={c}
                        size="sm"
                        isBanned={true}
                        cooldownRemaining={c.remainingCooldownGames || 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-medium">
                    No cards are on cooldown. All cards are available!
                  </div>
                )}
              </div>

              {/* P2 Cooldowns */}
              <div className="bg-slate-50 border border-rose-200 p-5 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-rose-900 uppercase">
                    Blocked Cards - {fixture.player2.name} ({p2BannedCards.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">Unavailable for this match</span>
                </div>
                {p2BannedCards.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {p2BannedCards.map((c) => (
                      <CardItem
                        key={c.id}
                        card={c}
                        size="sm"
                        isBanned={true}
                        cooldownRemaining={c.remainingCooldownGames || 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-medium">
                    No cards are on cooldown. All cards are available!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'p1_cards' && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="mb-4">
                <h4 className="font-bold text-sm text-slate-900">
                  Cards on Cooldown for {fixture.player1.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Cards played in the last {tournament.cooldown_duration} sets cannot be selected.
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {p1BannedCards.map((c) => (
                  <CardItem
                    key={c.id}
                    card={c}
                    size="md"
                    isBanned={true}
                    cooldownRemaining={c.remainingCooldownGames || 1}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'p2_cards' && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="mb-4">
                <h4 className="font-bold text-sm text-slate-900">
                  Cards on Cooldown for {fixture.player2.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Cards played in the last {tournament.cooldown_duration} sets cannot be selected.
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {p2BannedCards.map((c) => (
                  <CardItem
                    key={c.id}
                    card={c}
                    size="md"
                    isBanned={true}
                    cooldownRemaining={c.remainingCooldownGames || 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
          Card cooldowns are disabled for this tournament. All cards in the catalog are available to both players.
        </div>
      )}
    </div>
  );
};
