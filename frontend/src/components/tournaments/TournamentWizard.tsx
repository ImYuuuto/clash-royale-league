import React, { useState } from 'react';
import { CreateTournamentInput, TournamentFormat, CardCooldownDuration, MatchFormatBo, TiebreakerMode } from '../../types/tournament';
import { Player } from '../../types/player';
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
  const [matchFormatBo, setMatchFormatBo] = useState<MatchFormatBo>(3);
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
        showNotification('warning', 'Tournament Name Required', 'Please provide a name for the tournament.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedPlayerIds.length < 6) {
        showNotification('error', 'Insufficient Competitors', 'A minimum of 6 players is required to launch a tournament.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleLaunch = async () => {
    if (selectedPlayerIds.length < 6) {
      showNotification('error', 'Validation Error', 'At least 6 players must be enrolled.');
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
      showNotification('success', 'Tournament Launched', `${name} has been officially created with ${selectedPlayerIds.length} players!`);
    } catch (err) {
      showNotification('error', 'Launch Failed', (err as Error).message || 'Could not launch tournament.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Basic Info', icon: Trophy },
    { num: 2, title: 'Rules & Formats', icon: Shield },
    { num: 3, title: 'Player Roster', icon: Users },
    { num: 4, title: 'Review & Launch', icon: CheckCircle },
  ];

  return (
    <div className="bg-[#121724] border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-4xl mx-auto">
      {/* Wizard Step Indicators */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/80">
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
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Step 0{s.num}
                  </div>
                  <div
                    className={`text-xs font-bold tracking-wide ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </div>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    currentStep > s.num ? 'bg-emerald-500/40' : 'bg-slate-800'
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
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Step 1: Basic Information
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Define the tournament identity and league scheduling format.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Tournament Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clash Royale Continental Championship 2026"
              className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Tournament Format *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormat('single_round_robin')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  format === 'single_round_robin'
                    ? 'bg-amber-500/10 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-display font-bold text-base text-amber-400">
                  Single Round-Robin
                </div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Every participant plays against every other player once. Best for fast-paced, balanced league schedules.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('double_round_robin')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  format === 'double_round_robin'
                    ? 'bg-amber-500/10 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-display font-bold text-base text-amber-400">
                  Double Round-Robin
                </div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Home & Away fixtures. Every player plays each competitor twice. Maximizes competitiveness.
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
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Step 2: Tournament Rules & Card Restrictions
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure deck diversity, exhaustion mechanics, series lengths, and tiebreaker conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card Exhaustion Duration */}
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Card Exhaustion Cooldown</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Used cards become unavailable for the player's next N individual games.
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
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exact Deck Repetition Prevention */}
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-amber-400" />
                <span>Duplicate Deck Prevention</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Forbid a player from reusing the exact same 8-card combination during this tournament.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBanDuplicateDecks(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    banDuplicateDecks
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Enabled (Banned)
                </button>
                <button
                  type="button"
                  onClick={() => setBanDuplicateDecks(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    !banDuplicateDecks
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Disabled (Allowed)
                </button>
              </div>
            </div>

            {/* Match Series Format */}
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Match Series Format (BO)
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                First player to win ceil(Format / 2) games wins the fixture and receives 3 points.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMatchFormatBo(3)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    matchFormatBo === 3
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Best of 3 (Bo3)
                </button>
                <button
                  type="button"
                  onClick={() => setMatchFormatBo(5)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    matchFormatBo === 5
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Best of 5 (Bo5)
                </button>
              </div>
            </div>

            {/* Tiebreaker Rule */}
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Tiebreaker Rule
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Resolution mechanism when top competitors finish with identical point totals.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'bo5', label: 'Bo5 Mini-Final' },
                  { value: 'head_to_head', label: 'H2H Aggregate' },
                  { value: 'shared_victory', label: 'Shared Victory' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTiebreakerMode(opt.value as TiebreakerMode)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center leading-tight ${
                      tiebreakerMode === opt.value
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
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
              <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
                Step 3: Player Enrollment
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select at least 6 competitors from the Global Roster to participate.
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                selectedPlayerIds.length >= 6
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                {selectedPlayerIds.length} / 6 Minimum Players Selected
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
              placeholder="Search players by name or tag..."
              className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                      ? 'bg-amber-500/15 border-amber-400/80 text-white shadow-md'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={player.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-xs text-white leading-tight">{player.name}</div>
                      <div className="text-[10px] font-mono text-amber-400/90">{player.player_tag}</div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'border-slate-700 text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                </div>
              );
            })}
          </div>

          {selectedPlayerIds.length < 6 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please select at least {6 - selectedPlayerIds.length} more player(s) to proceed.</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: REVIEW AND LAUNCH */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Step 4: Configuration Review & Launch
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify all tournament parameters and competitive constraints before official creation.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                League Identity
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tournament Name:</span>
                <span className="font-bold text-white">{name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Scheduling Format:</span>
                <span className="font-semibold text-slate-200 capitalize">{format.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Match Series:</span>
                <span className="font-semibold text-slate-200">Best of {matchFormatBo}</span>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                Card & Tiebreaker Rules
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Card Exhaustion:</span>
                <span className="font-semibold text-slate-200">
                  {cooldownDuration > 0 ? `${cooldownDuration} Matches Cooldown` : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Duplicate Decks:</span>
                <span className="font-semibold text-slate-200">
                  {banDuplicateDecks ? 'Strictly Banned' : 'Allowed'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tiebreaker:</span>
                <span className="font-semibold text-slate-200 uppercase">{tiebreakerMode}</span>
              </div>
            </div>
          </div>

          {/* Enrolled Players Preview */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Enrolled Competitors ({selectedPlayerIds.length})</span>
              <span className="text-emerald-400 font-semibold text-[11px]">Ready for round-robin pairing</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {players
                .filter((p) => selectedPlayerIds.includes(p.id))
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-white"
                  >
                    <img src={p.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    <span>{p.name}</span>
                    <span className="text-amber-400 font-mono text-[10px]">{p.player_tag}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-800/80">
        <div>
          {currentStep > 1 ? (
            <Button
              variant="secondary"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
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
              variant="primary"
              onClick={handleNext}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Next Step
            </Button>
          ) : (
            <Button
              variant="primary"
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
