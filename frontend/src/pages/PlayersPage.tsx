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
      showNotification('error', 'Error', 'Could not load the roster.');
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
      showNotification('success', 'Profile Updated', `${updated.name}'s profile has been updated.`);
    } else {
      const created = await playersApi.create(input);
      setPlayers((prev) => [...prev, created]);
      showNotification('success', 'Player Saved', `${created.name} has been added to the roster.`);
    }
  };

  const handleDeletePlayer = async () => {
    if (!deletePlayerTarget) return;
    setDeleting(true);
    try {
      await playersApi.delete(deletePlayerTarget.id);
      setPlayers((prev) => prev.filter((p) => p.id !== deletePlayerTarget.id));
      showNotification('success', 'Player Deleted', `${deletePlayerTarget.name} has been removed from the roster.`);
      setDeletePlayerTarget(null);
    } catch {
      showNotification('error', 'Error', 'Could not delete player.');
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
              Player Roster
            </h2>
            <p className="text-xs text-blue-100/70 mt-0.5">
              Manage players, Clash Royale tags, and match history.
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
          Add Player
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
            placeholder="Search by name or tag (#829PL90Q)..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0b2559] focus:ring-2 focus:ring-[#0b2559]/10 shadow-sm transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          <span className="font-bold text-slate-800">{filteredPlayers.length}</span> of {players.length} players
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0b2559]" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading roster...</span>
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
          <h3 className="font-display font-bold text-lg text-slate-800">No Players Found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">
            {searchTerm
              ? `No players match "${searchTerm}". Try another name or tag.`
              : 'The roster is empty. Add players to get started.'}
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
            Premier Player
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
        title="Remove Player from Roster"
        message={`Are you sure you want to remove ${deletePlayerTarget?.name} (${deletePlayerTarget?.player_tag})? This action cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
