export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; created_at: string; updated_at: string };
        Insert: { id: string; username: string; created_at?: string; updated_at?: string };
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
          completed_at: string | null;
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
          completed_at?: string | null;
        };
        Update: {
          duration_days?: number;
          matches_per_day?: number;
          start_date?: string;
          status?: "active" | "completed" | "abandoned";
          recommended_mode?: boolean;
          completed_at?: string | null;
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
          status: "pending" | "completed";
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          day_number: number;
          date: string;
          status?: "pending" | "completed";
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: { notes?: string | null; status?: "pending" | "completed"; completed_at?: string | null };
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
      achievements: {
        Row: { id: number; code: string; name: string; description: string; icon: string; milestone_days: number | null; created_at: string };
        Insert: { id?: never; code: string; name: string; description: string; icon: string; milestone_days?: number | null; created_at?: string };
        Update: never;
        Relationships: [];
      };
      challenge_achievements: {
        Row: { challenge_id: string; achievement_id: number; unlocked_at: string };
        Insert: { challenge_id: string; achievement_id: number; unlocked_at?: string };
        Update: never;
        Relationships: [];
      };
      routine_programs: {
        Row: {
          id: string; user_id: string; name: string; start_date: string; duration_days: 7 | 15 | 30;
          weekdays: number[]; status: "active" | "completed" | "abandoned";
          completed_at: string | null; created_at: string;
        };
        Insert: {
          id?: string; user_id: string; name: string; start_date: string; duration_days: 7 | 15 | 30;
          weekdays: number[]; status?: "active" | "completed" | "abandoned";
          completed_at?: string | null; created_at?: string;
        };
        Update: {
          name?: string; start_date?: string; duration_days?: 7 | 15 | 30; weekdays?: number[];
          status?: "active" | "completed" | "abandoned"; completed_at?: string | null;
        };
        Relationships: [];
      };
      routine_sessions: {
        Row: {
          id: string; user_id: string; routine_program_id: string | null; day_number: number | null; session_date: string;
          overaim_bots: number; underaim_bots: number; flick_bots: number;
          microflick_minutes: number; practice_minutes: number; deathmatches: number; ranked_matches: number;
          shooting_error_graph: boolean; stop_before_shooting: boolean; no_crouch_spray: boolean; burst_strafe: boolean;
          notes: string | null; started_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id: string; routine_program_id?: string | null; day_number?: number | null; session_date: string;
          overaim_bots?: number; underaim_bots?: number; flick_bots?: number;
          microflick_minutes?: number; practice_minutes?: number; deathmatches?: number; ranked_matches?: number;
          shooting_error_graph?: boolean; stop_before_shooting?: boolean; no_crouch_spray?: boolean; burst_strafe?: boolean;
          notes?: string | null; started_at?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          routine_program_id?: string | null; day_number?: number | null; session_date?: string; overaim_bots?: number; underaim_bots?: number; flick_bots?: number;
          microflick_minutes?: number; practice_minutes?: number; deathmatches?: number; ranked_matches?: number;
          shooting_error_graph?: boolean; stop_before_shooting?: boolean; no_crouch_spray?: boolean; burst_strafe?: boolean;
          notes?: string | null; started_at?: string | null; completed_at?: string | null; updated_at?: string;
        };
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
        Args: { p_training_day_id: string; p_status: "pending" | "completed" };
        Returns: string;
      };
      finish_challenge: { Args: { p_challenge_id: string }; Returns: undefined };
      reset_challenge: { Args: { p_challenge_id: string; p_start_date: string }; Returns: undefined };
      finish_routine_session: { Args: { p_session_date: string }; Returns: string };
      create_routine_program: { Args: { p_name: string; p_start_date: string; p_duration_days: number; p_weekdays: number[] }; Returns: string };
      start_routine_session: { Args: { p_session_id: string }; Returns: string };
      finish_routine_day: { Args: { p_session_id: string }; Returns: string };
      finish_routine_program: { Args: { p_program_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
