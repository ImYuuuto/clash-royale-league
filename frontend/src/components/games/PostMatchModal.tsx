import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { BackendFixture, Card, GameRegistrationPayload } from '../../types/api';
import { Tournament } from '../../types/tournament';
import { CardPicker } from '../cards/CardPicker';
import { DeckDisplay } from '../cards/DeckDisplay';
import { matchesApi } from '../../services/matchesApi';
import { CLASH_ROYALE_CARDS, CARD_MAP } from '../../data/cards';
import { useNotifications } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';
import { Trophy, AlertCircle, Check, Swords, Crown, Sparkles } from 'lucide-react';

interface PostMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixture: BackendFixture;
  tournament: Tournament;
  onSuccess: () => void;
}

export const PostMatchModal: React.FC<PostMatchModalProps> = ({
  isOpen,
  onClose,
  fixture,
  tournament,
  onSuccess,
}) => {
  const { showNotification } = useNotifications();

  const [activePlayerDeckTab, setActivePlayerDeckTab] = useState<'p1' | 'p2'>('p1');
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [p1Crowns, setP1Crowns] = useState<number>(2);
  const [p2Crowns, setP2Crowns] = useState<number>(1);
  const [gameNumber, setGameNumber] = useState<number>(1);

  // 8 Cards for each player
  const [p1CardIds, setP1CardIds] = useState<number[]>([]);
  const [p2CardIds, setP2CardIds] = useState<number[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Calculate cooldowns for each player
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

  const p1BannedIds = new Set(
    (fixture.player1.bannedCards?.map((c) => c.id) || []).concat(
      p1Cooldowns.bannedCards.map((c) => c.id)
    )
  );

  const p2BannedIds = new Set(
    (fixture.player2.bannedCards?.map((c) => c.id) || []).concat(
      p2Cooldowns.bannedCards.map((c) => c.id)
    )
  );

  const p1Cards = p1CardIds.map((id) => CARD_MAP.get(id)).filter(Boolean) as Card[];
  const p2Cards = p2CardIds.map((id) => CARD_MAP.get(id)).filter(Boolean) as Card[];

  // Duplicate deck check
  const isP1Duplicate = tournament.ban_duplicate_decks && matchesApi.checkDuplicateDeck(fixture.player1.id, p1CardIds);
  const isP2Duplicate = tournament.ban_duplicate_decks && matchesApi.checkDuplicateDeck(fixture.player2.id, p2CardIds);

  const handleToggleP1Card = (card: Card) => {
    if (p1CardIds.includes(card.id)) {
      setP1CardIds((prev) => prev.filter((id) => id !== card.id));
    } else {
      if (p1CardIds.length >= 8) return;
      if (tournament.cooldown_duration > 0 && p1BannedIds.has(card.id)) {
        showNotification('warning', 'Card on Cooldown', `${card.name} is currently exhausted for ${fixture.player1.name}.`);
        return;
      }
      setP1CardIds((prev) => [...prev, card.id]);
    }
  };

  const handleToggleP2Card = (card: Card) => {
    if (p2CardIds.includes(card.id)) {
      setP2CardIds((prev) => prev.filter((id) => id !== card.id));
    } else {
      if (p2CardIds.length >= 8) return;
      if (tournament.cooldown_duration > 0 && p2BannedIds.has(card.id)) {
        showNotification('warning', 'Card on Cooldown', `${card.name} is currently exhausted for ${fixture.player2.name}.`);
        return;
      }
      setP2CardIds((prev) => [...prev, card.id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validations
    if (!winnerId) {
      setValidationError('Please designate the match winner.');
      return;
    }

    if (p1Crowns < 0 || p2Crowns < 0) {
      setValidationError('Crown counts must be non-negative integers.');
      return;
    }

    if (p1CardIds.length !== 8) {
      setValidationError(`${fixture.player1.name}'s deck requires exactly 8 cards (currently ${p1CardIds.length}/8).`);
      return;
    }

    if (p2CardIds.length !== 8) {
      setValidationError(`${fixture.player2.name}'s deck requires exactly 8 cards (currently ${p2CardIds.length}/8).`);
      return;
    }

    if (isP1Duplicate) {
      setValidationError(`${fixture.player1.name} has already used this exact 8-card combination in this tournament.`);
      return;
    }

    if (isP2Duplicate) {
      setValidationError(`${fixture.player2.name} has already used this exact 8-card combination in this tournament.`);
      return;
    }

    const payload: GameRegistrationPayload = {
      gameNumber,
      winnerId,
      player1: {
        crowns: Number(p1Crowns),
        cardIds: p1CardIds,
      },
      player2: {
        crowns: Number(p2Crowns),
        cardIds: p2CardIds,
      },
    };

    setSubmitting(true);
    try {
      const response = await matchesApi.registerGame(
        fixture.matchId,
        payload,
        tournament.id,
        fixture.player1.id,
        fixture.player2.id
      );

      // Celebrate!
      void confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showNotification('success', 'Game Registered', response.message);
      onSuccess();
      onClose();
    } catch (err) {
      setValidationError((err as Error).message || 'Failed to submit match results to API.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Game Results: Match #${fixture.matchNumber}`}
      description="Enter winner, crowns, and 8-card deck selections for authoritative backend validation."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Registration Error</strong>
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Game Number and Winner Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Game Number
            </label>
            <input
              type="number"
              min={1}
              max={tournament.match_format_bo}
              value={gameNumber}
              onChange={(e) => setGameNumber(Number(e.target.value))}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Designate Winner *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWinnerId(fixture.player1.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  winnerId === fixture.player1.id
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${winnerId === fixture.player1.id ? 'fill-white' : ''}`} />
                <span>{fixture.player1.name} (P1)</span>
              </button>

              <button
                type="button"
                onClick={() => setWinnerId(fixture.player2.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  winnerId === fixture.player2.id
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${winnerId === fixture.player2.id ? 'fill-white' : ''}`} />
                <span>{fixture.player2.name} (P2)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Crown Counters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-2xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
              {fixture.player1.name} Crowns
            </label>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setP1Crowns(num)}
                  className={`w-10 h-10 rounded-xl font-bold font-display text-base transition-all cursor-pointer ${
                    p1Crowns === num
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-2xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
              {fixture.player2.name} Crowns
            </label>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setP2Crowns(num)}
                  className={`w-10 h-10 rounded-xl font-bold font-display text-base transition-all cursor-pointer ${
                    p2Crowns === num
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Deck Picker Tabs */}
        <div>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <button
              type="button"
              onClick={() => setActivePlayerDeckTab('p1')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
                activePlayerDeckTab === 'p1'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{fixture.player1.name}'s Deck</span>
              <span className="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-full font-bold">
                {p1CardIds.length}/8
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlayerDeckTab('p2')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
                activePlayerDeckTab === 'p2'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{fixture.player2.name}'s Deck</span>
              <span className="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-full font-bold">
                {p2CardIds.length}/8
              </span>
            </button>
          </div>

          {/* Player 1 Deck Builder */}
          {activePlayerDeckTab === 'p1' && (
            <div className="space-y-4 animate-fadeIn">
              <DeckDisplay
                cards={p1Cards}
                onRemoveCard={(id) => setP1CardIds((prev) => prev.filter((cid) => cid !== id))}
                title={`${fixture.player1.name}'s 8-Card Selection`}
                isInvalidDuplicate={isP1Duplicate}
              />
              <CardPicker
                selectedCardIds={p1CardIds}
                onToggleCard={handleToggleP1Card}
                bannedCardIds={p1BannedIds}
                cardCooldowns={p1Cooldowns.remainingMatches}
              />
            </div>
          )}

          {/* Player 2 Deck Builder */}
          {activePlayerDeckTab === 'p2' && (
            <div className="space-y-4 animate-fadeIn">
              <DeckDisplay
                cards={p2Cards}
                onRemoveCard={(id) => setP2CardIds((prev) => prev.filter((cid) => cid !== id))}
                title={`${fixture.player2.name}'s 8-Card Selection`}
                isInvalidDuplicate={isP2Duplicate}
              />
              <CardPicker
                selectedCardIds={p2CardIds}
                onToggleCard={handleToggleP2Card}
                bannedCardIds={p2BannedIds}
                cardCooldowns={p2Cooldowns.remainingMatches}
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {p1CardIds.length === 8 && p2CardIds.length === 8 && winnerId ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Ready for backend submission
              </span>
            ) : (
              <span className="text-amber-400">
                Complete winner designation and 8 cards per player before submitting.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              icon={<Check className="w-4 h-4" />}
            >
              Submit Game Result
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
