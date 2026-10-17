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

  // Full card objects
  const p1Cards: Card[] = p1CardIds
    .map((id) => CARD_MAP.get(id))
    .filter((c): c is Card => Boolean(c));

  const p2Cards: Card[] = p2CardIds
    .map((id) => CARD_MAP.get(id))
    .filter((c): c is Card => Boolean(c));

  // Check for duplicate deck
  const isP1Duplicate =
    tournament.ban_duplicate_decks && p1CardIds.length === 8
      ? matchesApi.checkDuplicateDeck(fixture.player1.id, p1CardIds)
      : false;

  const isP2Duplicate =
    tournament.ban_duplicate_decks && p2CardIds.length === 8
      ? matchesApi.checkDuplicateDeck(fixture.player2.id, p2CardIds)
      : false;

  const handleToggleP1Card = (card: Card) => {
    if (p1CardIds.includes(card.id)) {
      setP1CardIds((prev) => prev.filter((id) => id !== card.id));
    } else {
      if (p1CardIds.length >= 8) return;
      if (tournament.cooldown_duration > 0 && p1BannedIds.has(card.id)) {
        showNotification('warning', 'Carte en Cooldown', `${card.name} est actuellement verrouillée pour ${fixture.player1.name}.`);
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
        showNotification('warning', 'Carte en Cooldown', `${card.name} est actuellement verrouillée pour ${fixture.player2.name}.`);
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
      setValidationError('Veuillez désigner le vainqueur du match.');
      return;
    }

    if (p1Crowns < 0 || p2Crowns < 0) {
      setValidationError('Le nombre de couronnes doit être positif ou nul.');
      return;
    }

    if (p1CardIds.length !== 8) {
      setValidationError(`Le deck de ${fixture.player1.name} doit comporter exactement 8 cartes (${p1CardIds.length}/8).`);
      return;
    }

    if (p2CardIds.length !== 8) {
      setValidationError(`Le deck de ${fixture.player2.name} doit comporter exactement 8 cartes (${p2CardIds.length}/8).`);
      return;
    }

    if (isP1Duplicate) {
      setValidationError(`${fixture.player1.name} a déjà joué cette combinaison exacte de 8 cartes dans ce tournoi.`);
      return;
    }

    if (isP2Duplicate) {
      setValidationError(`${fixture.player2.name} a déjà joué cette combinaison exacte de 8 cartes dans ce tournoi.`);
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
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ffffff'],
      });

      showNotification(
        'success',
        'Résultat Validé !',
        response.data?.fixtureCompleted
          ? `La série de match #${fixture.matchNumber} est terminée avec succès !`
          : `Set #${gameNumber} enregistré.`
      );

      onSuccess();
      onClose();
    } catch (err) {
      setValidationError((err as Error).message || "Échec de l'enregistrement du set.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enregistrer le Résultat : Match #${fixture.matchNumber}`}
      description="Saisissez le vainqueur, les couronnes et les decks de 8 cartes pour la validation officielle."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Erreur de validation</strong>
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Game Number and Winner Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/90 p-4 rounded-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Numéro de Set
            </label>
            <input
              type="number"
              min={1}
              max={tournament.match_format_bo}
              value={gameNumber}
              onChange={(e) => setGameNumber(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Désigner le Vainqueur *
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
                <span>{fixture.player1.name} (Bleu)</span>
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
                <span>{fixture.player2.name} (Rouge)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Crown Counters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">
              Couronnes • {fixture.player1.name}
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
              Couronnes • {fixture.player2.name}
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
                title={`Deck Sélectionné : ${fixture.player1.name}`}
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
                title={`Deck Sélectionné : ${fixture.player2.name}`}
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
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-200 gap-4">
          <div className="text-xs text-slate-500 font-semibold">
            {p1CardIds.length === 8 && p2CardIds.length === 8 && winnerId ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Prêt pour validation officielle
              </span>
            ) : (
              <span className="text-amber-600 font-semibold">
                Désignez le vainqueur et composez 8 cartes par joueur pour soumettre.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button
              variant="gold"
              type="submit"
              loading={submitting}
              icon={<Check className="w-4 h-4" />}
            >
              Valider le Résultat
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
