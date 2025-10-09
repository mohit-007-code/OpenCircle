// types/index.ts
// Add/Update these

export interface Post {
  id: number;
  content: string;
  image: string | null;
  author: {
    id: number;
    username: string;
    email: string;
    profile_picture: string | null;
    first_name: string;
    last_name: string;
  };
  community_name: string;
  community_slug: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  can_edit: boolean;
  can_delete: boolean;
  is_liked: boolean;
  comments: Comment[];
}

export interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    profile_picture: string | null;
  };
  created_at: string;
  updated_at: string;
  can_edit: boolean;
  can_delete: boolean;
}
