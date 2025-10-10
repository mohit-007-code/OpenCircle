// frontend/src/types/index.ts
export interface User {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  description: string;
  display_picture?: string;
  cover_image?: string;
  creator: User;
  creator_id: number;
  member_count: number;
  is_member: boolean;
  is_creator: boolean;
  can_manage_members: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  community: number;
  community_name: string;
  community_slug: string;
  author: User;
  title?: string;
  content: string;
  image?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  post: number;
  author: User;
  parent?: number | null;
  content: string;
  likes_count: number;
  is_liked: boolean;
  replies_count: number;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  id: number;
  user: User;
  community: number;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
}
