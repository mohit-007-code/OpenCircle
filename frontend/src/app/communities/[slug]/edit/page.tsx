// frontend/src/app/communities/[slug]/edit/page.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Community } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { ArrowLeft, Upload, X, Trash2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function EditCommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayPicture, setDisplayPicture] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [dpPreview, setDpPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (slug) {
      fetchCommunity();
    }
  }, [slug]);

  const fetchCommunity = async () => {
    try {
      const res = await api.get(`/communities/${slug}/`);
      const data = res.data;
      
      if (!data.is_creator) {
        showToast('Only the creator can edit this community', 'error');
        router.push(`/communities/${slug}`);
        return;
      }

      setCommunity(data);
      setName(data.name);
      setDescription(data.description);
      setDpPreview(getImageUrl(data.display_picture));
      setCoverPreview(getImageUrl(data.cover_image));
    } catch (error) {
      showToast('Failed to load community', 'error');
      router.push('/communities');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:8000${imageUrl}`;
  };

  const handleDpSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDisplayPicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Description is required', 'error');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('description', description);
    if (displayPicture) formData.append('display_picture', displayPicture);
    if (coverImage) formData.append('cover_image', coverImage);

    try {
      await api.patch(`/communities/${slug}/edit/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Community updated successfully!', 'success');
      setTimeout(() => router.push(`/communities/${slug}`), 1500);
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update community', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await api.delete(`/communities/${slug}/edit/`);
      setShowDeleteModal(false);
      showToast('Community deleted successfully', 'success');
      setTimeout(() => router.push('/communities'), 2000);
    } catch (error) {
      showToast('Failed to delete community', 'error');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Community"
        message={`Are you sure you want to delete "${community?.name}"? This action cannot be undone. All posts, members, and data will be permanently deleted.`}
        confirmText="Delete Community"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6 pb-32 sm:pb-6">
        <Sidebar />

        <main className="flex-1 min-w-0">
          {/* Header */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Community</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Edit Community</h1>
            <p className="text-sm sm:text-base text-zinc-400">Update your community's appearance and description</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleUpdate} className="space-y-5">
            {/* Cover Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 sm:p-6"
            >
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Upload size={18} />
                Cover Image
              </h3>
              <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-r from-white/10 to-white/5 rounded-xl overflow-hidden">
                {coverPreview && (
                  <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 cursor-pointer transition-colors group">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <Upload size={28} className="sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-xs sm:text-sm font-semibold">Change Cover</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverSelect}
                  />
                </label>
                {coverPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 sm:p-2 bg-black/70 hover:bg-black/90 rounded-lg sm:rounded-xl transition-all"
                  >
                    <X size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Display Picture */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 sm:p-6"
            >
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Upload size={18} />
                Display Picture
              </h3>
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-white overflow-hidden shadow-lg shadow-white/10 flex-shrink-0">
                  {dpPreview ? (
                    <Image src={dpPreview} alt="Display" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-950">
                      {name[0]?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 cursor-pointer transition-colors group">
                    <Upload size={20} className="sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDpSelect}
                    />
                  </label>
                </div>
                {dpPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayPicture(null);
                      setDpPreview(null);
                    }}
                    className="px-3 sm:px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                  >
                    Remove Picture
                  </button>
                )}
              </div>
            </motion.div>

            {/* Community Name (Read-only) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 sm:p-6"
            >
              <label className="block font-semibold text-white mb-3 text-sm sm:text-base">Community Name</label>
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800/30 border border-zinc-700/50 rounded-xl text-zinc-400 cursor-not-allowed text-sm sm:text-base">
                c/{name}
              </div>
              <p className="text-xs text-zinc-500 mt-2">Community name cannot be changed</p>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 sm:p-6"
            >
              <label className="block font-semibold text-white mb-3 text-sm sm:text-base">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 resize-none text-sm sm:text-base"
                rows={4}
                placeholder="Describe your community"
                required
              />
              <p className="text-xs text-zinc-500 mt-2">{description.length} characters</p>
            </motion.div>

            {/* Mobile Sticky Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              {/* Delete Button - Full Width on Mobile */}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base"
              >
                <Trash2 size={18} />
                Delete Community
              </button>

              {/* Cancel & Save Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/communities/${slug}`)}
                  className="flex-1 px-4 sm:px-6 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm sm:text-base"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </form>
        </main>
      </div>
    </div>
  );
}
