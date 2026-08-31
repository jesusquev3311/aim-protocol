export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; created_at: string };
        Insert: { id: string; username: string; created_at?: string };
        Update: { username?: string };
        Relationships: [];
      };
      skills: {
        Row: { id: number; slug: string; name: string; created_at: string };
        Insert: { id?: never; slug: string; name: string; created_at?: string };
        Update: { slug?: string; name?: string };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          user_id: string;
          duration_days: number;
          matches_per_day: number;
          start_date: string;
          status: "active" | "completed" | "abandoned";
          recommended_mode: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          duration_days?: number;
          matches_per_day: number;
          start_date: string;
          status?: "active" | "completed" | "abandoned";
          recommended_mode?: boolean;
          created_at?: string;
        };
        Update: {
          duration_days?: number;
          matches_per_day?: number;
          start_date?: string;
          status?: "active" | "completed" | "abandoned";
          recommended_mode?: boolean;
        };
        Relationships: [];
      };
      challenge_skills: {
        Row: { challenge_id: string; skill_id: number };
        Insert: { challenge_id: string; skill_id: number };
        Update: never;
        Relationships: [];
      };
      training_days: {
        Row: {
          id: string;
          challenge_id: string;
          day_number: number;
          date: string;
          status: "pending" | "partial" | "completed";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          day_number: number;
          date: string;
          status?: "pending" | "partial" | "completed";
          notes?: string | null;
          created_at?: string;
        };
        Update: { notes?: string | null; status?: "pending" | "partial" | "completed" };
        Relationships: [];
      };
      deathmatches: {
        Row: {
          id: string;
          training_day_id: string;
          match_number: number;
          weapon: string;
          kills: number;
          deaths: number;
          rating: "poor" | "average" | "good";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          training_day_id: string;
          match_number: number;
          weapon: string;
          kills: number;
          deaths: number;
          rating: "poor" | "average" | "good";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          weapon?: string;
          kills?: number;
          deaths?: number;
          rating?: "poor" | "average" | "good";
          notes?: string | null;
        };
        Relationships: [];
      };
      skill_results: {
        Row: {
          id: string;
          training_day_id: string;
          skill_id: number;
          result: "poor" | "average" | "good";
          created_at: string;
        };
        Insert: {
          id?: string;
          training_day_id: string;
          skill_id: number;
          result: "poor" | "average" | "good";
          created_at?: string;
        };
        Update: { result?: "poor" | "average" | "good" };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_challenge: {
        Args: {
          p_duration_days: number;
          p_matches_per_day: number;
          p_start_date: string;
          p_recommended_mode: boolean;
          p_skill_ids: number[];
        };
        Returns: string;
      };
      set_training_day_status: {
        Args: { p_training_day_id: string; p_status: "pending" | "partial" };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
