// frontend/src/types/index.ts
export interface User {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  cover_image?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  date_joined?: string;
  created_at?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  is_own_profile?: boolean;
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


export interface FollowUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  is_following: boolean;
  followed_at: string;
}


// Add these Auth types
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2?: string;
}


export interface LoginData {
  username: string;
  password: string;
}


export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

