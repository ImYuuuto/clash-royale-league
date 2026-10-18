import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { BackendFixture, Card, GameRegistrationPayload } from '../../types/api';
import { Tournament } from '../../types/tournament';
import { CardPicker } from '../cards/CardPicker';
import { DeckDisplay } from '../cards/DeckDisplay';
import { matchesApi } from '../../services/matchesApi';
import { useNotifications } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';
import { AlertCircle, Check, Crown, Sparkles } from 'lucide-react';

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
  const gameNumber = fixture.nextGameNumber || 1;
  const isEditing = Boolean(fixture.game);

  // 8 Cards for each player
  const [p1CardIds, setP1CardIds] = useState<number[]>([]);
  const [p2CardIds, setP2CardIds] = useState<number[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const p1BannedCards = fixture.player1.bannedCards || [];
  const p2BannedCards = fixture.player2.bannedCards || [];
  const p1BannedIds = new Set(p1BannedCards.map((card) => card.id));
  const p2BannedIds = new Set(p2BannedCards.map((card) => card.id));
  const p1Cooldowns = new Map(p1BannedCards.map((card) => [card.id, card.remainingCooldownGames || 1]));
  const p2Cooldowns = new Map(p2BannedCards.map((card) => [card.id, card.remainingCooldownGames || 1]));
  const cards = useMemo(() => {
    const byId = new Map<number, Card>();
    for (const card of [
      ...(fixture.player1.availableCards || []), ...p1BannedCards,
      ...(fixture.player2.availableCards || []), ...p2BannedCards,
    ]) byId.set(card.id, card);
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [fixture, p1BannedCards, p2BannedCards]);

  // Full card objects
  const p1Cards: Card[] = p1CardIds
    .map((id) => cards.find((card) => card.id === id))
    .filter((c): c is Card => Boolean(c));

  const p2Cards: Card[] = p2CardIds
    .map((id) => cards.find((card) => card.id === id))
    .filter((c): c is Card => Boolean(c));

  useEffect(() => {
    if (!isOpen) return;
    setWinnerId(fixture.game?.winnerId ?? null);
    setP1Crowns(fixture.game?.player1Crowns ?? 2);
    setP2Crowns(fixture.game?.player2Crowns ?? 1);
    setP1CardIds(fixture.game?.player1CardIds ?? []);
    setP2CardIds(fixture.game?.player2CardIds ?? []);
    setValidationError('');
    setActivePlayerDeckTab('p1');
  }, [isOpen, fixture.matchId, fixture.nextGameNumber]);

  const handleToggleP1Card = (card: Card) => {
    if (p1CardIds.includes(card.id)) {
      setP1CardIds((prev) => prev.filter((id) => id !== card.id));
    } else {
      if (p1CardIds.length >= 8) return;
      if (!isEditing && tournament.cooldown_duration > 0 && p1BannedIds.has(card.id)) {
        showNotification('warning', 'Card on Cooldown', `${card.name} is currently locked for ${fixture.player1.name}.`);
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
      if (!isEditing && tournament.cooldown_duration > 0 && p2BannedIds.has(card.id)) {
        showNotification('warning', 'Card on Cooldown', `${card.name} is currently locked for ${fixture.player2.name}.`);
        return;
      }
      setP2CardIds((prev) => [...prev, card.id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (cards.length === 0) {
      setValidationError('The card catalog is unavailable. Refresh fixtures after restoring the server connection.');
      return;
    }

    // Validations
    if (!winnerId) {
      setValidationError('Select the match winner.');
      return;
    }

    if (p1Crowns < 0 || p2Crowns < 0) {
      setValidationError('Crown count must be zero or greater.');
      return;
    }

    if (p1CardIds.length !== 8) {
      setValidationError(`${fixture.player1.name}'s deck must contain exactly 8 cards (${p1CardIds.length}/8).`);
      return;
    }

    if (p2CardIds.length !== 8) {
      setValidationError(`${fixture.player2.name}'s deck must contain exactly 8 cards (${p2CardIds.length}/8).`);
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
      const response = fixture.game
        ? await matchesApi.updateGame(fixture.matchId, fixture.game.id, { ...payload, gameNumber: fixture.game.gameNumber ?? gameNumber })
        : await matchesApi.registerGame(fixture.matchId, payload);

      // Celebrate!
      if (!isEditing) confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ffffff'],
      });

      showNotification(
        'success',
        isEditing ? 'Result Updated' : 'Result Submitted!',
        isEditing
          ? `Match #${fixture.matchNumber} result updated.`
          : response.data?.fixtureCompleted
          ? `Match #${fixture.matchNumber} is complete.`
          : `Match saved.`
      );

      onSuccess();
      onClose();
    } catch (err) {
      setValidationError((err as Error).message || "Failed to save the game.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEditing ? 'Edit' : 'Save'} Result: Match #${fixture.matchNumber}`}
      description={`${isEditing ? 'Edit' : 'Enter'} the winner, crown counts, and 8-card decks.`}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Validation Error</strong>
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Game Number and Winner Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/90 p-4 rounded-2xl">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Match
            </label>
            <div className="text-sm font-bold text-[#0b2559]">Single Match</div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select the Winner *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWinnerId(fixture.player1.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  winnerId === fixture.player1.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${winnerId === fixture.player1.id ? 'fill-white' : ''}`} />
                <span>{fixture.player1.name} (Blue)</span>
              </button>

              <button
                type="button"
                onClick={() => setWinnerId(fixture.player2.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  winnerId === fixture.player2.id
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${winnerId === fixture.player2.id ? 'fill-white' : ''}`} />
                <span>{fixture.player2.name} (Red)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Crown Counters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">
              Crowns • {fixture.player1.name}
            </label>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setP1Crowns(num)}
                  className={`w-10 h-10 rounded-xl font-bold font-display text-base transition-all cursor-pointer ${
                    p1Crowns === num
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">
              Crowns • {fixture.player2.name}
            </label>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setP2Crowns(num)}
                  className={`w-10 h-10 rounded-xl font-bold font-display text-base transition-all cursor-pointer ${
                    p2Crowns === num
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
            <button
              type="button"
              onClick={() => setActivePlayerDeckTab('p1')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
                activePlayerDeckTab === 'p1'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span>Deck de {fixture.player1.name}</span>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-bold">
                {p1CardIds.length}/8
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlayerDeckTab('p2')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
                activePlayerDeckTab === 'p2'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span>Deck de {fixture.player2.name}</span>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-bold">
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
                title={`Selected Deck: ${fixture.player1.name}`}
                isInvalidDuplicate={false}
              />
              <CardPicker
                cards={cards}
                selectedCardIds={p1CardIds}
                onToggleCard={handleToggleP1Card}
                bannedCardIds={p1BannedIds}
                cardCooldowns={p1Cooldowns}
              />
            </div>
          )}

          {/* Player 2 Deck Builder */}
          {activePlayerDeckTab === 'p2' && (
            <div className="space-y-4 animate-fadeIn">
              <DeckDisplay
                cards={p2Cards}
                onRemoveCard={(id) => setP2CardIds((prev) => prev.filter((cid) => cid !== id))}
                title={`Selected Deck: ${fixture.player2.name}`}
                isInvalidDuplicate={false}
              />
              <CardPicker
                cards={cards}
                selectedCardIds={p2CardIds}
                onToggleCard={handleToggleP2Card}
                bannedCardIds={p2BannedIds}
                cardCooldowns={p2Cooldowns}
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-200 gap-4">
          <div className="text-xs text-slate-500 font-semibold">
            {p1CardIds.length === 8 && p2CardIds.length === 8 && winnerId ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Ready for Official Submission
              </span>
            ) : (
              <span className="text-amber-600 font-semibold">
                Select a winner and choose 8 cards for each player to submit.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="gold"
              type="submit"
              loading={submitting}
              icon={<Check className="w-4 h-4" />}
            >
              Submit Result
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
