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
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
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
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialPlayer) {
      setName(initialPlayer.name);
      setTag(initialPlayer.player_tag);
      setAvatarUrl(initialPlayer.avatar_url || PRESET_AVATARS[0]);
    } else {
      setName('');
      setTag('');
      setAvatarUrl(PRESET_AVATARS[0]);
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
      setError('Please provide a valid Clash Royale player tag (e.g. #829PL90Q).');
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
      setError((err as Error).message || 'Failed to save player.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPlayer ? 'Edit Player Profile' : 'Register New Player'}
      description="Add a competitor to the Global League Roster."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>PLAYER NAME</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mohamed Light"
            className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>CLASH ROYALE TAG</span>
          </label>
          <input
            type="text"
            required
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. #829PL90Q"
            className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-amber-400" />
            <span>SELECT AVATAR</span>
          </label>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarUrl(url)}
                className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-transform cursor-pointer shrink-0 ${
                  avatarUrl === url
                    ? 'border-amber-400 scale-110 shadow-lg shadow-amber-500/30'
                    : 'border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} icon={<Check className="w-4 h-4" />}>
            {initialPlayer ? 'Save Changes' : 'Register Player'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
