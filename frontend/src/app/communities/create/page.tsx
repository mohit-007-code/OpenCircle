// app/communities/create/page.tsx
'use client';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-5">
        <Sidebar />

        <main className="flex-1 max-w-3xl">
          {/* Header */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#818384] hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-4">
            <h1 className="text-2xl font-bold mb-2">Create a Community</h1>
            <p className="text-[#818384]">Build and grow a community about something you care about</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}

            {/* Cover Image */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-4">
              <label className="block text-sm font-semibold mb-3">Cover Image</label>
              <div className="relative h-40 bg-gradient-to-r from-[#ff4500] to-[#ff6a00] rounded-lg overflow-hidden group">
                {coverPreview && (
                  <>
                    <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage('cover')}
                      className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black rounded-lg transition-all z-10"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-all">
                  <Upload size={32} className="text-white mb-2" />
                  <span className="text-white text-sm font-medium">
                    {coverPreview ? 'Change Cover' : 'Upload Cover'}
                  </span>
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
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-4">
              <label className="block text-sm font-semibold mb-3">Community Icon</label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full bg-[#272729] overflow-hidden">
                  {dpPreview ? (
                    <>
                      <Image src={dpPreview} alt="DP" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage('dp')}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black rounded-full transition-all z-10"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#818384]">
                      ?
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#272729] hover:bg-[#343536] border border-[#343536] rounded-full text-sm font-medium transition-colors">
                    <Upload size={16} />
                    <span>Upload Icon</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'dp')}
                    />
                  </label>
                  <p className="text-xs text-[#818384] mt-2">Recommended size: 256x256px</p>
                </div>
              </div>
            </div>

            {/* Community Name */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-4">
              <label className="block text-sm font-semibold mb-2">
                Name <span className="text-[#ff4500]">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                maxLength={100}
                className="w-full px-4 py-2.5 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                placeholder="Community name"
                value={formData.name}
                onChange={handleChange}
              />
              <p className="text-xs text-[#818384] mt-2">
                Community names cannot be changed
              </p>
            </div>

            {/* Description */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-4">
              <label className="block text-sm font-semibold mb-2">
                Description <span className="text-[#ff4500]">*</span>
              </label>
              <textarea
                name="description"
                required
                maxLength={500}
                rows={4}
                className="w-full px-4 py-2.5 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384] resize-none"
                placeholder="What is your community about?"
                value={formData.description}
                onChange={handleChange}
              />
              <p className="text-xs text-[#818384] mt-2">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 bg-[#272729] hover:bg-[#343536] rounded-full font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
