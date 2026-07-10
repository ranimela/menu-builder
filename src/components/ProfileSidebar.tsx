import React, { useState } from 'react';
import { User, Plus, Trash2, Edit2, Check, X, Users } from 'lucide-react';
import type { UserProfile } from '../types/food';

interface ProfileSidebarProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
  onRenameProfile: (id: string, name: string) => void;
  onCloseMobile?: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onRenameProfile,
  onCloseMobile
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      onCreateProfile(newProfileName.trim());
      setNewProfileName('');
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = (id: string) => {
    if (editingName.trim()) {
      onRenameProfile(id, editingName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-card border-r border-brand-border text-brand-primary">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Users className="h-5 w-5 text-brand-accent" />
          <span>User Profiles</span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 hover:bg-brand-bg rounded-lg transition text-slate-500 hover:text-brand-primary"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Profile List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {profiles.map(profile => {
          const isActive = profile.id === activeProfileId;
          const isEditing = profile.id === editingId;

          return (
            <div
              key={profile.id}
              className={`group flex items-center justify-between p-3 rounded-xl transition duration-200 ${
                isActive
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'hover:bg-brand-bg text-slate-700 hover:text-brand-primary'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="flex-1 bg-white text-brand-primary text-sm px-2 py-1 rounded border border-brand-border focus:outline-none focus:ring-1 focus:ring-brand-accent font-medium"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameSubmit(profile.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button
                    onClick={() => handleRenameSubmit(profile.id)}
                    className="p-1 hover:bg-emerald-600 rounded text-emerald-500 hover:text-white transition"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 hover:bg-rose-600 rounded text-rose-500 hover:text-white transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onSelectProfile(profile.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="flex-1 text-left flex items-center gap-2 font-semibold text-sm truncate mr-2"
                  >
                    <User className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'}`} />
                    <span className="truncate">{profile.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {profile.weight}kg
                    </span>
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(profile.id);
                        setEditingName(profile.name);
                      }}
                      className={`p-1 rounded transition ${isActive ? 'hover:bg-white/10 text-white/80' : 'hover:bg-slate-200 text-slate-400 hover:text-brand-primary'}`}
                      title="Rename Profile"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete profile "${profile.name}"?`)) {
                            onDeleteProfile(profile.id);
                          }
                        }}
                        className={`p-1 rounded transition ${isActive ? 'hover:bg-white/10 text-white/80' : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'}`}
                        title="Delete Profile"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Profile Section */}
      <div className="p-4 border-t border-brand-border">
        {isCreating ? (
          <form onSubmit={handleCreateSubmit} className="space-y-2">
            <input
              type="text"
              placeholder="Profile name..."
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              className="w-full bg-brand-bg text-brand-primary text-sm px-3 py-2 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-accent font-medium"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-brand-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-brand-primary/95 transition flex items-center justify-center gap-1"
              >
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewProfileName('');
                }}
                className="flex-1 bg-brand-bg border border-brand-border text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full border border-dashed border-brand-accent/40 text-brand-accent hover:bg-brand-accent/5 text-sm font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar;
