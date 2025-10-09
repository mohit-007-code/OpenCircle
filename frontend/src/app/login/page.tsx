// app/communities/create/page.tsx
'use client';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { Upload, X, ArrowLeft } from 'lucide-react';

export default function CreateCommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [displayPicture, setDisplayPicture] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [dpPreview, setDpPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center w-full">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'dp' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'dp') {
          setDisplayPicture(file);
          setDpPreview(reader.result as string);
        } else {
          setCoverImage(file);
          setCoverPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (type: 'dp' | 'cover') => {
    if (type === 'dp') {
      setDisplayPicture(null);
      setDpPreview(null);
    } else {
      setCoverImage(null);
      setCoverPreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    if (displayPicture) formDataToSend.append('display_picture', displayPicture);
    if (coverImage) formDataToSend.append('cover_image', coverImage);

    try {
      await api.post('/communities/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      router.push('/communities');
    } catch (err: any) {
      setError(err.response?.data?.name?.[0] || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white w-full">
      <Navbar />

      <div className="w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create Community</h1>
            <p className="text-zinc-400">Start your own community and invite others to join</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
                {error}
              </div>
            )}

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium mb-3">Cover Image</label>
              <div className="relative h-56 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl overflow-hidden group">
                {coverPreview && (
                  <>
                    <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage('cover')}
                      className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-all z-10"
                    >
                      <X size={20} />
                    </button>
                  </>
                )}
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/30 hover:bg-black/40 transition-all">
                  <Upload size={40} className="text-white mb-3" />
                  <span className="text-white font-medium text-lg">
                    {coverPreview ? 'Change Cover Image' : 'Upload Cover Image'}
                  </span>
                  <span className="text-zinc-300 text-sm mt-1">Recommended: 1200x400px</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'cover')}
                  />
                </label>
              </div>
            </div>

            {/* Display Picture */}
            <div>
              <label className="block text-sm font-medium mb-3">Display Picture</label>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 rounded-2xl bg-zinc-900 overflow-hidden group">
                  {dpPreview ? (
                    <>
                      <Image src={dpPreview} alt="DP" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage('dp')}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-all z-10"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-700">
                      ?
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all">
                    <Upload size={18} />
                    <span className="font-medium">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'dp')}
                    />
                  </label>
                  <p className="text-sm text-zinc-500 mt-2">Recommended: 400x400px</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Community Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-500"
                placeholder="e.g., Web Developers"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                required
                maxLength={500}
                rows={5}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-500 resize-none"
                placeholder="Describe your community..."
                value={formData.description}
                onChange={handleChange}
              />
              <p className="text-sm text-zinc-500 mt-2">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </span>
                ) : (
                  'Create Community'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
