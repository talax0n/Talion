export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          visibility: 'private' | 'public';
          custom_domain: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          visibility?: 'private' | 'public';
          custom_domain?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          visibility?: 'private' | 'public';
          custom_domain?: string | null;
          updated_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          workspace_id: string;
          parent_id: string | null;
          author_id: string;
          title: string;
          slug: string;
          content_md: string;
          content_html: string;
          status: 'draft' | 'published' | 'archived';
          visibility: 'private' | 'group' | 'specific' | 'public';
          tags: string[];
          depth: number;
          sort_order: number;
          icon: string | null;
          cover_url: string | null;
          position: number;
          frontmatter: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          parent_id?: string | null;
          author_id: string;
          title?: string;
          slug: string;
          content_md?: string;
          content_html?: string;
          status?: 'draft' | 'published' | 'archived';
          visibility?: 'private' | 'group' | 'specific' | 'public';
          tags?: string[];
          depth?: number;
          sort_order?: number;
          icon?: string | null;
          cover_url?: string | null;
          position?: number;
          frontmatter?: Json;
        };
        Update: {
          title?: string;
          slug?: string;
          content_md?: string;
          content_html?: string;
          status?: 'draft' | 'published' | 'archived';
          visibility?: 'private' | 'group' | 'specific' | 'public';
          tags?: string[];
          depth?: number;
          sort_order?: number;
          icon?: string | null;
          cover_url?: string | null;
          position?: number;
          frontmatter?: Json;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
