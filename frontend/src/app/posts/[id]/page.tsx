// frontend/src/app/posts/[id]/page.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Post, Comment } from '@/types';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { 
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  ArrowLeft,
  Trash2,
  CornerDownRight,
} from 'lucide-react';

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
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [replies, setReplies] = useState<{ [key: number]: Comment[] }>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (postId) {
      fetchPostData();
    }
  }, [postId]);

  const fetchPostData = async () => {
    setLoading(true);
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/posts/${postId}/`),
        api.get(`/posts/${postId}/comments/`)
      ]);

      setPost(postRes.data);
      // Only show top-level comments (no parent)
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

  const toggleReplies = async (commentId: number) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      setExpandedReplies(prev => new Set(prev).add(commentId));
      if (!replies[commentId]) {
        await fetchReplies(commentId);
      }
    }
  };

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

  const handleVoteComment = async (commentId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await api.post(`/posts/comments/${commentId}/like/`);
      
      // Update in comments list
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, is_liked: response.data.liked, likes_count: response.data.likes_count }
          : c
      ));

      // Update in replies if exists
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
  };

  const handleCreateComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setPosting(true);
    try {
      await api.post(`/posts/${postId}/comments/`, { content: commentContent });
      setCommentContent('');
      fetchPostData();
      showToast('Comment posted!', 'success');
    } catch (error) {
      showToast('Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleCreateReply = async (parentId: number) => {
    if (!replyContent.trim()) return;

    setPosting(true);
    try {
      await api.post(`/posts/${postId}/comments/`, {
        content: replyContent,
        parent: parentId
      });
      setReplyContent('');
      setReplyTo(null);
      
      // Refresh replies for this comment
      await fetchReplies(parentId);
      
      // Update replies count in comments
      setComments(prev => prev.map(c => 
        c.id === parentId 
          ? { ...c, replies_count: c.replies_count + 1 }
          : c
      ));
      
      // Update post comment count
      fetchPostData();
      showToast('Reply posted!', 'success');
    } catch (error) {
      showToast('Failed to post reply', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteCommentConfirm = async () => {
    if (!commentToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/posts/comments/${commentToDelete}/`);
      fetchPostData();
      setCommentToDelete(null);
      showToast('Comment deleted', 'success');
    } catch (error) {
      showToast('Failed to delete comment', 'error');
    } finally {
      setDeleting(false);
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

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0b0f14]">
        <Navbar />
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold mb-4">Post not found</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white font-semibold rounded-full transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleDeleteCommentConfirm}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 px-4 py-2 hover:bg-[#272729] rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          {/* Post */}
          <article className="bg-[#1a1a1b] border border-[#343536] rounded-lg mb-4 overflow-hidden">
            <div className="flex">
              {/* Vote Section */}
              <div className="flex flex-col items-center gap-1 bg-[#161617] px-4 py-4">
                <button
                  onClick={handleVotePost}
                  className={`p-1 rounded hover:bg-[#272729] transition-colors ${
                    post.is_liked ? 'text-[#ff4500]' : 'text-[#818384]'
                  }`}
                >
                  <ArrowBigUp size={28} fill={post.is_liked ? 'currentColor' : 'none'} />
                </button>
                <span className={`text-sm font-bold ${post.is_liked ? 'text-[#ff4500]' : 'text-[#d7dadc]'}`}>
                  {post.likes_count}
                </span>
                <button
                  onClick={handleVotePost}
                  className="p-1 rounded hover:bg-[#272729] transition-colors text-[#818384]"
                >
                  <ArrowBigDown size={28} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex items-center gap-2 text-sm text-[#818384] mb-3">
                  <span
                    className="hover:underline cursor-pointer"
                    onClick={() => router.push(`/communities/${post.community_slug}`)}
                  >
                    c/{post.community_name}
                  </span>
                  <span>•</span>
                  <span>Posted by u/{post.author.username}</span>
                  <span>•</span>
                  <span>{formatTime(post.created_at)}</span>
                </div>

                {post.title && (
                  <h1 className="text-2xl font-bold text-[#d7dadc] mb-3">{post.title}</h1>
                )}

                <p className="text-[#d7dadc] mb-4 whitespace-pre-wrap">{post.content}</p>

                {getImageUrl(post.image) && (
                  <div className="mb-4 rounded overflow-hidden">
                    <Image
                      src={getImageUrl(post.image)!}
                      alt="Post"
                      width={800}
                      height={600}
                      className="w-full max-h-[600px] object-contain bg-black"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-[#343536]">
                  <div className="flex items-center gap-2 px-3 py-2 text-[#818384] text-sm font-bold">
                    <MessageSquare size={20} />
                    <span>{post.comments_count} Comments</span>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#272729] rounded transition-colors text-[#818384] text-sm font-bold">
                    <Share2 size={20} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleCreateComment} className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4 mb-4">
              <p className="text-sm text-[#818384] mb-2">Comment as u/{user.username}</p>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full px-4 py-3 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384] resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={posting || !commentContent.trim()}
                  className="px-6 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full font-semibold disabled:opacity-50 transition-colors"
                >
                  {posting ? 'Commenting...' : 'Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6 mb-4 text-center">
              <p className="mb-3">Log in to leave a comment</p>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full font-semibold transition-colors"
              >
                Log In
              </button>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-12 text-center">
                <MessageSquare size={48} className="mx-auto mb-4 text-[#818384]" />
                <h3 className="text-xl font-semibold mb-2">No comments yet</h3>
                <p className="text-[#818384]">Be the first to share what you think!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
                  <div className="flex gap-3">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleVoteComment(comment.id)}
                        className={`p-1 rounded hover:bg-[#272729] transition-colors ${
                          comment.is_liked ? 'text-[#ff4500]' : 'text-[#818384]'
                        }`}
                      >
                        <ArrowBigUp size={20} fill={comment.is_liked ? 'currentColor' : 'none'} />
                      </button>
                      <span className={`text-xs font-bold ${comment.is_liked ? 'text-[#ff4500]' : 'text-[#d7dadc]'}`}>
                        {comment.likes_count}
                      </span>
                      <button
                        onClick={() => handleVoteComment(comment.id)}
                        className="p-1 rounded hover:bg-[#272729] transition-colors text-[#818384]"
                      >
                        <ArrowBigDown size={20} />
                      </button>
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-[#818384]">
                          <span className="font-semibold text-[#d7dadc]">u/{comment.author.username}</span>
                          <span>•</span>
                          <span>{formatTime(comment.created_at)}</span>
                        </div>

                        {comment.can_delete && (
                          <button
                            onClick={() => setCommentToDelete(comment.id)}
                            className="p-1 hover:bg-[#272729] rounded text-[#818384] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <p className="text-[#d7dadc] mb-2 whitespace-pre-wrap">{comment.content}</p>

                      <div className="flex items-center gap-3">
                        {user && (
                          <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 text-xs font-bold text-[#818384] hover:text-[#d7dadc] transition-colors"
                          >
                            <CornerDownRight size={14} />
                            <span>Reply</span>
                          </button>
                        )}

                        {comment.replies_count > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="text-xs font-bold text-[#818384] hover:text-[#d7dadc] transition-colors"
                          >
                            {expandedReplies.has(comment.id)
                              ? `Hide replies (${comment.replies_count})`
                              : `Show replies (${comment.replies_count})`
                            }
                          </button>
                        )}
                      </div>

                      {/* Reply Form */}
                      {replyTo === comment.id && (
                        <div className="mt-3 ml-4 pl-4 border-l-2 border-[#343536]">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`Reply to u/${comment.author.username}...`}
                            className="w-full px-3 py-2 bg-[#272729] border border-[#343536] rounded text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-[#818384] resize-none text-sm"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setReplyTo(null)}
                              className="px-4 py-1.5 hover:bg-[#272729] rounded-full text-sm font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateReply(comment.id)}
                              disabled={posting || !replyContent.trim()}
                              className="px-4 py-1.5 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full text-sm font-semibold disabled:opacity-50 transition-colors"
                            >
                              {posting ? 'Replying...' : 'Reply'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {expandedReplies.has(comment.id) && replies[comment.id] && (
                        <div className="mt-3 ml-4 pl-4 border-l-2 border-[#343536] space-y-3">
                          {replies[comment.id].map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              {/* Reply Vote */}
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handleVoteComment(reply.id)}
                                  className={`p-1 rounded hover:bg-[#272729] transition-colors ${
                                    reply.is_liked ? 'text-[#ff4500]' : 'text-[#818384]'
                                  }`}
                                >
                                  <ArrowBigUp size={16} fill={reply.is_liked ? 'currentColor' : 'none'} />
                                </button>
                                <span className={`text-xs font-bold ${reply.is_liked ? 'text-[#ff4500]' : 'text-[#d7dadc]'}`}>
                                  {reply.likes_count}
                                </span>
                                <button
                                  onClick={() => handleVoteComment(reply.id)}
                                  className="p-1 rounded hover:bg-[#272729] transition-colors text-[#818384]"
                                >
                                  <ArrowBigDown size={16} />
                                </button>
                              </div>

                              {/* Reply Content */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2 text-xs text-[#818384]">
                                    <span className="font-semibold text-[#d7dadc]">u/{reply.author.username}</span>
                                    <span>•</span>
                                    <span>{formatTime(reply.created_at)}</span>
                                  </div>

                                  {reply.can_delete && (
                                    <button
                                      onClick={() => setCommentToDelete(reply.id)}
                                      className="p-1 hover:bg-[#272729] rounded text-[#818384] hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>

                                <p className="text-sm text-[#d7dadc] whitespace-pre-wrap">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80">
          <div className="sticky top-14">
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-4">
              <h3 className="font-semibold mb-3">About</h3>
              <button
                onClick={() => router.push(`/communities/${post.community_slug}`)}
                className="w-full text-left px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded transition-colors"
              >
                <p className="font-semibold text-[#ff4500]">c/{post.community_name}</p>
                <p className="text-sm text-[#818384] mt-1">View Community</p>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
