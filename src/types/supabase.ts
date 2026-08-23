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
      account_recovery_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_recovery_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      accountability_groups: {
        Row: {
          checkin_day: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          max_members: number | null
          meeting_frequency: string | null
          name: string
          owner_id: string | null
          sector: string
        }
        Insert: {
          checkin_day?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_members?: number | null
          meeting_frequency?: string | null
          name: string
          owner_id?: string | null
          sector: string
        }
        Update: {
          checkin_day?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_members?: number | null
          meeting_frequency?: string | null
          name?: string
          owner_id?: string | null
          sector?: string
        }
        Relationships: []
      }
      admin_action_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_action_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_crm_notes: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          note: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          note: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          note?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_crm_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "enriched_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_crm_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_crm_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      admin_invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          role: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          id?: string
          role?: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          role?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read_by: string[] | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read_by?: string[] | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read_by?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          is_pending_2fa: boolean
          last_active: string
          token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_pending_2fa?: boolean
          last_active?: string
          token?: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_pending_2fa?: boolean
          last_active?: string
          token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_user_tags: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          tag_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          tag_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "admin_crm_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "enriched_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_user_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          invited_by: string | null
          is_active: boolean
          last_login: string | null
          password_hash: string
          role: string
          totp_backup_codes: string[]
          totp_enabled: boolean
          totp_secret: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          role?: string
          totp_backup_codes?: string[]
          totp_enabled?: boolean
          totp_secret?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          role?: string
          totp_backup_codes?: string[]
          totp_enabled?: boolean
          totp_secret?: string | null
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string | null
          fn: string
          id: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          fn: string
          id?: string
          subject: string
        }
        Update: {
          created_at?: string | null
          fn?: string
          id?: string
          subject?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          automation_id: string | null
          email: string | null
          id: string
          reason: string | null
          status: string
          triggered_at: string | null
          user_id: string | null
        }
        Insert: {
          automation_id?: string | null
          email?: string | null
          id?: string
          reason?: string | null
          status?: string
          triggered_at?: string | null
          user_id?: string | null
        }
        Update: {
          automation_id?: string | null
          email?: string | null
          id?: string
          reason?: string | null
          status?: string
          triggered_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "marketing_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_investors: {
        Row: {
          created_at: string | null
          founder_id: string
          id: string
          investor_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          founder_id: string
          id?: string
          investor_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          founder_id?: string
          id?: string
          investor_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          ab_variant: string | null
          bounced_at: string | null
          campaign_id: string
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          email: string
          full_name: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string
          unsubscribe_token: string | null
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          ab_variant?: string | null
          bounced_at?: string | null
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          ab_variant?: string | null
          bounced_at?: string | null
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_data: {
        Row: {
          break_even_month: number
          channels: string
          cost_structure: string
          created_at: string
          customer_relationships: string
          customer_segments: string
          id: string
          key_activities: string
          key_partners: string
          key_resources: string
          monthly_costs: number
          monthly_revenue: number
          revenue_streams: string
          updated_at: string
          user_idea_id: string
          value_proposition: string
        }
        Insert: {
          break_even_month?: number
          channels?: string
          cost_structure?: string
          created_at?: string
          customer_relationships?: string
          customer_segments?: string
          id?: string
          key_activities?: string
          key_partners?: string
          key_resources?: string
          monthly_costs?: number
          monthly_revenue?: number
          revenue_streams?: string
          updated_at?: string
          user_idea_id: string
          value_proposition?: string
        }
        Update: {
          break_even_month?: number
          channels?: string
          cost_structure?: string
          created_at?: string
          customer_relationships?: string
          customer_segments?: string
          id?: string
          key_activities?: string
          key_partners?: string
          key_resources?: string
          monthly_costs?: number
          monthly_revenue?: number
          revenue_streams?: string
          updated_at?: string
          user_idea_id?: string
          value_proposition?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_data_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: true
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
          user_idea_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          user_idea_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          user_idea_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_conversations_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string | null
          expires_at: string
          founder_id: string
          id: string
          idea_id: string
          investor_id: string
          message: string | null
          responded_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          founder_id: string
          id?: string
          idea_id: string
          investor_id: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          founder_id?: string
          id?: string
          idea_id?: string
          investor_id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string | null
          end_reason: string | null
          ended_at: string | null
          ended_by: string | null
          founder_id: string
          id: string
          idea_id: string
          investor_id: string
          request_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          founder_id: string
          id?: string
          idea_id: string
          investor_id: string
          request_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          founder_id?: string
          id?: string
          idea_id?: string
          investor_id?: string
          request_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_segments: {
        Row: {
          contact_id: string
          created_by: string | null
          id: string
          joined_at: string | null
          segment_id: string
        }
        Insert: {
          contact_id: string
          created_by?: string | null
          id?: string
          joined_at?: string | null
          segment_id: string
        }
        Update: {
          contact_id?: string
          created_by?: string | null
          id?: string
          joined_at?: string | null
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_segments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_segments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          first_name: string | null
          follow_up_date: string | null
          full_name: string | null
          id: string
          last_contacted: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          priority: string | null
          role: string | null
          segment_id: string | null
          stage: string | null
          updated_at: string | null
          upload_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          follow_up_date?: string | null
          full_name?: string | null
          id?: string
          last_contacted?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string | null
          role?: string | null
          segment_id?: string | null
          stage?: string | null
          updated_at?: string | null
          upload_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          follow_up_date?: string | null
          full_name?: string | null
          id?: string
          last_contacted?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string | null
          role?: string | null
          segment_id?: string | null
          stage?: string | null
          updated_at?: string | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suppression_list: {
        Row: {
          created_at: string
          email: string
          id: string
          notes: string | null
          reason: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          reason?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          reason?: string
          source?: string | null
        }
        Relationships: []
      }
      feedback_replies: {
        Row: {
          admin_user_id: string | null
          body: string
          created_at: string | null
          feedback_id: string
          id: string
        }
        Insert: {
          admin_user_id?: string | null
          body?: string
          created_at?: string | null
          feedback_id: string
          id?: string
        }
        Update: {
          admin_user_id?: string | null
          body?: string
          created_at?: string | null
          feedback_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_replies_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_replies_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "user_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_profiles: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string | null
          founder_type: string | null
          has_idea: boolean | null
          id: string
          sectors_of_interest: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          founder_type?: string | null
          has_idea?: boolean | null
          id?: string
          sectors_of_interest?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          founder_type?: string | null
          has_idea?: boolean | null
          id?: string
          sectors_of_interest?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      group_checkins: {
        Row: {
          accomplished: string
          blocker: string | null
          created_at: string | null
          goal_for_next_week: string | null
          goal_next_week: string
          group_id: string
          id: string
          progress_text: string | null
          streak: number | null
          user_id: string
          week_start: string
        }
        Insert: {
          accomplished: string
          blocker?: string | null
          created_at?: string | null
          goal_for_next_week?: string | null
          goal_next_week: string
          group_id: string
          id?: string
          progress_text?: string | null
          streak?: number | null
          user_id: string
          week_start: string
        }
        Update: {
          accomplished?: string
          blocker?: string | null
          created_at?: string | null
          goal_for_next_week?: string | null
          goal_next_week?: string
          group_id?: string
          id?: string
          progress_text?: string | null
          streak?: number | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_checkins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "accountability_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          missed_checkins: number | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          missed_checkins?: number | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          missed_checkins?: number | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "accountability_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_documents: {
        Row: {
          error: string | null
          extracted_at: string | null
          extraction: Json | null
          file_name: string
          file_path: string
          id: string
          page_count: number | null
          size_bytes: number | null
          status: string
          uploaded_at: string
          user_id: string
          user_idea_id: string
        }
        Insert: {
          error?: string | null
          extracted_at?: string | null
          extraction?: Json | null
          file_name: string
          file_path: string
          id?: string
          page_count?: number | null
          size_bytes?: number | null
          status?: string
          uploaded_at?: string
          user_id: string
          user_idea_id: string
        }
        Update: {
          error?: string | null
          extracted_at?: string | null
          extraction?: Json | null
          file_name?: string
          file_path?: string
          id?: string
          page_count?: number | null
          size_bytes?: number | null
          status?: string
          uploaded_at?: string
          user_id?: string
          user_idea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_documents_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_interests: {
        Row: {
          created_at: string
          id: string
          idea_id: string | null
          investor_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id?: string | null
          investor_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string | null
          investor_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_interests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_interests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_views: {
        Row: {
          id: string
          idea_id: string
          investor_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          idea_id: string
          investor_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          idea_id?: string
          investor_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_views_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_messages: {
        Row: {
          action_prompt: string
          category: string
          created_at: string
          id: string
          main_content: string
          main_title: string
          message_number: number
          subject_line: string
        }
        Insert: {
          action_prompt: string
          category: string
          created_at?: string
          id?: string
          main_content: string
          main_title: string
          message_number?: number
          subject_line: string
        }
        Update: {
          action_prompt?: string
          category?: string
          created_at?: string
          id?: string
          main_content?: string
          main_title?: string
          message_number?: number
          subject_line?: string
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          bio: string | null
          check_size: string | null
          check_size_max: number | null
          check_size_min: number | null
          city: string | null
          created_at: string | null
          id: string
          investor_type: string | null
          is_verified: boolean | null
          linkedin_url: string | null
          sectors_of_interest: string[] | null
          state: string | null
          updated_at: string | null
          user_id: string
          value_add: string | null
        }
        Insert: {
          bio?: string | null
          check_size?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          city?: string | null
          created_at?: string | null
          id?: string
          investor_type?: string | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          sectors_of_interest?: string[] | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          value_add?: string | null
        }
        Update: {
          bio?: string | null
          check_size?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          city?: string | null
          created_at?: string | null
          id?: string
          investor_type?: string | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          sectors_of_interest?: string[] | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          value_add?: string | null
        }
        Relationships: []
      }
      journey_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          notes: string | null
          task_key: string
          user_idea_id: string
          week_number: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          task_key?: string
          user_idea_id: string
          week_number: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          task_key?: string
          user_idea_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "journey_tasks_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      library_grabs: {
        Row: {
          converted_at: string | null
          grabbed_at: string | null
          id: string
          library_idea_id: string
          status: string
          user_id: string
          user_idea_id: string | null
        }
        Insert: {
          converted_at?: string | null
          grabbed_at?: string | null
          id?: string
          library_idea_id: string
          status?: string
          user_id: string
          user_idea_id?: string | null
        }
        Update: {
          converted_at?: string | null
          grabbed_at?: string | null
          id?: string
          library_idea_id?: string
          status?: string
          user_id?: string
          user_idea_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_grabs_library_idea_id_fkey"
            columns: ["library_idea_id"]
            isOneToOne: false
            referencedRelation: "library_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_grabs_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      library_idea_views: {
        Row: {
          id: string
          library_idea_id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          library_idea_id: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          library_idea_id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_idea_views_library_idea_id_fkey"
            columns: ["library_idea_id"]
            isOneToOne: false
            referencedRelation: "library_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      library_ideas: {
        Row: {
          best_markets: string
          biggest_challenge: string
          break_even_months: number | null
          created_at: string
          difficulty: string
          emoji: string
          est_roi_max: number | null
          est_roi_min: number | null
          financial_estimates: string
          grab_count: number
          id: string
          initial_investment_max: number | null
          initial_investment_min: number | null
          is_featured: boolean
          is_published: boolean
          last_edited_at: string | null
          last_edited_by: string | null
          monthly_revenue_y1_max: number | null
          monthly_revenue_y1_min: number | null
          problem: string
          quick_start_steps: string
          revenue_model: string
          sector: string
          slug: string | null
          solution: string
          spots_taken: number | null
          spots_total: number | null
          tagline: string
          tags: string[]
          target_market: string
          time_to_launch_weeks: number
          title: string
          updated_at: string | null
          view_count: number
          why_now: string
        }
        Insert: {
          best_markets?: string
          biggest_challenge?: string
          break_even_months?: number | null
          created_at?: string
          difficulty?: string
          emoji?: string
          est_roi_max?: number | null
          est_roi_min?: number | null
          financial_estimates?: string
          grab_count?: number
          id?: string
          initial_investment_max?: number | null
          initial_investment_min?: number | null
          is_featured?: boolean
          is_published?: boolean
          last_edited_at?: string | null
          last_edited_by?: string | null
          monthly_revenue_y1_max?: number | null
          monthly_revenue_y1_min?: number | null
          problem?: string
          quick_start_steps?: string
          revenue_model?: string
          sector?: string
          slug?: string | null
          solution?: string
          spots_taken?: number | null
          spots_total?: number | null
          tagline?: string
          tags?: string[]
          target_market?: string
          time_to_launch_weeks?: number
          title?: string
          updated_at?: string | null
          view_count?: number
          why_now?: string
        }
        Update: {
          best_markets?: string
          biggest_challenge?: string
          break_even_months?: number | null
          created_at?: string
          difficulty?: string
          emoji?: string
          est_roi_max?: number | null
          est_roi_min?: number | null
          financial_estimates?: string
          grab_count?: number
          id?: string
          initial_investment_max?: number | null
          initial_investment_min?: number | null
          is_featured?: boolean
          is_published?: boolean
          last_edited_at?: string | null
          last_edited_by?: string | null
          monthly_revenue_y1_max?: number | null
          monthly_revenue_y1_min?: number | null
          problem?: string
          quick_start_steps?: string
          revenue_model?: string
          sector?: string
          slug?: string | null
          solution?: string
          spots_taken?: number | null
          spots_total?: number | null
          tagline?: string
          tags?: string[]
          target_market?: string
          time_to_launch_weeks?: number
          title?: string
          updated_at?: string | null
          view_count?: number
          why_now?: string
        }
        Relationships: []
      }
      marketing_automations: {
        Row: {
          created_at: string | null
          delay_hours: number
          frequency_cap: number
          id: string
          last_triggered_at: string | null
          name: string
          segment_id: string | null
          status: string
          template_id: string | null
          times_triggered: number
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delay_hours?: number
          frequency_cap?: number
          id?: string
          last_triggered_at?: string | null
          name: string
          segment_id?: string | null
          status?: string
          template_id?: string | null
          times_triggered?: number
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delay_hours?: number
          frequency_cap?: number
          id?: string
          last_triggered_at?: string | null
          name?: string
          segment_id?: string | null
          status?: string
          template_id?: string | null
          times_triggered?: number
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_automations_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_automations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          ab_enabled: boolean
          ab_variants: Json | null
          body_html: string
          bounce_count: number
          click_count: number
          created_at: string
          deliver_count: number
          from_email: string
          from_name: string
          id: string
          name: string
          open_count: number
          preview_text: string | null
          reply_to: string | null
          scheduled_at: string | null
          segment_id: string | null
          send_mode: string
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
          total_recipients: number
          unsubscribe_count: number
          updated_at: string
        }
        Insert: {
          ab_enabled?: boolean
          ab_variants?: Json | null
          body_html: string
          bounce_count?: number
          click_count?: number
          created_at?: string
          deliver_count?: number
          from_email?: string
          from_name?: string
          id?: string
          name: string
          open_count?: number
          preview_text?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          segment_id?: string | null
          send_mode?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          total_recipients?: number
          unsubscribe_count?: number
          updated_at?: string
        }
        Update: {
          ab_enabled?: boolean
          ab_variants?: Json | null
          body_html?: string
          bounce_count?: number
          click_count?: number
          created_at?: string
          deliver_count?: number
          from_email?: string
          from_name?: string
          id?: string
          name?: string
          open_count?: number
          preview_text?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          segment_id?: string | null
          send_mode?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          total_recipients?: number
          unsubscribe_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_segments: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          rules: Json | null
          type: string
          updated_at: string | null
          user_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          rules?: Json | null
          type?: string
          updated_at?: string | null
          user_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          rules?: Json | null
          type?: string
          updated_at?: string | null
          user_count?: number | null
        }
        Relationships: []
      }
      marketing_templates: {
        Row: {
          body_html: string
          category: string
          created_at: string
          id: string
          is_builtin: boolean
          name: string
          preview_text: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          category?: string
          created_at?: string
          id?: string
          is_builtin?: boolean
          name: string
          preview_text?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          category?: string
          created_at?: string
          id?: string
          is_builtin?: boolean
          name?: string
          preview_text?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_uploads: {
        Row: {
          created_at: string
          duplicate_rows: number
          error_details: Json | null
          filename: string
          id: string
          invalid_rows: number
          segment_id: string | null
          segment_name: string | null
          status: string
          suppressed_rows: number
          total_rows: number
          valid_rows: number
        }
        Insert: {
          created_at?: string
          duplicate_rows?: number
          error_details?: Json | null
          filename: string
          id?: string
          invalid_rows?: number
          segment_id?: string | null
          segment_name?: string | null
          status?: string
          suppressed_rows?: number
          total_rows?: number
          valid_rows?: number
        }
        Update: {
          created_at?: string
          duplicate_rows?: number
          error_details?: Json | null
          filename?: string
          id?: string
          invalid_rows?: number
          segment_id?: string | null
          segment_name?: string | null
          status?: string
          suppressed_rows?: number
          total_rows?: number
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_uploads_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          connection_id: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_system_message: boolean | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          connection_id: string
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_system_message?: boolean | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          connection_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_system_message?: boolean | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_logs: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          milestone_type: string
          note: string | null
          user_id: string
          user_idea_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          milestone_type: string
          note?: string | null
          user_id: string
          user_idea_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          milestone_type?: string
          note?: string | null
          user_id?: string
          user_idea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_logs_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      mrr_snapshots: {
        Row: {
          accelerator_count: number
          builder_count: number
          churned_mrr: number
          created_at: string
          family_count: number
          growth_count: number
          id: string
          launch_count: number
          month: string
          new_mrr: number
          pro_count: number
          total_customers: number
          total_mrr: number
        }
        Insert: {
          accelerator_count?: number
          builder_count?: number
          churned_mrr?: number
          created_at?: string
          family_count?: number
          growth_count?: number
          id?: string
          launch_count?: number
          month: string
          new_mrr?: number
          pro_count?: number
          total_customers?: number
          total_mrr?: number
        }
        Update: {
          accelerator_count?: number
          builder_count?: number
          churned_mrr?: number
          created_at?: string
          family_count?: number
          growth_count?: number
          id?: string
          launch_count?: number
          month?: string
          new_mrr?: number
          pro_count?: number
          total_customers?: number
          total_mrr?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pitch_data: {
        Row: {
          break_even_summary: string | null
          elevator_pitch: string | null
          id: string
          investment_amount: number | null
          is_published: boolean
          last_generated_at: string | null
          pitch_problem: string | null
          pitch_solution: string | null
          projected_roi: string | null
          published_at: string | null
          revenue_model: string | null
          target_market: string | null
          use_of_funds: string | null
          user_id: string
          user_idea_id: string
        }
        Insert: {
          break_even_summary?: string | null
          elevator_pitch?: string | null
          id?: string
          investment_amount?: number | null
          is_published?: boolean
          last_generated_at?: string | null
          pitch_problem?: string | null
          pitch_solution?: string | null
          projected_roi?: string | null
          published_at?: string | null
          revenue_model?: string | null
          target_market?: string | null
          use_of_funds?: string | null
          user_id: string
          user_idea_id: string
        }
        Update: {
          break_even_summary?: string | null
          elevator_pitch?: string | null
          id?: string
          investment_amount?: number | null
          is_published?: boolean
          last_generated_at?: string | null
          pitch_problem?: string | null
          pitch_solution?: string | null
          projected_roi?: string | null
          published_at?: string | null
          revenue_model?: string | null
          target_market?: string | null
          use_of_funds?: string | null
          user_id?: string
          user_idea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_data_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: true
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number
          email_digest_enabled: boolean
          email_verified: boolean
          full_name: string
          id: string
          inspiration_enabled: boolean
          inspiration_week_number: number | null
          investor_match_alerts: boolean | null
          last_active: string | null
          last_login_at: string | null
          last_login_date: string | null
          lead_score: number | null
          lifecycle_stage: string | null
          login_count: number | null
          message_notifications: boolean | null
          onboarding_completed: boolean
          plan: string
          role: string
          status: string
          stress_test_completed: boolean
          stripe_customer_id: string | null
          suspended_at: string | null
          suspension_reason: string | null
          tier: string | null
          total_revenue: number | null
          unsubscribe_token: string
          updated_at: string | null
          user_id: string
          user_status: string | null
          validation_notifications: boolean | null
          visited_pricing: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number
          email_digest_enabled?: boolean
          email_verified?: boolean
          full_name?: string
          id?: string
          inspiration_enabled?: boolean
          inspiration_week_number?: number | null
          investor_match_alerts?: boolean | null
          last_active?: string | null
          last_login_at?: string | null
          last_login_date?: string | null
          lead_score?: number | null
          lifecycle_stage?: string | null
          login_count?: number | null
          message_notifications?: boolean | null
          onboarding_completed?: boolean
          plan?: string
          role?: string
          status?: string
          stress_test_completed?: boolean
          stripe_customer_id?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          tier?: string | null
          total_revenue?: number | null
          unsubscribe_token?: string
          updated_at?: string | null
          user_id: string
          user_status?: string | null
          validation_notifications?: boolean | null
          visited_pricing?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number
          email_digest_enabled?: boolean
          email_verified?: boolean
          full_name?: string
          id?: string
          inspiration_enabled?: boolean
          inspiration_week_number?: number | null
          investor_match_alerts?: boolean | null
          last_active?: string | null
          last_login_at?: string | null
          last_login_date?: string | null
          lead_score?: number | null
          lifecycle_stage?: string | null
          login_count?: number | null
          message_notifications?: boolean | null
          onboarding_completed?: boolean
          plan?: string
          role?: string
          status?: string
          stress_test_completed?: boolean
          stripe_customer_id?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          tier?: string | null
          total_revenue?: number | null
          unsubscribe_token?: string
          updated_at?: string | null
          user_id?: string
          user_status?: string | null
          validation_notifications?: boolean | null
          visited_pricing?: boolean | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          description: string
          discount_pct: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string
          description?: string
          discount_pct: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          description?: string
          discount_pct?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: []
      }
      resource_documents: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          id: string
          is_published: boolean
          mime_type: string | null
          size_bytes: number | null
          sort_order: number
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          is_published?: boolean
          mime_type?: string | null
          size_bytes?: number | null
          sort_order?: number
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          is_published?: boolean
          mime_type?: string | null
          size_bytes?: number | null
          sort_order?: number
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      revenue_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          event_type: string
          id: string
          plan: string | null
          stripe_event_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          event_type: string
          id?: string
          plan?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          event_type?: string
          id?: string
          plan?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_ideas: {
        Row: {
          created_at: string | null
          id: string
          idea_id: string
          investor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          idea_id: string
          investor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          idea_id?: string
          investor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_ideas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      seeds: {
        Row: {
          color: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      segment_members: {
        Row: {
          added_at: string | null
          id: string
          segment_id: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          segment_id?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          segment_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "enriched_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "segment_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      site_analytics_daily: {
        Row: {
          avg_session_duration_seconds: number | null
          bounce_rate: number | null
          date: string
          desktop_users: number | null
          direct_traffic: number | null
          id: string
          mobile_users: number | null
          new_users: number | null
          organic_traffic: number | null
          page_views: number | null
          paid_traffic: number | null
          referral_traffic: number | null
          returning_users: number | null
          social_traffic: number | null
          tablet_users: number | null
          visitors: number | null
        }
        Insert: {
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          date: string
          desktop_users?: number | null
          direct_traffic?: number | null
          id?: string
          mobile_users?: number | null
          new_users?: number | null
          organic_traffic?: number | null
          page_views?: number | null
          paid_traffic?: number | null
          referral_traffic?: number | null
          returning_users?: number | null
          social_traffic?: number | null
          tablet_users?: number | null
          visitors?: number | null
        }
        Update: {
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          date?: string
          desktop_users?: number | null
          direct_traffic?: number | null
          id?: string
          mobile_users?: number | null
          new_users?: number | null
          organic_traffic?: number | null
          page_views?: number | null
          paid_traffic?: number | null
          referral_traffic?: number | null
          returning_users?: number | null
          social_traffic?: number | null
          tablet_users?: number | null
          visitors?: number | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          category: string
          id: string
          key: string
          label: string
          sort_order: number
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string
          id?: string
          key: string
          label?: string
          sort_order?: number
          type?: string
          updated_at?: string
          value?: string
        }
        Update: {
          category?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          billing_cycle: string
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          days_to_first_dollar: number | null
          id: string
          idea: string
          is_featured: boolean | null
          is_published: boolean | null
          name: string
          quote: string | null
          role: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          days_to_first_dollar?: number | null
          id?: string
          idea: string
          is_featured?: boolean | null
          is_published?: boolean | null
          name: string
          quote?: string | null
          role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          days_to_first_dollar?: number | null
          id?: string
          idea?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          name?: string
          quote?: string | null
          role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          body: string
          category: string
          created_at: string | null
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          body?: string
          category?: string
          created_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          body?: string
          category?: string
          created_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      swot_analyses: {
        Row: {
          generated_at: string
          id: string
          opportunities: Json
          strengths: Json
          threats: Json
          user_id: string
          user_idea_id: string
          weaknesses: Json
        }
        Insert: {
          generated_at?: string
          id?: string
          opportunities?: Json
          strengths?: Json
          threats?: Json
          user_id: string
          user_idea_id: string
          weaknesses?: Json
        }
        Update: {
          generated_at?: string
          id?: string
          opportunities?: Json
          strengths?: Json
          threats?: Json
          user_id?: string
          user_idea_id?: string
          weaknesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "swot_analyses_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: true
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          key: string
          label?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          display_name: string
          id: string
          is_published: boolean | null
          quote: string
          role: string
          sort_order: number | null
          source_review_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name: string
          id?: string
          is_published?: boolean | null
          quote: string
          role: string
          sort_order?: number | null
          source_review_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          id?: string
          is_published?: boolean | null
          quote?: string
          role?: string
          sort_order?: number | null
          source_review_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_source_review_id_fkey"
            columns: ["source_review_id"]
            isOneToOne: false
            referencedRelation: "user_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          body: string
          created_at: string | null
          id: string
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          body?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_type: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "enriched_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          assigned_to: string | null
          body: string
          created_at: string | null
          id: string
          priority: string
          status: string
          subject: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          body?: string
          created_at?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          body?: string
          created_at?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ideas: {
        Row: {
          advantage: string
          business_name: string
          city: string
          coach_assessment: number | null
          coach_assessment_at: string | null
          coach_assessment_note: string | null
          created_at: string
          differentiator: string
          id: string
          in_marketplace: boolean
          iq_breakdown: Json | null
          iq_score: number
          library_idea_id: string | null
          problem: string
          sector: string
          solution: string
          stage: string
          takeoff_celebrated_at: string | null
          takeoff_ready_at: string | null
          target_customer: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advantage?: string
          business_name?: string
          city?: string
          coach_assessment?: number | null
          coach_assessment_at?: string | null
          coach_assessment_note?: string | null
          created_at?: string
          differentiator?: string
          id?: string
          in_marketplace?: boolean
          iq_breakdown?: Json | null
          iq_score?: number
          library_idea_id?: string | null
          problem?: string
          sector?: string
          solution?: string
          stage?: string
          takeoff_celebrated_at?: string | null
          takeoff_ready_at?: string | null
          target_customer?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advantage?: string
          business_name?: string
          city?: string
          coach_assessment?: number | null
          coach_assessment_at?: string | null
          coach_assessment_note?: string | null
          created_at?: string
          differentiator?: string
          id?: string
          in_marketplace?: boolean
          iq_breakdown?: Json | null
          iq_score?: number
          library_idea_id?: string | null
          problem?: string
          sector?: string
          solution?: string
          stage?: string
          takeoff_celebrated_at?: string | null
          takeoff_ready_at?: string | null
          target_customer?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inspiration_log: {
        Row: {
          id: string
          message_id: string
          sent_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          id?: string
          message_id: string
          sent_at?: string
          user_id: string
          week_number: number
        }
        Update: {
          id?: string
          message_id?: string
          sent_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_inspiration_log_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "inspiration_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inspiration_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reviews: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          idea_id: string | null
          photo_url: string | null
          rating: number
          stage_name: string | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          idea_id?: string | null
          photo_url?: string | null
          rating: number
          stage_name?: string | null
          trigger_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          idea_id?: string | null
          photo_url?: string | null
          rating?: number
          stage_name?: string | null
          trigger_type?: string
          user_id?: string
        }
        Relationships: []
      }
      validation_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string
          sentiment: string | null
          type: string
          user_idea_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string
          sentiment?: string | null
          type?: string
          user_idea_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string
          sentiment?: string | null
          type?: string
          user_idea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_entries_user_idea_id_fkey"
            columns: ["user_idea_id"]
            isOneToOne: false
            referencedRelation: "user_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      enriched_users: {
        Row: {
          created_at: string | null
          full_name: string | null
          ideas_count: number | null
          iq_score: number | null
          last_login_at: string | null
          lead_score: number | null
          lifecycle_stage: string | null
          login_count: number | null
          role: string | null
          tier: string | null
          user_id: string | null
          user_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _call_edge_function: {
        Args: { fn_name: string; payload: Json }
        Returns: undefined
      }
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      get_user_email: { Args: { target_user_id: string }; Returns: string }
      increment_promo_uses: { Args: { code_id: string }; Returns: undefined }
      increment_total_revenue: {
        Args: { inc_amount: number; target_user_id: string }
        Returns: undefined
      }
      record_campaign_unsubscribe: {
        Args: { p_campaign: string; p_email: string }
        Returns: undefined
      }
      send_weekly_digests: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
