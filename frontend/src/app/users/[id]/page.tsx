// frontend/src/app/users/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Post, Comment, FollowUser } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { 
  User as UserIcon,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,  
  ArrowBigUp,
  Users,
  UserPlus,
  UserMinus,
} from 'lucide-react';

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface PublicUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_picture?: string;
  cover_image?: string;
  date_joined: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_own_profile: boolean;
}

interface UserStats {
  total_posts: number;
  total_comments: number;
  communities: {
    name: string;
    slug: string;
    post_count: number;
  }[];
  member_of: number;
}

interface UserComment extends Comment {
  post_title?: string;
  community_name?: string;
  community_slug?: string;
}

export default function PublicUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;

  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'comments'>('overview');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [following, setFollowing] = useState(false);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/auth/users/${userId}/`);
      setProfileUser(response.data);
      setFollowing(response.data.is_following);
      
      if (response.data.is_own_profile) {
        router.push('/profile');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast('User not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const [postsRes, commentsRes] = await Promise.all([
        api.get(`/posts/user/${userId}/`).catch(() => ({ data: [] })),
        api.get(`/auth/comments/`).catch(() => ({ data: [] }))
      ]);

      setPosts(postsRes.data);
      setComments(commentsRes.data);

      const communitiesMap = new Map();
      postsRes.data.forEach((post: Post) => {
        if (!communitiesMap.has(post.community_slug)) {
          communitiesMap.set(post.community_slug, {
            name: post.community_name,
            slug: post.community_slug,
            post_count: 0
          });
        }
        communitiesMap.get(post.community_slug).post_count++;
      });

      setStats({
        total_posts: postsRes.data.length,
        total_comments: commentsRes.data.length,
        communities: Array.from(communitiesMap.values()),
        member_of: communitiesMap.size
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await api.get(`/auth/users/${userId}/followers/`);
      setFollowers(response.data);
    } catch (error) {
      showToast('Failed to load followers', 'error');
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await api.get(`/auth/users/${userId}/following/`);
      setFollowingList(response.data);
    } catch (error) {
      showToast('Failed to load following', 'error');
    }
  };

  const handleFollowToggle = async (targetUserId?: number) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const userToFollow = targetUserId || profileUser?.id;
    if (!userToFollow) return;

    try {
      await api.post(`/auth/users/${userToFollow}/follow/`);
      
      if (!targetUserId && profileUser) {
        setFollowing(!following);
        setProfileUser({
          ...profileUser,
          followers_count: following 
            ? profileUser.followers_count - 1 
            : profileUser.followers_count + 1,
          is_following: !following
        });
      }
      
      setFollowers(prev => prev.map(f => 
        f.id === userToFollow ? { ...f, is_following: !f.is_following } : f
      ));
      setFollowingList(prev => prev.map(f => 
        f.id === userToFollow ? { ...f, is_following: !f.is_following } : f
      ));
      
      showToast(
        targetUserId 
          ? (followers.find(f => f.id === targetUserId)?.is_following || followingList.find(f => f.id === targetUserId)?.is_following ? 'Unfollowed' : 'Followed')
          : (following ? 'Unfollowed' : 'Followed'),
        'success'
      );
    } catch (error) {
      showToast('Failed to update follow', 'error');
    }
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
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
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  if (loading || !profileUser) {
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Modal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title={`Followers (${profileUser.followers_count})`}
        showActions={false}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {followers.map((follower) => (
            <div key={follower.id} className="flex items-center justify-between p-3 bg-[#272729] rounded">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => {
                  setShowFollowersModal(false);
                  router.push(`/users/${follower.id}`);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#d93900] flex items-center justify-center text-white font-bold overflow-hidden">
                  {follower.profile_picture ? (
                    <Image src={getImageUrl(follower.profile_picture)!} alt={follower.username} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    follower.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold">u/{follower.username}</p>
                  {(follower.first_name || follower.last_name) && (
                    <p className="text-sm text-[#818384]">{follower.first_name} {follower.last_name}</p>
                  )}
                </div>
              </div>
              {currentUser && follower.id !== currentUser.id && (
                <button
                  onClick={() => handleFollowToggle(follower.id)}
                  className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-colors ${
                    follower.is_following
                      ? 'bg-[#272729] hover:bg-[#343536]'
                      : 'bg-[#d93900] hover:bg-[#c13300] text-white'
                  }`}
                >
                  {follower.is_following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title={`Following (${profileUser.following_count})`}
        showActions={false}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {followingList.map((followingUser) => (
            <div key={followingUser.id} className="flex items-center justify-between p-3 bg-[#272729] rounded">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => {
                  setShowFollowingModal(false);
                  router.push(`/users/${followingUser.id}`);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#d93900] flex items-center justify-center text-white font-bold overflow-hidden">
                  {followingUser.profile_picture ? (
                    <Image src={getImageUrl(followingUser.profile_picture)!} alt={followingUser.username} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    followingUser.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold">u/{followingUser.username}</p>
                  {(followingUser.first_name || followingUser.last_name) && (
                    <p className="text-sm text-[#818384]">{followingUser.first_name} {followingUser.last_name}</p>
                  )}
                </div>
              </div>
              {currentUser && followingUser.id !== currentUser.id && (
                <button
                  onClick={() => handleFollowToggle(followingUser.id)}
                  className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-colors ${
                    followingUser.is_following
                      ? 'bg-[#272729] hover:bg-[#343536]'
                      : 'bg-[#d93900] hover:bg-[#c13300] text-white'
                  }`}
                >
                  {followingUser.is_following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <div className="max-w-[1400px] mx-auto flex gap-3 px-3 pt-4 pb-5">
        <Sidebar />

        <main className="flex-1 min-w-0">
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg mb-4 overflow-hidden">
            {/* Cover Image */}
            <div className="relative">
              <div className="h-48 bg-gradient-to-r from-[#d93900] to-[#a62d00] relative">
                {profileUser.cover_image && (
                  <Image 
                    src={getImageUrl(profileUser.cover_image)!} 
                    alt="Cover" 
                    fill 
                    className="object-cover" 
                  />
                )}
              </div>
            </div>
            
            <div className="px-6 pb-4">
              {/* Profile Picture - Overlapping Banner (FIXED) */}
              <div className="-mt-20 mb-4">
                <div className="w-28 h-28 rounded-full border-4 border-[#1a1a1b] bg-[#d93900] flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-xl">
                  {profileUser.profile_picture ? (
                    <Image 
                      src={getImageUrl(profileUser.profile_picture)!} 
                      alt={profileUser.username} 
                      width={112} 
                      height={112} 
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    profileUser.username[0].toUpperCase()
                  )}
                </div>
              </div>

              {/* Username and Follow Button (BELOW DP) */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">u/{profileUser.username}</h1>
                  {(profileUser.first_name || profileUser.last_name) && (
                    <p className="text-[#818384]">{profileUser.first_name} {profileUser.last_name}</p>
                  )}
                  {profileUser.bio && <p className="text-sm text-[#818384] mt-1">{profileUser.bio}</p>}
                </div>

                {currentUser && currentUser.id !== profileUser.id && (
                  <button
                    onClick={() => handleFollowToggle()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${
                      following
                        ? 'bg-[#272729] hover:bg-[#343536]'
                        : 'bg-[#d93900] hover:bg-[#c13300] text-white'
                    }`}
                  >
                    {following ? (
                      <>
                        <UserMinus size={18} />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex gap-6 mt-4 pt-4 border-t border-[#343536]">
                <div>
                  <p className="text-2xl font-bold">{stats?.total_posts || 0}</p>
                  <p className="text-sm text-[#818384]">Posts</p>
                </div>
                <button
                  onClick={() => {
                    setShowFollowersModal(true);
                    fetchFollowers();
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold">{profileUser.followers_count}</p>
                  <p className="text-sm text-[#818384]">Followers</p>
                </button>
                <button
                  onClick={() => {
                    setShowFollowingModal(true);
                    fetchFollowing();
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold">{profileUser.following_count}</p>
                  <p className="text-sm text-[#818384]">Following</p>
                </button>
                <div>
                  <p className="text-2xl font-bold">{stats?.member_of || 0}</p>
                  <p className="text-sm text-[#818384]">Communities</p>
                </div>
              </div>

              <div className="flex gap-6 mt-4 pt-4 border-t border-[#343536]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-[#d93900] text-white'
                      : 'border-transparent text-[#818384] hover:text-white'
                  }`}
                >
                  <TrendingUp size={18} />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'border-[#d93900] text-white'
                      : 'border-transparent text-[#818384] hover:text-white'
                  }`}
                >
                  <FileText size={18} />
                  <span>Posts</span>
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-[#d93900] text-white'
                      : 'border-transparent text-[#818384] hover:text-white'
                  }`}
                >
                  <MessageSquare size={18} />
                  <span>Comments</span>
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
                <h3 className="font-semibold mb-4">Active in Communities</h3>
                {stats?.communities && stats.communities.length > 0 ? (
                  <div className="space-y-2">
                    {stats.communities.map((community) => (
                      <button
                        key={community.slug}
                        onClick={() => router.push(`/communities/${community.slug}`)}
                        className="w-full flex items-center justify-between p-3 bg-[#272729] hover:bg-[#343536] rounded transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#d93900] flex items-center justify-center text-white font-bold">
                            {community.name[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">c/{community.name}</p>
                            <p className="text-sm text-[#818384]">{community.post_count} posts</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[#818384]">No community activity yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-[#818384]" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-[#818384]">This user hasn't posted anything</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => router.push(`/posts/${post.id}`)}
                    className="bg-[#1a1a1b] border border-[#343536] rounded-lg hover:border-[#474748] transition-colors cursor-pointer overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-[#818384] mb-2">
                        <span
                          className="hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/communities/${post.community_slug}`);
                          }}
                        >
                          c/{post.community_name}
                        </span>
                        <span>•</span>
                        <span>{formatTime(post.created_at)}</span>
                      </div>

                      {post.title && (
                        <h2 className="text-lg font-semibold text-[#d7dadc] mb-2">{post.title}</h2>
                      )}

                      <p className="text-sm text-[#d7dadc] line-clamp-2 mb-3">{post.content}</p>

                      {getImageUrl(post.image) && (
                        <div className="mb-3 rounded overflow-hidden">
                          <Image
                            src={getImageUrl(post.image)!}
                            alt="Post"
                            width={600}
                            height={400}
                            className="w-full max-h-[300px] object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-[#818384]">
                        <div className="flex items-center gap-1">
                          <ArrowBigUp size={16} />
                          <span>{post.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={16} />
                          <span>{post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 text-[#818384]" />
                  <h3 className="text-xl font-semibold mb-2">No comments yet</h3>
                  <p className="text-[#818384]">This user hasn't commented</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    onClick={() => router.push(`/posts/${comment.post}`)}
                    className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4 hover:border-[#474748] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-sm text-[#818384] mb-2">
                      <span
                        className="hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/communities/${comment.community_slug}`);
                        }}
                      >
                        c/{comment.community_name}
                      </span>
                      <span>•</span>
                      <span>{formatTime(comment.created_at)}</span>
                    </div>

                    <p className="text-[#d7dadc] mb-2">{comment.content}</p>

                    <div className="flex items-center gap-1 text-xs text-[#818384]">
                      <ArrowBigUp size={14} />
                      <span>{comment.likes_count} likes</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-16 pt-2 space-y-4">
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
              <h3 className="font-semibold mb-4">About</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-[#818384]">
                  <UserIcon size={16} />
                  <span>u/{profileUser.username}</span>
                </div>
                <div className="flex items-center gap-2 text-[#818384]">
                  <Calendar size={16} />
                  <span>Joined {formatTime(profileUser.date_joined)}</span>
                </div>
                <div className="flex items-center gap-2 text-[#818384]">
                  <Users size={16} />
                  <span>{profileUser.followers_count} followers</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
