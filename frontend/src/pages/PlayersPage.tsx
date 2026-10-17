import React, { useState, useEffect, useMemo } from 'react';
import { Player, CreatePlayerInput } from '../types/player';
import { playersApi } from '../services/playersApi';
import { PlayerCard } from '../components/players/PlayerCard';
import { PlayerModal } from '../components/players/PlayerModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../context/NotificationContext';
import { Users, UserPlus, Search, Loader2 } from 'lucide-react';

export const PlayersPage: React.FC = () => {
  const { showNotification } = useNotifications();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Delete confirmation
  const [deletePlayerTarget, setDeletePlayerTarget] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await playersApi.getAll();
      setPlayers(data);
    } catch {
      showNotification('error', 'Erreur', 'Impossible de charger le roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.player_tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  const handleSavePlayer = async (input: CreatePlayerInput) => {
    if (editingPlayer) {
      const updated = await playersApi.update(editingPlayer.id, input);
      setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showNotification('success', 'Profil Mis à Jour', `Le profil de ${updated.name} a été mis à jour.`);
    } else {
      const created = await playersApi.create(input);
      setPlayers((prev) => [...prev, created]);
      showNotification('success', 'Joueur Enregistré', `${created.name} a été ajouté au Roster.`);
    }
  };

  const handleDeletePlayer = async () => {
    if (!deletePlayerTarget) return;
    setDeleting(true);
    try {
      await playersApi.delete(deletePlayerTarget.id);
      setPlayers((prev) => prev.filter((p) => p.id !== deletePlayerTarget.id));
      showNotification('success', 'Joueur Supprimé', `${deletePlayerTarget.name} a été retiré du roster.`);
      setDeletePlayerTarget(null);
    } catch {
      showNotification('error', 'Erreur', 'Impossible de supprimer le joueur.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0b2559] to-[#1746a0] p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Roster des Joueurs
            </h2>
            <p className="text-xs text-blue-100/70 mt-0.5">
              Gestion des compétiteurs, tags Clash Royale et historiques.
            </p>
          </div>
        </div>

        <Button
          variant="gold"
          onClick={() => {
            setEditingPlayer(null);
            setModalOpen(true);
          }}
          icon={<UserPlus className="w-4 h-4" />}
        >
          Ajouter Joueur
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou tag (#829PL90Q)..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0b2559] focus:ring-2 focus:ring-[#0b2559]/10 shadow-sm transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          <span className="font-bold text-slate-800">{filteredPlayers.length}</span> sur {players.length} joueurs
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0b2559]" />
          <span className="text-xs font-semibold tracking-wider uppercase">Chargement du Roster...</span>
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={(p) => {
                setEditingPlayer(p);
                setModalOpen(true);
              }}
              onDelete={(p) => setDeletePlayerTarget(p)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-800">Aucun Joueur Trouvé</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">
            {searchTerm
              ? `Aucun joueur ne correspond à "${searchTerm}". Essayez un autre nom ou tag.`
              : 'Le roster est vide. Enregistrez des joueurs pour commencer.'}
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setSearchTerm('');
              setEditingPlayer(null);
              setModalOpen(true);
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Premier Joueur
          </Button>
        </div>
      )}

      {/* Add / Edit Modal */}
      <PlayerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSavePlayer}
        initialPlayer={editingPlayer}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletePlayerTarget)}
        onClose={() => setDeletePlayerTarget(null)}
        onConfirm={handleDeletePlayer}
        title="Retirer le Joueur du Roster"
        message={`Êtes-vous sûr de vouloir retirer ${deletePlayerTarget?.name} (${deletePlayerTarget?.player_tag}) ? Cette action est irréversible.`}
        confirmLabel="Retirer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
