import React, { useState } from 'react';
import { CreateTournamentInput, TournamentFormat, CardCooldownDuration, MatchFormatBo, TiebreakerMode } from '../../types/tournament';
import { Player } from '../../types/player';
import { PlayerAvatar } from '../players/PlayerAvatar';
import { Button } from '../ui/Button';
import { Trophy, Shield, Users, CheckCircle, ArrowRight, ArrowLeft, Search, AlertCircle, Ban, Flame } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface TournamentWizardProps {
  players: Player[];
  onCancel: () => void;
  onLaunch: (input: CreateTournamentInput) => Promise<void>;
}

export const TournamentWizard: React.FC<TournamentWizardProps> = ({
  players,
  onCancel,
  onLaunch,
}) => {
  const { showNotification } = useNotifications();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('single_round_robin');
  const [cooldownDuration, setCooldownDuration] = useState<CardCooldownDuration>(2);
  const [banDuplicateDecks, setBanDuplicateDecks] = useState(true);
  const [matchFormatBo] = useState<MatchFormatBo>(1);
  const [tiebreakerMode, setTiebreakerMode] = useState<TiebreakerMode>('bo5');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>(
    players.slice(0, 6).map((p) => p.id)
  );

  const [playerSearch, setPlayerSearch] = useState('');

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.player_tag.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const togglePlayer = (id: number) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        showNotification('warning', 'Name Required', 'Enter a tournament name.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedPlayerIds.length < 2) {
        showNotification('error', 'Not Enough Players', 'At least 2 players are required to start a tournament.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleLaunch = async () => {
    if (selectedPlayerIds.length < 2) {
      showNotification('error', 'Validation Error', 'At least 2 players must be enrolled.');
      return;
    }
    setSubmitting(true);
    try {
      await onLaunch({
        name: name.trim(),
        format,
        cooldown_duration: cooldownDuration,
        ban_duplicate_decks: banDuplicateDecks,
        match_format_bo: matchFormatBo,
        tiebreaker_mode: tiebreakerMode,
        playerIds: selectedPlayerIds,
      });
      showNotification('success', 'Tournament Created!', `${name} has been launched with ${selectedPlayerIds.length} players!`);
    } catch (err) {
      showNotification('error', 'Launch Failed', (err as Error).message || 'Could not create the tournament.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'General Information', icon: Trophy },
    { num: 2, title: 'Rules & Cards', icon: Shield },
    { num: 3, title: 'Players', icon: Users },
    { num: 4, title: 'Confirmation', icon: CheckCircle },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
      {/* Wizard Step Indicators */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isDone = currentStep > s.num;
          const isActive = currentStep === s.num;
          return (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-200 border ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-4 ring-amber-500/20'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Step 0{s.num}
                  </div>
                  <div
                    className={`text-xs font-bold tracking-wide ${
                      isActive ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </div>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 ${
                    currentStep > s.num ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: BASIC INFORMATION */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-black font-display uppercase tracking-wide text-slate-900">
              Step 1: General Information
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Set the tournament name and schedule format.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Tournament Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Championnat Clash Royale 2026"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                League Format *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormat('single_round_robin')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  format === 'single_round_robin'
                    ? 'bg-amber-50 border-2 border-amber-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-display font-black text-base text-amber-700">
                  Round-Robin Simple (Matches simples)
                </div>
                <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Each player faces every other player once. Ideal for a quick, balanced schedule.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('double_round_robin')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  format === 'double_round_robin'
                    ? 'bg-amber-50 border-2 border-amber-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-display font-black text-base text-amber-700">
                  Double Round Robin
                </div>
                <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Home and away matches. Each player plays two series against every opponent.
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: TOURNAMENT RULES */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-black font-display uppercase tracking-wide text-slate-900">
              Step 2: Card Rules & Restrictions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure card cooldowns, duplicate deck rules, and tiebreakers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card Exhaustion Duration */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Played Card Cooldown</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Played cards become unavailable for the next N individual games.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 0, label: 'Disabled' },
                  { value: 2, label: '2 Matches' },
                  { value: 3, label: '3 Matches' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCooldownDuration(opt.value as CardCooldownDuration)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      cooldownDuration === opt.value
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exact Deck Repetition Prevention */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-amber-600" />
                <span>Prevent Duplicate Decks (8 Cards)</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Players cannot reuse the same 8-card deck in a tournament.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBanDuplicateDecks(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    banDuplicateDecks
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Active (Interdit)
                </button>
                <button
                  type="button"
                  onClick={() => setBanDuplicateDecks(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    !banDuplicateDecks
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Disabled (Allowed)
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Match Format
              </label>
              <p className="text-[11px] text-slate-500">
                Each fixture is played as a single match. A win is worth 3 points.
              </p>
            </div>

            {/* Tiebreaker Rule */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Tiebreaker Rule
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                How ties in the standings are resolved.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'bo5', label: 'Mini-Finale Bo5' },
                  { value: 'head_to_head', label: 'Confrontation Directe' },
                  { value: 'shared_victory', label: 'Shared Victory' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTiebreakerMode(opt.value as TiebreakerMode)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center leading-tight ${
                      tiebreakerMode === opt.value
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PLAYER SELECTION */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-black font-display uppercase tracking-wide text-slate-900">
                Step 3: Player Roster
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select the players who will participate in this tournament.
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                selectedPlayerIds.length >= 2
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                {selectedPlayerIds.length} player(s) selected
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Filter players by name or Clash Royale tag..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-semibold"
            />
          </div>

          {/* Player Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredPlayers.map((player) => {
              const isSelected = selectedPlayerIds.includes(player.id);
              return (
                <div
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                    isSelected
                      ? 'bg-amber-50 border-2 border-amber-500 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      src={player.avatar_url}
                      name={player.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300 shadow-sm"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 leading-tight">{player.name}</div>
                      <div className="text-[10px] font-mono text-amber-700 font-semibold">{player.player_tag}</div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'border-slate-300 text-transparent bg-white'
                    }`}
                  >
                    ✓
                  </div>
                </div>
              );
            })}
          </div>

          {selectedPlayerIds.length < 2 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Select at least 2 players to continue.</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: REVIEW AND LAUNCH */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-black font-display uppercase tracking-wide text-slate-900">
              Step 4: Review & Launch
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review all settings before generating the official match schedule.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
              <div className="text-xs font-black uppercase tracking-wider text-amber-700 border-b border-slate-200 pb-2">
                Tournament Details
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Tournament Name :</span>
                <span className="font-bold text-slate-900">{name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Round Format:</span>
                <span className="font-bold text-slate-900 capitalize">{format.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Match Format:</span>
                <span className="font-bold text-slate-900">Single Match</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
              <div className="text-xs font-black uppercase tracking-wider text-amber-700 border-b border-slate-200 pb-2">
                Deck Rules
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Card Cooldown:</span>
                <span className="font-bold text-slate-900">
                  {cooldownDuration > 0 ? `${cooldownDuration} cooldown matches` : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Anti-Doublon :</span>
                <span className="font-bold text-slate-900">
                  {banDuplicateDecks ? 'Strictly Prohibited' : 'Allowed'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Tiebreaker:</span>
                <span className="font-bold text-slate-900 uppercase">{tiebreakerMode}</span>
              </div>
            </div>
          </div>

          {/* Enrolled Players Preview */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
              <span>Enrolled Players ({selectedPlayerIds.length})</span>
              <span className="text-emerald-700 font-bold text-[11px]">Ready for round robin</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {players
                .filter((p) => selectedPlayerIds.includes(p.id))
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-800 shadow-sm"
                  >
                    <PlayerAvatar src={p.avatar_url} name={p.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-bold">{p.name}</span>
                    <span className="text-amber-700 font-mono text-[10px] font-bold">{p.player_tag}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-200">
        <div>
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
          ) : (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        <div>
          {currentStep < 4 ? (
            <Button
              variant="gold"
              onClick={handleNext}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Next Step
            </Button>
          ) : (
            <Button
              variant="gold"
              loading={submitting}
              onClick={handleLaunch}
              icon={<Trophy className="w-4 h-4" />}
            >
              Launch Tournament
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
