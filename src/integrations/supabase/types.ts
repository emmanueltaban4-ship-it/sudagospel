export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          click_count: number
          created_at: string
          end_date: string | null
          id: string
          image_url: string | null
          impression_count: number
          is_active: boolean
          link_url: string | null
          position: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_active?: boolean
          link_url?: string | null
          position?: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_active?: boolean
          link_url?: string | null
          position?: string
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      albums: {
        Row: {
          album_type: string
          artist_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          release_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          album_type?: string
          artist_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          release_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          album_type?: string
          artist_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          release_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          category: string | null
          content: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string | null
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      artist_collaborators: {
        Row: {
          artist_id: string
          collaborator_email: string
          collaborator_name: string | null
          collaborator_user_id: string | null
          created_at: string
          id: string
          invited_by: string | null
          notes: string | null
          role: string
          song_id: string | null
          split_percent: number
          status: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          collaborator_email: string
          collaborator_name?: string | null
          collaborator_user_id?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          notes?: string | null
          role?: string
          song_id?: string | null
          split_percent?: number
          status?: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          collaborator_email?: string
          collaborator_name?: string | null
          collaborator_user_id?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          notes?: string | null
          role?: string
          song_id?: string | null
          split_percent?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_collaborators_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_collaborators_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_earnings: {
        Row: {
          amount_cents: number
          artist_id: string
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payer_user_id: string | null
          song_id: string | null
          source: string
          stripe_session_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          amount_cents: number
          artist_id: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payer_user_id?: string | null
          song_id?: string | null
          source: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          amount_cents?: number
          artist_id?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payer_user_id?: string | null
          song_id?: string | null
          source?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_earnings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_earnings_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_follows: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_follows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_links: {
        Row: {
          artist_id: string
          created_at: string
          icon: string | null
          id: string
          label: string
          link_type: string
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          link_type?: string
          position?: number
          updated_at?: string
          url: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          link_type?: string
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      artist_payouts: {
        Row: {
          amount_cents: number
          artist_id: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string
          paid_by: string | null
          payout_method: string | null
          reference: string | null
        }
        Insert: {
          amount_cents: number
          artist_id: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          payout_method?: string | null
          reference?: string | null
        }
        Update: {
          amount_cents?: number
          artist_id?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          payout_method?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_payouts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_social_links: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          platform: string
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          platform: string
          position?: number
          updated_at?: string
          url: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          platform?: string
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_social_links_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_top_tracks: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          position: number
          song_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          position?: number
          song_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          position?: number
          song_id?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          accent_color: string
          avatar_url: string | null
          banner_position: string
          bio: string | null
          cover_url: string | null
          created_at: string
          genre: string | null
          id: string
          is_verified: boolean | null
          name: string
          pinned_song_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          supporter_enabled: boolean
          supporter_price_cents: number
          tip_jar_enabled: boolean
          updated_at: string
          user_id: string | null
          youtube_channel_url: string | null
        }
        Insert: {
          accent_color?: string
          avatar_url?: string | null
          banner_position?: string
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          pinned_song_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supporter_enabled?: boolean
          supporter_price_cents?: number
          tip_jar_enabled?: boolean
          updated_at?: string
          user_id?: string | null
          youtube_channel_url?: string | null
        }
        Update: {
          accent_color?: string
          avatar_url?: string | null
          banner_position?: string
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          pinned_song_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supporter_enabled?: boolean
          supporter_price_cents?: number
          tip_jar_enabled?: boolean
          updated_at?: string
          user_id?: string | null
          youtube_channel_url?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      featured_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          position: number
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          position?: number
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          position?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ownership_claims: {
        Row: {
          admin_notes: string | null
          claim_type: string
          claimant_email: string
          claimant_id: string
          claimant_name: string
          created_at: string
          description: string
          evidence_url: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          song_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          claim_type?: string
          claimant_email: string
          claimant_id: string
          claimant_name: string
          created_at?: string
          description: string
          evidence_url?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          song_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          claim_type?: string
          claimant_email?: string
          claimant_id?: string
          claimant_name?: string
          created_at?: string
          description?: string
          evidence_url?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          song_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_claims_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      paid_downloads: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          song_id: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          song_id: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          song_id?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paid_downloads_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_songs: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number
          song_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position?: number
          song_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          artist_id: string | null
          created_at: string
          id: string
          image_url: string | null
          label: string
          poll_id: string
          vote_count: number
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          label: string
          poll_id: string
          vote_count?: number
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          label?: string
          poll_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      song_boosts: {
        Row: {
          amount_paid: number
          boost_type: string
          created_at: string
          ends_at: string | null
          id: string
          song_id: string
          starts_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          boost_type?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          song_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          boost_type?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          song_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_boosts_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          song_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          song_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          song_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "song_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_comments_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_downloads: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          song_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          song_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          song_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_downloads_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_likes: {
        Row: {
          created_at: string
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_likes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_reposts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_reposts_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          album_id: string | null
          artist_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          download_count: number | null
          download_price_cents: number
          duration_seconds: number | null
          file_url: string
          genre: string | null
          id: string
          is_approved: boolean | null
          is_paid_download: boolean
          lyrics: string | null
          play_count: number | null
          release_status: string
          scheduled_release_at: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          album_id?: string | null
          artist_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          download_price_cents?: number
          duration_seconds?: number | null
          file_url: string
          genre?: string | null
          id?: string
          is_approved?: boolean | null
          is_paid_download?: boolean
          lyrics?: string | null
          play_count?: number | null
          release_status?: string
          scheduled_release_at?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          album_id?: string | null
          artist_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          download_price_cents?: number
          duration_seconds?: number | null
          file_url?: string
          genre?: string | null
          id?: string
          is_approved?: boolean | null
          is_paid_download?: boolean
          lyrics?: string | null
          play_count?: number | null
          release_status?: string
          scheduled_release_at?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      supporter_subscriptions: {
        Row: {
          amount_cents: number
          artist_id: string
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          artist_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          artist_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supporter_subscriptions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_listening_history: {
        Row: {
          id: string
          played_at: string
          song_id: string
          user_id: string
        }
        Insert: {
          id?: string
          played_at?: string
          song_id: string
          user_id: string
        }
        Update: {
          id?: string
          played_at?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_listening_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          artist_id: string
          created_at: string
          id: string
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          artist_id: string
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          artist_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          artist_id: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          video_type: string
          video_url: string
          view_count: number
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          video_type?: string
          video_url: string
          view_count?: number
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          video_type?: string
          video_url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_artists_with_balance: {
        Args: never
        Returns: {
          artist_id: string
          artist_name: string
          avatar_url: string
          balance_cents: number
          total_earned_cents: number
          total_paid_cents: number
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_artist_balance: {
        Args: { _artist_id: string }
        Returns: {
          balance_cents: number
          total_earned_cents: number
          total_paid_cents: number
        }[]
      }
      get_artist_radio: {
        Args: { _artist_id: string; lim?: number }
        Returns: {
          artist_id: string
          artist_name: string
          cover_url: string
          file_url: string
          genre: string
          song_id: string
          title: string
        }[]
      }
      get_daily_mix: {
        Args: { _user_id: string; lim?: number }
        Returns: {
          artist_id: string
          artist_name: string
          cover_url: string
          file_url: string
          genre: string
          song_id: string
          title: string
        }[]
      }
      get_for_you_feed: {
        Args: { _user_id: string; lim?: number }
        Returns: {
          actor_id: string
          actor_name: string
          artist_id: string
          artist_name: string
          cover_url: string
          created_at: string
          feed_type: string
          file_url: string
          song_id: string
          title: string
        }[]
      }
      get_trending_songs: {
        Args: { genre_filter?: string; lim?: number; period?: string }
        Returns: {
          artist_id: string
          artist_name: string
          cover_url: string
          downloads: number
          file_url: string
          genre: string
          likes: number
          plays: number
          score: number
          song_id: string
          title: string
        }[]
      }
      get_weekly_top_songs: {
        Args: { lim?: number }
        Returns: {
          artist_id: string
          artist_name: string
          cover_url: string
          file_url: string
          song_id: string
          title: string
          total_score: number
          weekly_downloads: number
          weekly_plays: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_click: { Args: { ad_id: string }; Returns: undefined }
      increment_ad_impression: { Args: { ad_id: string }; Returns: undefined }
      increment_download_count: {
        Args: { song_uuid: string }
        Returns: undefined
      }
      increment_play_count: { Args: { song_uuid: string }; Returns: undefined }
      is_active_supporter: {
        Args: { _artist_id: string; _user_id: string }
        Returns: boolean
      }
      is_artist_approved: { Args: { _artist_id: string }; Returns: boolean }
      is_song_purchased: {
        Args: { _song_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
