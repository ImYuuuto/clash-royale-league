import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Player, CreatePlayerInput } from '../../types/player';
import { User, Tag, Image, Check } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePlayerInput) => Promise<void>;
  initialPlayer?: Player | null;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
];

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPlayer,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialPlayer) {
      setName(initialPlayer.name);
      setTag(initialPlayer.player_tag);
      setAvatarUrl(initialPlayer.avatar_url || '');
    } else {
      setName('');
      setTag('');
      setAvatarUrl('');
    }
    setError('');
  }, [initialPlayer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedTag = tag.trim().toUpperCase();

    if (!trimmedName) {
      setError('Player name is required.');
      return;
    }

    if (!trimmedTag || !trimmedTag.match(/^#?[0-9A-Z]{3,12}$/)) {
      setError('Enter a valid Clash Royale player tag (e.g. #829PL90Q).');
      return;
    }

    const formattedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;

    setLoading(true);
    try {
      await onSubmit({
        name: trimmedName,
        player_tag: formattedTag,
        avatar_url: avatarUrl,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Could not save player.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPlayer ? 'Edit Player Profile' : 'Add Player'}
      description="Add or edit a player in the official roster."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5 uppercase">
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span>Player Name</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mohamed Light"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5 uppercase">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>Tag Clash Royale</span>
          </label>
          <input
            type="text"
            required
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. #829PL90Q"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all uppercase font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 uppercase">
            <Image className="w-3.5 h-3.5 text-amber-500" />
            <span>Choose an Avatar</span>
          </label>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setAvatarUrl('')}
              className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-transform cursor-pointer shrink-0 bg-amber-100 text-amber-800 font-bold flex items-center justify-center ${
                !avatarUrl
                  ? 'border-amber-500 ring-2 ring-amber-400 scale-105 shadow-md'
                  : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
              }`}
              aria-label="Use player initial"
              title="Use player initial"
            >
              {name.trim().charAt(0) || '?'}
            </button>
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarUrl(url)}
                className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-transform cursor-pointer shrink-0 ${
                  avatarUrl === url
                    ? 'border-amber-500 ring-2 ring-amber-400 scale-105 shadow-md'
                    : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
                }`}
              >
                <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="gold" type="submit" loading={loading} icon={<Check className="w-4 h-4" />}>
            {initialPlayer ? 'Save Changes' : 'Add Player'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
