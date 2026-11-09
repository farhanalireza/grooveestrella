// src/types/database.ts

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
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      music_entities: {
        Row: {
          id: string;
          mbid: string;
          type: 'artist' | 'album' | 'track' | 'release-group';
          title: string;
          artist_credit: string | null;
          year: number | null;
          cover_art_url: string | null;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mbid: string;
          type: 'artist' | 'album' | 'track' | 'release-group';
          title: string;
          artist_credit?: string | null;
          year?: number | null;
          cover_art_url?: string | null;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mbid?: string;
          type?: 'artist' | 'album' | 'track' | 'release-group';
          title?: string;
          artist_credit?: string | null;
          year?: number | null;
          cover_art_url?: string | null;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_ratings: {
        Row: {
          id: string;
          user_id: string;
          entity_id: string;
          rating_type: 'score' | 'stars';
          score: number;
          review: string | null;
          listened_date: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_id: string;
          rating_type: 'score' | 'stars';
          score: number;
          review?: string | null;
          listened_date?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_id?: string;
          rating_type?: 'score' | 'stars';
          score?: number;
          review?: string | null;
          listened_date?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      journals: {
        Row: {
          id: string;
          user_id: string;
          entity_id: string;
          entry_text: string | null;
          mood: string | null;
          listened_date: string;
          rating_id: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_id: string;
          entry_text?: string | null;
          mood?: string | null;
          listened_date?: string;
          rating_id?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_id?: string;
          entry_text?: string | null;
          mood?: string | null;
          listened_date?: string;
          rating_id?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      entity_ratings_summary: {
        Row: {
          entity_id: string;
          mbid: string;
          type: string;
          title: string;
          artist_credit: string | null;
          total_ratings: number;
          avg_stars: number | null;
          avg_score: number | null;
          normalized_score_100: number | null;
        };
      };
    };
  };
}
