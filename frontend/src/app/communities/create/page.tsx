// app/communities/create/page.tsx
'use client';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Upload, X, ArrowLeft, ImageIcon, Sparkles, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <Sidebar />

        {/* ✨ FIXED: Added pb-24 for mobile spacing */}
        <main className="flex-1 min-w-0 max-w-3xl pb-24 lg:pb-0">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-5 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 sm:p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/20">
                <Sparkles size={24} className="text-zinc-950" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create a Community</h1>
                <p className="text-zinc-400 text-sm">Build and grow a community about something you care about</p>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-effect bg-red-500/10 backdrop-blur-xl border border-red-500/50 rounded-2xl p-4 text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cover Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 sm:p-6"
            >
              <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-white">
                <ImageIcon size={18} className="text-white" />
                Cover Image
              </label>
              <div className="relative h-40 sm:h-48 bg-white rounded-xl overflow-hidden group">
                {coverPreview && (
                  <>
                    <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage('cover')}
                      className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black rounded-xl transition-all z-10 backdrop-blur-sm"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/20 hover:bg-black/40 transition-all">
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
            </motion.div>

            {/* Display Picture */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 sm:p-6"
            >
              <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-white">
                <ImageIcon size={18} className="text-white" />
                Community Icon
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl bg-white overflow-hidden shadow-lg shadow-white/20">
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
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-950">
                      ?
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex text-white items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105">
                    <Upload size={16} />
                    <span>Upload Icon</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'dp')}
                    />
                  </label>
                  <p className="text-xs text-zinc-500 mt-2">Recommended size: 256x256px</p>
                </div>
              </div>
            </motion.div>

            {/* Community Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 sm:p-6"
            >
              <label className="block text-sm font-semibold mb-2 text-white">
                Name <span className="text-white">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300"
                placeholder="Community name"
                value={formData.name}
                onChange={handleChange}
              />
              <p className="text-xs text-zinc-500 mt-2">
                Community names cannot be changed
              </p>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 sm:p-6"
            >
              <label className="block text-sm font-semibold mb-2 text-white">
                Description <span className="text-white">*</span>
              </label>
              <textarea
                name="description"
                required
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 resize-none"
                placeholder="What is your community about?"
                value={formData.description}
                onChange={handleChange}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-zinc-500">
                  {formData.description.length}/500 characters
                </p>
                <div className={`text-xs font-medium ${
                  formData.description.length > 450 ? 'text-yellow-500' : 'text-zinc-500'
                }`}>
                  {formData.description.length > 450 && `${500 - formData.description.length} left`}
                </div>
              </div>
            </motion.div>

            {/* ✨ FIXED: Buttons now visible with proper spacing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-white/20 hover:shadow-white/30 hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </span>
                ) : (
                  'Create Community'
                )}
              </button>
            </motion.div>
          </form>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            {/* Community Rules Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden"
            >
              <div className="h-16 bg-white relative overflow-hidden flex items-center justify-center">
                <Shield size={28} className="text-zinc-950" />
              </div>

              <div className="p-5">
                <h3 className="font-bold text-lg mb-3 text-white flex items-center gap-2">
                  <Shield size={20} className="text-white" />
                  Community Rules
                </h3>
                <p className="text-sm text-zinc-400 mb-5">
                  Follow these guidelines to create a successful community
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                    <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-white mb-1">Choose a unique name</p>
                      <p className="text-xs text-zinc-500">Pick a memorable name that represents your community</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                    <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-white mb-1">Clear description</p>
                      <p className="text-xs text-zinc-500">Explain what your community is about in detail</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                    <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-white mb-1">Upload quality images</p>
                      <p className="text-xs text-zinc-500">Use high-quality cover and icon images</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                    <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-white mb-1">Be respectful</p>
                      <p className="text-xs text-zinc-500">No hate speech, harassment, or inappropriate content</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                    <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-white mb-1">Stay on topic</p>
                      <p className="text-xs text-zinc-500">Keep content relevant to your community's purpose</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/50">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <span className="font-semibold text-zinc-400">Note:</span> Community names cannot be changed after creation. Make sure to choose wisely!
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5"
            >
              <h3 className="font-bold text-lg mb-2 text-white flex items-center gap-2">
                <Sparkles size={18} className="text-white" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1">•</span>
                  <span>Use keywords in your description for better discovery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1">•</span>
                  <span>Post regularly to keep members engaged</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1">•</span>
                  <span>Respond to comments and build relationships</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </aside>
      </div>
    </div>
  );
}
