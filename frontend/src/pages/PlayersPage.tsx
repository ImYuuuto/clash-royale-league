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
      showNotification('error', 'Error', 'Failed to load players roster.');
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
      showNotification('success', 'Profile Updated', `${updated.name}'s profile was updated.`);
    } else {
      const created = await playersApi.create(input);
      setPlayers((prev) => [...prev, created]);
      showNotification('success', 'Player Registered', `${created.name} was added to the Global Roster.`);
    }
  };

  const handleDeletePlayer = async () => {
    if (!deletePlayerTarget) return;
    setDeleting(true);
    try {
      await playersApi.delete(deletePlayerTarget.id);
      setPlayers((prev) => prev.filter((p) => p.id !== deletePlayerTarget.id));
      showNotification('success', 'Player Removed', `${deletePlayerTarget.name} was removed from the roster.`);
      setDeletePlayerTarget(null);
    } catch {
      showNotification('error', 'Error', 'Could not delete player.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#141b2b] to-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Global Players Roster
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage professional competitors, Clash Royale tags, and performance histories.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingPlayer(null);
            setModalOpen(true);
          }}
          icon={<UserPlus className="w-4 h-4" />}
        >
          Add Player
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roster by player name or tag (e.g. #829PL90Q)..."
            className="w-full bg-[#0d111a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="font-bold text-white">{filteredPlayers.length}</span> of {players.length} Competitors
        </div>
      </div>

      {/* Grid of Players */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading Roster Database...</span>
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
        <div className="bg-[#121724] border border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">No Players Found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">
            {searchTerm
              ? `No players matched the search term "${searchTerm}". Try a different name or tag.`
              : 'The global roster is currently empty. Register players to start building leagues.'}
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
            Register First Player
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
        confirmLabel="Remove Player"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
