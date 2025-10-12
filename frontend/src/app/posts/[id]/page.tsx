// app/posts/[id]/page.tsx
'use client';
import { useState, useEffect, FormEvent, useRef, memo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Post, Comment } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import { 
  Heart,
  MessageSquare,
  Share2,
  ArrowLeft,
  Trash2,
  CornerDownRight,
  Sparkles,
  X,
  Send,
  MoreVertical,
  Reply,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyToUsername, setReplyToUsername] = useState<string>('');
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [replies, setReplies] = useState<{ [key: number]: Comment[] }>({});
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (postId) {
      fetchPostData();
    }
  }, [postId]);

  useEffect(() => {
    if (replyTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyTo]);

  const fetchPostData = async () => {
    setLoading(true);
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/posts/${postId}/`),
        api.get(`/posts/${postId}/comments/`)
      ]);

      setPost(postRes.data);
      setComments(commentsRes.data.filter((c: Comment) => !c.parent));
    } catch (error: any) {
      console.error('Error fetching post:', error);
      showToast('Failed to load post', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (commentId: number) => {
    try {
      const res = await api.get(`/posts/comments/${commentId}/replies/`);
      setReplies(prev => ({ ...prev, [commentId]: res.data }));
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const toggleReplies = useCallback(async (commentId: number) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
        if (!replies[commentId]) {
          fetchReplies(commentId);
        }
      }
      return newSet;
    });
  }, [replies]);

  const handleVotePost = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await api.post(`/posts/${postId}/like/`);
      setPost(prev => prev ? {
        ...prev,
        is_liked: response.data.liked,
        likes_count: response.data.likes_count
      } : null);
    } catch (error) {
      showToast('Failed to update vote', 'error');
    }
  };

  const handleVoteComment = useCallback(async (commentId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await api.post(`/posts/comments/${commentId}/like/`);
      
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, is_liked: response.data.liked, likes_count: response.data.likes_count }
          : c
      ));

      setReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[Number(key)] = updated[Number(key)].map(r =>
            r.id === commentId
              ? { ...r, is_liked: response.data.liked, likes_count: response.data.likes_count }
              : r
          );
        });
        return updated;
      });
    } catch (error) {
      showToast('Failed to update vote', 'error');
    }
  }, [user]);

  const handleCreateComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setPosting(true);
    try {
      const response = await api.post(`/posts/${postId}/comments/`, { content: commentContent });
      
      setComments(prev => [response.data, ...prev]);
      setCommentContent('');
      
      setPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null);
      
      showToast('Comment posted!', 'success');
    } catch (error) {
      showToast('Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleCreateReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyTo) return;

    setPosting(true);
    try {
      const response = await api.post(`/posts/${postId}/comments/`, {
        content: replyContent,
        parent: replyTo
      });
      
      setReplies(prev => ({
        ...prev,
        [replyTo]: [...(prev[replyTo] || []), response.data]
      }));
      
      setComments(prev => prev.map(c => 
        c.id === replyTo 
          ? { ...c, replies_count: c.replies_count + 1 }
          : c
      ));
      
      setReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[Number(key)] = updated[Number(key)].map(r =>
            r.id === replyTo
              ? { ...r, replies_count: r.replies_count + 1 }
              : r
          );
        });
        return updated;
      });
      
      setPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null);
      
      setReplyContent('');
      setExpandedReplies(prev => new Set(prev).add(replyTo));
      
      showToast('Reply posted!', 'success');
      
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    } catch (error) {
      showToast('Failed to post reply', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleStartReply = (commentId: number, username: string) => {
    setReplyTo(commentId);
    setReplyToUsername(username);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyToUsername('');
    setReplyContent('');
  };

  const handleDeleteComment = useCallback(async (commentId: number) => {
    setDeleting(true);
    setOpenDropdown(null);
    
    try {
      await api.delete(`/posts/comments/${commentId}/`);
      
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      setReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[Number(key)] = updated[Number(key)].filter(r => r.id !== commentId);
        });
        return updated;
      });
      
      setPost(prev => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : null);
      
      showToast('Comment deleted', 'success');
    } catch (error) {
      showToast('Failed to delete comment', 'error');
    } finally {
      setDeleting(false);
    }
  }, []);

  // ✅ NEW: Delete post handler
  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${postId}/`);
      showToast('Post deleted successfully', 'success');
      setTimeout(() => router.push('/'), 1000);
    } catch (error) {
      showToast('Failed to delete post', 'error');
    } finally {
      setShowDeletePostConfirm(false);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      showToast('Link copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy link', 'error');
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

  // ✅ UPDATED: Comment Component with Heart voting
  const CommentItem = memo(({ 
    comment, 
    depth = 0,
    onVote,
    onDelete,
    onToggleReplies,
    onStartReply,
    isExpanded,
    commentReplies,
  }: { 
    comment: Comment; 
    depth?: number;
    onVote: (id: number) => void;
    onDelete: (id: number) => void;
    onToggleReplies: (id: number) => void;
    onStartReply: (id: number, username: string) => void;
    isExpanded: boolean;
    commentReplies: Comment[] | undefined;
  }) => {
    // ✅ FIX: Profile redirect check
    const handleUsernameClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (user && comment.author.id === user.id) {
        router.push('/profile');
      } else {
        router.push(`/users/${comment.author.id}`);
      }
    };

    return (
      <div className={`${depth > 0 ? 'ml-4 pl-3 border-l-2 border-zinc-700/30' : ''}`}>
        <div className="glass-effect bg-zinc-800/30 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-3 mb-3">
          <div className="flex gap-3">
            {/* ✅ CHANGED: Heart voting (No arrows) */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onVote(comment.id)}
                className={`p-1.5 rounded-xl hover:bg-zinc-700/50 transition-all group ${
                  comment.is_liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
                }`}
              >
                <Heart 
                  size={16} 
                  fill={comment.is_liked ? 'currentColor' : 'none'}
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
              <span className={`text-xs font-bold min-w-[1.5rem] text-center ${
                comment.is_liked ? 'text-red-500' : 'text-zinc-300'
              }`}>
                {comment.likes_count}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {/* ✅ FIX: Username with profile redirect & blue color for self */}
                  <span 
                    className={`font-semibold hover:text-cyan-400 cursor-pointer transition-colors ${
                      user && comment.author.id === user.id ? 'text-blue-400' : 'text-zinc-100'
                    }`}
                    onClick={handleUsernameClick}
                  >
                    u/{comment.author.username}
                  </span>
                  <span>•</span>
                  <span>{formatTime(comment.created_at)}</span>
                </div>

                {comment.can_delete && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === comment.id ? null : comment.id)}
                      className="p-1.5 hover:bg-zinc-700/50 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>

                    <AnimatePresence>
                      {openDropdown === comment.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-1 w-40 glass-effect bg-zinc-800 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                          <button
                            onClick={() => onDelete(comment.id)}
                            disabled={deleting}
                            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all text-sm font-medium disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <p className="text-zinc-300 text-sm mb-2 whitespace-pre-wrap leading-relaxed">{comment.content}</p>

              <div className="flex items-center gap-3">
                {user && (
                  <button
                    onClick={() => onStartReply(comment.id, comment.author.username)}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-cyan-400 transition-colors"
                  >
                    <CornerDownRight size={12} />
                    <span>Reply</span>
                  </button>
                )}

                {comment.replies_count > 0 && (
                  <button
                    onClick={() => onToggleReplies(comment.id)}
                    className="text-xs font-semibold text-zinc-500 hover:text-cyan-400 transition-colors"
                  >
                    {isExpanded
                      ? `Hide ${comment.replies_count}`
                      : `View ${comment.replies_count} ${comment.replies_count === 1 ? 'reply' : 'replies'}`
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && commentReplies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-0"
            >
              {commentReplies.map((reply) => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  depth={depth + 1}
                  onVote={onVote}
                  onDelete={onDelete}
                  onToggleReplies={onToggleReplies}
                  onStartReply={onStartReply}
                  isExpanded={expandedReplies.has(reply.id)}
                  commentReplies={replies[reply.id]}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

  CommentItem.displayName = 'CommentItem';

  const PostSkeleton = () => (
    <div className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="space-y-4">
            <PostSkeleton />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 flex items-center justify-center">
              <MessageSquare size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 gradient-text">Post not found</h2>
            <p className="text-zinc-400 mb-8">This post doesn't exist or has been removed</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105"
            >
              Go Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 lg:pb-0">
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-[1400px] mx-auto flex gap-4 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <Sidebar />

        <main className="flex-1">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-cyan-400 mb-5 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </motion.button>

          <motion.article
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl mb-6 overflow-hidden"
          >
            {/* ✅ CHANGED: Removed vote sidebar, added inline actions */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3 flex-wrap">
                <span
                  className="hover:text-cyan-400 cursor-pointer transition-colors font-medium"
                  onClick={() => router.push(`/communities/${post.community_slug}`)}
                >
                  c/{post.community_name}
                </span>
                <span>•</span>
                {/* ✅ FIX: Profile redirect check */}
                <span
                  className={`hover:text-cyan-400 cursor-pointer transition-colors ${
                    user && post.author.id === user.id ? 'text-blue-400 font-semibold' : ''
                  }`}
                  onClick={() => {
                    if (user && post.author.id === user.id) {
                      router.push('/profile');
                    } else {
                      router.push(`/users/${post.author.id}`);
                    }
                  }}
                >
                  u/{post.author.username}
                </span>
                <span>•</span>
                <span>{formatTime(post.created_at)}</span>
              </div>

              {post.title && (
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-3">{post.title}</h1>
              )}

              <p className="text-zinc-300 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

              {getImageUrl(post.image) && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  <Image
                    src={getImageUrl(post.image)!}
                    alt="Post"
                    width={800}
                    height={600}
                    className="w-full max-h-[600px] object-contain bg-zinc-950"
                  />
                </div>
              )}

              {/* ✅ NEW: Action buttons (Heart, Comment, Share, Delete) */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/50">
                <div className="flex items-center gap-2">
                  {/* ✅ Heart button (replaces arrows) */}
                  <button
                    onClick={handleVotePost}
                    className={`flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 rounded-xl transition-all text-sm font-medium group ${
                      post.is_liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
                    }`}
                  >
                    <Heart 
                      size={20} 
                      fill={post.is_liked ? 'currentColor' : 'none'}
                      className="group-hover:scale-110 transition-transform" 
                    />
                    <span>{post.likes_count}</span>
                  </button>

                  <button
                    onClick={() => setShowCommentDrawer(true)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 rounded-xl transition-all text-zinc-400 hover:text-cyan-400 text-sm font-medium group"
                  >
                    <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                    <span>{post.comments_count}</span>
                  </button>

                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 rounded-xl transition-all text-zinc-400 hover:text-cyan-400 text-sm font-medium group"
                  >
                    <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>

                {/* ✅ NEW: Delete button (only for post owner) */}
                {post.can_delete && (
                  <div className="relative">
                    <button
                      onClick={() => setShowDeletePostConfirm(!showDeletePostConfirm)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 rounded-xl transition-all text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      <Trash2 size={18} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>

                    {showDeletePostConfirm && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 glass-effect bg-zinc-900 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <button
                          onClick={handleDeletePost}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 hover:bg-red-500/20 transition-all text-sm text-red-400 hover:text-red-300 font-semibold"
                        >
                          <Trash2 size={16} />
                          <span>Sure? Delete Post</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.article>
        </main>

        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-20">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center text-white gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                About
              </h3>
              <button
                onClick={() => router.push(`/communities/${post.community_slug}`)}
                className="w-full text-left px-4 py-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-xl transition-all group"
              >
                <p className="font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">c/{post.community_name}</p>
                <p className="text-sm text-zinc-500 mt-1">View Community</p>
              </button>
            </motion.div>
          </div>
        </aside>
      </div>

      {/* Comment Drawer */}
      <AnimatePresence>
        {showCommentDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommentDrawer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-cyan-500/30 rounded-t-3xl z-50 max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} className="text-cyan-400" />
                  <h2 className="font-bold text-lg">Comments ({post.comments_count})</h2>
                </div>
                <button
                  onClick={() => setShowCommentDrawer(false)}
                  className="p-2 hover:bg-zinc-800/50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
                <div className="flex gap-3">
                  {getImageUrl(post.image) && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={getImageUrl(post.image)!}
                        alt="Post"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                      <span className="text-cyan-400 font-medium">c/{post.community_name}</span>
                      <span>•</span>
                      <span>u/{post.author.username}</span>
                    </div>
                    {post.title && (
                      <h3 className="font-bold text-sm text-zinc-100 line-clamp-2 mb-1">{post.title}</h3>
                    )}
                    <p className="text-xs text-zinc-400 line-clamp-1">{post.content}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 bg-zinc-950">
                {comments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 flex items-center justify-center">
                      <MessageSquare size={32} className="text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 gradient-text">No comments yet</h3>
                    <p className="text-zinc-400 text-sm">Be the first to share what you think!</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    <AnimatePresence mode="popLayout">
                      {comments.map((comment, index) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <CommentItem 
                            comment={comment}
                            onVote={handleVoteComment}
                            onDelete={handleDeleteComment}
                            onToggleReplies={toggleReplies}
                            onStartReply={handleStartReply}
                            isExpanded={expandedReplies.has(comment.id)}
                            commentReplies={replies[comment.id]}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
                <div ref={commentsEndRef} />
              </div>

              {user ? (
                <div className="border-t border-zinc-800/50 bg-zinc-900">
                  {replyTo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Reply size={16} className="text-cyan-400" />
                        <span className="text-zinc-300">Replying to <span className="text-cyan-400 font-medium">u/{replyToUsername}</span></span>
                      </div>
                      <button
                        onClick={handleCancelReply}
                        className="text-zinc-400 hover:text-zinc-100 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  )}

                  <form onSubmit={replyTo ? handleCreateReply : handleCreateComment} className="p-4">
                    <div className="flex gap-2">
                      <textarea
                        ref={replyTo ? replyInputRef : null}
                        value={replyTo ? replyContent : commentContent}
                        onChange={(e) => replyTo ? setReplyContent(e.target.value) : setCommentContent(e.target.value)}
                        placeholder={replyTo ? `Reply to u/${replyToUsername}...` : "Add a comment..."}
                        className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                        rows={2}
                      />
                      <button
                        type="submit"
                        disabled={posting || (replyTo ? !replyContent.trim() : !commentContent.trim())}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:hover:scale-100 hover:scale-105 flex items-center gap-2"
                      >
                        {posting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900 text-center">
                  <p className="text-sm text-zinc-400 mb-3">Log in to comment</p>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105"
                  >
                    Log In
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
