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
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react';

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
    if (!name.trim() || !description.trim()) {
      showToast('Name and description are required', 'error');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('name', name);
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
      showToast(error.response?.data?.name?.[0] || 'Failed to update community', 'error');
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
      <div className="min-h-screen bg-[#0b0f14]">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-[#d93900] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
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

      <div className="max-w-[1400px] mx-auto flex gap-3 px-3 pt-4 pb-5">
        <Sidebar />

        <main className="flex-1">
          {/* Header */}
       

          {/* Form */}
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Cover Image */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
              <h3 className="font-semibold mb-4">Cover Image</h3>
              <div className="relative h-32 bg-gradient-to-r from-[#d93900] to-[#a62d00] rounded-lg overflow-hidden">
                {coverPreview && (
                  <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 cursor-pointer transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={32} />
                    <span className="text-sm">Change Cover</span>
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
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Display Picture */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
              <h3 className="font-semibold mb-4">Display Picture</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full bg-[#272729] overflow-hidden">
                  {dpPreview ? (
                    <Image src={dpPreview} alt="Display" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#d93900]">
                      {name[0]?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 cursor-pointer transition-colors">
                    <Upload size={20} />
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
                    className="px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
              <label className="block font-semibold mb-2">Community Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                placeholder="Enter community name"
                required
              />
            </div>

            {/* Description */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
              <label className="block font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384] resize-none"
                rows={4}
                placeholder="Describe your community"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-full font-semibold transition-colors"
              >
                <Trash2 size={18} />
                Delete Community
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/communities/${slug}`)}
                  className="px-6 py-3 bg-[#272729] hover:bg-[#343536] rounded-full font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#d93900] hover:bg-[#c13300] text-white rounded-full font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
