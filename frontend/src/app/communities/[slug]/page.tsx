// frontend/src/app/communities/[slug]/page.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Community, Post, CommunityMember } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { 
  Users, 
  Calendar, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Image as ImageIcon,
  X,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Shield,
  Crown,
  UserCog,
  Trash2,
} from 'lucide-react';

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');
  
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (slug) {
      fetchCommunityData();
    }
  }, [slug]);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const [communityRes, postsRes, membersRes] = await Promise.all([
        api.get(`/communities/${slug}/`),
        api.get(`/posts/community/${slug}/`),
        api.get(`/communities/${slug}/members/`)
      ]);

      setCommunity(communityRes.data);
      setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
      
      const membersData = membersRes.data?.results || membersRes.data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
      
    } catch (error: any) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await api.post(`/communities/${slug}/join/`);
      fetchCommunityData();
      showToast('Successfully joined the community!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to join community', 'error');
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this community?')) {
      try {
        await api.post(`/communities/${slug}/leave/`);
        fetchCommunityData();
        showToast('Left the community', 'info');
      } catch (error: any) {
        showToast(error.response?.data?.error || 'Failed to leave community', 'error');
      }
    }
  };

  const handlePromoteMember = async (userId: number) => {
    try {
      await api.post(`/communities/${slug}/members/${userId}/promote/`);
      fetchCommunityData();
      setSelectedMember(null);
      showToast('Member promoted to moderator!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to promote member', 'error');
    }
  };

  const handleDemoteMember = async (userId: number) => {
    try {
      await api.post(`/communities/${slug}/members/${userId}/demote/`);
      fetchCommunityData();
      setSelectedMember(null);
      showToast('Member demoted to regular member', 'info');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to demote member', 'error');
    }
  };

  const handleKickMember = async (userId: number, username: string) => {
    if (confirm(`Are you sure you want to remove ${username} from this community?`)) {
      try {
        await api.post(`/communities/${slug}/members/${userId}/kick/`);
        fetchCommunityData();
        setSelectedMember(null);
        showToast(`${username} has been removed`, 'warning');
      } catch (error: any) {
        showToast(error.response?.data?.error || 'Failed to remove member', 'error');
      }
    }
  };

  const handleDeletePostConfirm = async () => {
    if (!postToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/posts/${postToDelete}/`);
      fetchCommunityData();
      setPostToDelete(null);
      showToast('Post deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete post', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    setPosting(true);
    const formData = new FormData();
    formData.append('title', postTitle);
    formData.append('content', postContent);
    if (postImage) formData.append('image', postImage);

    try {
      await api.post(`/posts/community/${slug}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPostTitle('');
      setPostContent('');
      setPostImage(null);
      setImagePreview(null);
      setShowCreatePost(false);
      fetchCommunityData();
      showToast('Post created successfully!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to create post', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (postId: number, voteType: 'up' | 'down') => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Both up and down use the same like toggle endpoint
      const response = await api.post(`/posts/${postId}/like/`);
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              is_liked: response.data.liked,
              likes_count: response.data.likes_count 
            }
          : post
      ));
    } catch (error) {
      console.error('Failed to vote:', error);
      showToast('Failed to update vote', 'error');
    }
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:8000${imageUrl}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getRoleBadge = (role: string, isCreator: boolean) => {
    if (isCreator) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-xs font-semibold">
          <Crown size={12} />
          <span>Creator</span>
        </div>
      );
    }
    if (role === 'admin') {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-500 rounded text-xs font-semibold">
          <Shield size={12} />
          <span>Admin</span>
        </div>
      );
    }
    if (role === 'moderator') {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-xs font-semibold">
          <Shield size={12} />
          <span>Mod</span>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f14]">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#0b0f14]">
        <Navbar />
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold mb-4">Community not found</h2>
          <button
            onClick={() => router.push('/communities')}
            className="px-6 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white font-semibold rounded-full transition-colors"
          >
            Browse Communities
          </button>
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

      {/* Delete Post Modal */}
      <Modal
        isOpen={postToDelete !== null}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDeletePostConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete Post"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      {/* Cover Banner */}
      <div className="h-32 bg-gradient-to-r from-[#ff4500] to-[#ff6a00] relative">
        {getImageUrl(community.cover_image) && (
          <Image
            src={getImageUrl(community.cover_image)!}
            alt={community.name}
            fill
            className="object-cover"
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto flex gap-6 px-4">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 -mt-5">
          {/* Community Header */}
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg mb-4">
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Display Picture */}
                <div className="w-20 h-20 -mt-8 rounded-full border-4 border-[#0b0f14] bg-[#272729] overflow-hidden flex-shrink-0">
                  {getImageUrl(community.display_picture) ? (
                    <Image
                      src={getImageUrl(community.display_picture)!}
                      alt={community.name}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#ff4500]">
                      {community.name[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">c/{community.name}</h1>
                  <p className="text-sm text-[#818384]">{community.description}</p>
                </div>

                {/* Action Button */}
                {community.is_creator ? (
                  <button
                    onClick={() => router.push(`/communities/${slug}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded-full font-semibold transition-colors"
                  >
                    <Settings size={18} />
                    <span className="hidden sm:inline">Manage</span>
                  </button>
                ) : community.is_member ? (
                  <button
                    onClick={handleLeave}
                    className="flex items-center gap-2 px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded-full font-semibold transition-colors"
                  >
                    <UserMinus size={18} />
                    <span className="hidden sm:inline">Joined</span>
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    className="flex items-center gap-2 px-4 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full font-semibold transition-colors"
                  >
                    <UserPlus size={18} />
                    <span className="hidden sm:inline">Join</span>
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#343536]">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'border-white text-white'
                      : 'border-transparent text-[#818384] hover:text-white'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'members'
                      ? 'border-white text-white'
                      : 'border-transparent text-[#818384] hover:text-white'
                  }`}
                >
                  Members ({community.member_count})
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'posts' ? (
            <div className="space-y-3">
              {/* Create Post */}
              {community.is_member && (
                <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-3">
                  {!showCreatePost ? (
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="w-full flex items-center gap-3 px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded border border-[#343536] text-left text-[#818384] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#ff4500] flex items-center justify-center text-white font-semibold">
                        {user?.username[0].toUpperCase()}
                      </div>
                      <span>Create Post</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreatePost}>
                      {/* Title Input */}
                      <input
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="Post Title"
                        className="w-full px-4 py-2 mb-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384]"
                        required
                      />

                      {/* Content Textarea */}
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full px-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384] resize-none"
                        rows={4}
                        required
                      />

                      {imagePreview && (
                        <div className="mt-3 relative inline-block">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            width={300}
                            height={200}
                            className="rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPostImage(null);
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded hover:bg-black/70"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 hover:bg-[#272729] rounded transition-colors text-sm">
                          <ImageIcon size={18} />
                          <span>Image (Optional)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreatePost(false);
                              setPostTitle('');
                              setPostContent('');
                              setPostImage(null);
                              setImagePreview(null);
                            }}
                            className="px-4 py-1.5 hover:bg-[#272729] rounded-full text-sm font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={posting || !postTitle.trim() || !postContent.trim()}
                            className="px-4 py-1.5 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {posting ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Posts Feed */}
              {posts.length === 0 ? (
                <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 text-[#818384]" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-[#818384]">Be the first to post!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-[#1a1a1b] border border-[#343536] rounded-lg hover:border-[#474748] transition-colors overflow-hidden"
                  >
                    <div className="flex">
                      {/* Vote Section */}
                      <div className="flex flex-col items-center gap-1 bg-[#161617] px-3 py-3">
                        <button
                          onClick={() => handleVote(post.id, 'up')}
                          className={`p-1 rounded hover:bg-[#272729] transition-colors ${
                            post.is_liked ? 'text-[#ff4500]' : 'text-[#818384]'
                          }`}
                        >
                          <ArrowBigUp size={24} fill={post.is_liked ? 'currentColor' : 'none'} />
                        </button>
                        <span className={`text-xs font-bold ${post.is_liked ? 'text-[#ff4500]' : 'text-[#d7dadc]'}`}>
                          {post.likes_count}
                        </span>
                        <button
                          onClick={() => handleVote(post.id, 'down')}
                          className="p-1 rounded hover:bg-[#272729] transition-colors text-[#818384]"
                        >
                          <ArrowBigDown size={24} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs text-[#818384]">
                            <span>Posted by u/{post.author.username}</span>
                            <span>•</span>
                            <span>{formatTime(post.created_at)}</span>
                          </div>

                          {post.can_delete && (
                            <button
                              onClick={() => setPostToDelete(post.id)}
                              className="p-2 hover:bg-[#272729] rounded text-[#818384] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>

                        <h2 className="text-lg font-semibold text-[#d7dadc] mb-2">
                          {post.title || post.content}
                        </h2>

                        {post.title && (
                          <p className="text-sm text-[#d7dadc] mb-2">{post.content}</p>
                        )}

                        {getImageUrl(post.image) && (
                          <div className="mb-3 rounded overflow-hidden">
                            <Image
                              src={getImageUrl(post.image)!}
                              alt="Post"
                              width={600}
                              height={400}
                              className="w-full max-h-[500px] object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => router.push(`/posts/${post.id}`)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#272729] transition-colors text-xs font-bold text-[#818384]"
                          >
                            <MessageSquare size={18} />
                            <span>{post.comments_count} Comments</span>
                          </button>
                          <button className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#272729] transition-colors text-xs font-bold text-[#818384]">
                            <Share2 size={18} />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : (
            // Members Tab
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
              <h3 className="font-semibold mb-4">Members ({members.length})</h3>
              
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto mb-4 text-[#818384]" />
                  <p className="text-[#818384]">No members found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const isCreator = community.creator_id === member.user.id;
                    const canManage = community.can_manage_members && !isCreator && member.user.id !== user?.id;

                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-[#272729] rounded hover:bg-[#343536] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#ff4500] flex items-center justify-center text-white font-semibold">
                            {member.user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">u/{member.user.username}</p>
                            <div className="flex items-center gap-2">
                              {getRoleBadge(member.role, isCreator)}
                              <span className="text-xs text-[#818384]">
                                Joined {formatTime(member.joined_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {canManage && (
                          <div className="relative">
                            <button
                              onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                              className="p-2 hover:bg-[#474748] rounded transition-colors"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {selectedMember?.id === member.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1b] border border-[#343536] rounded-lg shadow-xl z-10 animate-slideDown">
                                {member.role === 'member' && (
                                  <button
                                    onClick={() => handlePromoteMember(member.user.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#272729] transition-colors text-sm"
                                  >
                                    <Shield size={16} />
                                    <span>Promote to Moderator</span>
                                  </button>
                                )}

                                {member.role === 'moderator' && community.is_creator && (
                                  <button
                                    onClick={() => handleDemoteMember(member.user.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#272729] transition-colors text-sm"
                                  >
                                    <UserCog size={16} />
                                    <span>Demote to Member</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleKickMember(member.user.id, member.user.username)}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#272729] transition-colors text-sm text-red-500"
                                >
                                  <Trash2 size={16} />
                                  <span>Remove from Community</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80">
          <div className="sticky top-14">
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
              <h3 className="font-semibold mb-3">About Community</h3>
              <p className="text-sm text-[#818384] mb-4">{community.description}</p>
              
              <div className="flex items-center gap-2 text-sm mb-2">
                <Users size={16} className="text-[#818384]" />
                <span className="font-semibold">{community.member_count}</span>
                <span className="text-[#818384]">Members</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-[#818384]" />
                <span className="text-[#818384]">Created {formatTime(community.created_at)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
