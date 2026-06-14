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
      bookings: {
        Row: {
          address: string | null
          created_at: string
          home_collection: boolean
          id: string
          lab_id: string
          notes: string | null
          patient_id: string
          price: number
          report_url: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["booking_status"]
          test_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          home_collection?: boolean
          id?: string
          lab_id: string
          notes?: string | null
          patient_id: string
          price: number
          report_url?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          test_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          home_collection?: boolean
          id?: string
          lab_id?: string
          notes?: string | null
          patient_id?: string
          price?: number
          report_url?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests: {
        Row: {
          available: boolean
          created_at: string
          home_collection: boolean
          id: string
          lab_id: string
          price: number
          test_id: string
          turnaround_hours: number | null
        }
        Insert: {
          available?: boolean
          created_at?: string
          home_collection?: boolean
          id?: string
          lab_id: string
          price: number
          test_id: string
          turnaround_hours?: number | null
        }
        Update: {
          available?: boolean
          created_at?: string
          home_collection?: boolean
          id?: string
          lab_id?: string
          price?: number
          test_id?: string
          turnaround_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_tests_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          address: string
          city: string
          close_time: string | null
          created_at: string
          description: string | null
          email: string | null
          home_collection: boolean
          id: string
          image_url: string | null
          name: string
          open_time: string | null
          owner_id: string
          phone: string
          pincode: string
          premium_tier: Database["public"]["Enums"]["premium_tier"] | null
          promoted_priority: number | null
          rating: number
          total_reviews: number
          updated_at: string
          verified: boolean
          is_available: boolean
        }
        Insert: {
          address: string
          city: string
          close_time?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          home_collection?: boolean
          id?: string
          image_url?: string | null
          name: string
          open_time?: string | null
          owner_id: string
          phone: string
          pincode: string
          premium_tier?: Database["public"]["Enums"]["premium_tier"] | null
          promoted_priority?: number | null
          rating?: number
          total_reviews?: number
          updated_at?: string
          verified?: boolean
          is_available?: boolean
        }
        Update: {
          address?: string
          city?: string
          close_time?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          home_collection?: boolean
          id?: string
          image_url?: string | null
          name?: string
          open_time?: string | null
          owner_id?: string
          phone?: string
          pincode?: string
          premium_tier?: Database["public"]["Enums"]["premium_tier"] | null
          promoted_priority?: number | null
          rating?: number
          total_reviews?: number
          updated_at?: string
          verified?: boolean
          is_available?: boolean
        }
        Relationships: []
      }
      doctor_analytics_events: {
        Row: {
          created_at: string
          doctor_id: string
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          event_type: string
          id?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_analytics_events_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_appointments: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_id: string | null
          patient_name: string
          patient_phone: string
          preferred_date: string
          status: Database["public"]["Enums"]["appointment_status"]
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_id?: string | null
          patient_name: string
          patient_phone: string
          preferred_date: string
          status?: Database["public"]["Enums"]["appointment_status"]
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string
          preferred_date?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_gallery: {
        Row: {
          caption: string | null
          created_at: string
          doctor_id: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_gallery_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reviews: {
        Row: {
          comment: string | null
          created_at: string
          doctor_id: string
          id: string
          patient_id: string | null
          rating: number
          reviewer_name: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          patient_id?: string | null
          rating: number
          reviewer_name?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string | null
          rating?: number
          reviewer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          about: string | null
          clinic_address: string | null
          clinic_city: string
          clinic_name: string | null
          clinic_phone: string | null
          clinic_pincode: string | null
          close_time: string | null
          consultation_fee: number | null
          created_at: string
          experience_years: number | null
          full_name: string
          gender: string | null
          id: string
          map_embed_url: string | null
          map_lat: number | null
          map_lng: number | null
          open_time: string | null
          owner_id: string
          photo_url: string | null
          profile_views: number
          premium_tier: Database["public"]["Enums"]["premium_tier"] | null
          promoted_priority: number | null
          published: boolean
          qualification: string | null
          rating: number
          services: string[]
          slug: string
          specialization: string | null
          timings_note: string | null
          total_reviews: number
          updated_at: string
          verified: boolean
          is_available: boolean
          whatsapp: string | null
          whatsapp_clicks: number
        }
        Insert: {
          about?: string | null
          clinic_address?: string | null
          clinic_city?: string
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_pincode?: string | null
          close_time?: string | null
          consultation_fee?: number | null
          created_at?: string
          experience_years?: number | null
          full_name: string
          gender?: string | null
          id?: string
          map_embed_url?: string | null
          map_lat?: number | null
          map_lng?: number | null
          open_time?: string | null
          owner_id: string
          photo_url?: string | null
          profile_views?: number
          premium_tier?: Database["public"]["Enums"]["premium_tier"] | null
          promoted_priority?: number | null
          published?: boolean
          qualification?: string | null
          rating?: number
          services?: string[]
          slug?: string
          specialization?: string | null
          timings_note?: string | null
          total_reviews?: number
          updated_at?: string
          verified?: boolean
          is_available?: boolean
          whatsapp?: string | null
          whatsapp_clicks?: number
        }
        Update: {
          about?: string | null
          clinic_address?: string | null
          clinic_city?: string
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_pincode?: string | null
          close_time?: string | null
          consultation_fee?: number | null
          created_at?: string
          experience_years?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          map_embed_url?: string | null
          map_lat?: number | null
          map_lng?: number | null
          open_time?: string | null
          owner_id?: string
          photo_url?: string | null
          profile_views?: number
          premium_tier?: Database["public"]["Enums"]["premium_tier"] | null
          promoted_priority?: number | null
          published?: boolean
          qualification?: string | null
          rating?: number
          services?: string[]
          slug?: string
          specialization?: string | null
          timings_note?: string | null
          total_reviews?: number
          updated_at?: string
          verified?: boolean
          is_available?: boolean
          whatsapp?: string | null
          whatsapp_clicks?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_verifications: {
        Row: {
          address: string | null
          ai_summary: string | null
          authority_name: string | null
          created_at: string
          expiry_date: string | null
          full_name: string | null
          id: string
          issue_date: string | null
          partner_id: string
          partner_type: Database["public"]["Enums"]["partner_type"]
          registration_number: string | null
          rejected_at: string | null
          reviewer_id: string | null
          reviewer_remarks: string | null
          risk_breakdown: Json | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string | null
          suspended_at: string | null
          updated_at: string
          verification_score: number | null
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          authority_name?: string | null
          created_at?: string
          expiry_date?: string | null
          full_name?: string | null
          id?: string
          issue_date?: string | null
          partner_id: string
          partner_type: Database["public"]["Enums"]["partner_type"]
          registration_number?: string | null
          rejected_at?: string | null
          reviewer_id?: string | null
          reviewer_remarks?: string | null
          risk_breakdown?: Json | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string | null
          suspended_at?: string | null
          updated_at?: string
          verification_score?: number | null
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          authority_name?: string | null
          created_at?: string
          expiry_date?: string | null
          full_name?: string | null
          id?: string
          issue_date?: string | null
          partner_id?: string
          partner_type?: Database["public"]["Enums"]["partner_type"]
          registration_number?: string | null
          rejected_at?: string | null
          reviewer_id?: string | null
          reviewer_remarks?: string | null
          risk_breakdown?: Json | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string | null
          suspended_at?: string | null
          updated_at?: string
          verification_score?: number | null
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          lab_id: string
          patient_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          lab_id: string
          patient_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          lab_id?: string
          patient_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
      verification_documents: {
        Row: {
          ai_score: number | null
          classified_as: string | null
          created_at: string
          document_type: Database["public"]["Enums"]["verification_doc_type"]
          extracted_data: Json | null
          file_url: string
          flags: Json | null
          id: string
          verification_id: string
        }
        Insert: {
          ai_score?: number | null
          classified_as?: string | null
          created_at?: string
          document_type: Database["public"]["Enums"]["verification_doc_type"]
          extracted_data?: Json | null
          file_url: string
          flags?: Json | null
          id?: string
          verification_id: string
        }
        Update: {
          ai_score?: number | null
          classified_as?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["verification_doc_type"]
          extracted_data?: Json | null
          file_url?: string
          flags?: Json | null
          id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "partner_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          remarks: string | null
          verification_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          remarks?: string | null
          verification_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          remarks?: string | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "partner_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_order_items: {
        Row: {
          created_at: string
          id: string
          medicine_id: string | null
          medicine_name: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id?: string | null
          medicine_name: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string | null
          medicine_name?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicine_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_orders: {
        Row: {
          city: string
          created_at: string
          delivery_address: string
          delivery_fee: number
          discount: number
          eta_minutes: number | null
          id: string
          notes: string | null
          order_number: string
          patient_id: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          pharmacy_id: string
          phone: string
          pincode: string
          prescription_url: string | null
          rider_lat: number | null
          rider_lng: number | null
          rider_name: string | null
          rider_phone: string | null
          status: Database["public"]["Enums"]["medicine_order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          delivery_address: string
          delivery_fee?: number
          discount?: number
          eta_minutes?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          patient_id: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          pharmacy_id: string
          phone: string
          pincode: string
          prescription_url?: string | null
          rider_lat?: number | null
          rider_lng?: number | null
          rider_name?: string | null
          rider_phone?: string | null
          status?: Database["public"]["Enums"]["medicine_order_status"]
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          delivery_address?: string
          delivery_fee?: number
          discount?: number
          eta_minutes?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          patient_id?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          pharmacy_id?: string
          phone?: string
          pincode?: string
          prescription_url?: string | null
          rider_lat?: number | null
          rider_lng?: number | null
          rider_name?: string | null
          rider_phone?: string | null
          status?: Database["public"]["Enums"]["medicine_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_orders_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          manufacturer: string | null
          name: string
          pack_size: string | null
          requires_prescription: boolean
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          name: string
          pack_size?: string | null
          requires_prescription?: boolean
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          name?: string
          pack_size?: string | null
          requires_prescription?: boolean
          slug?: string
        }
        Relationships: []
      }
      order_tracking_events: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string
          status: Database["public"]["Enums"]["medicine_order_status"]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          status: Database["public"]["Enums"]["medicine_order_status"]
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["medicine_order_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          address: string
          city: string
          created_at: string
          delivery_fee: number
          express_delivery: boolean
          id: string
          min_order_amount: number
          name: string
          owner_id: string | null
          phone: string
          pincode: string
          rating: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          delivery_fee?: number
          express_delivery?: boolean
          id?: string
          min_order_amount?: number
          name: string
          owner_id?: string | null
          phone: string
          pincode: string
          rating?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          delivery_fee?: number
          express_delivery?: boolean
          id?: string
          min_order_amount?: number
          name?: string
          owner_id?: string | null
          phone?: string
          pincode?: string
          rating?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      pharmacy_medicines: {
        Row: {
          created_at: string
          express_delivery: boolean
          id: string
          medicine_id: string
          mrp: number
          pharmacy_id: string
          price: number
          stock: number
        }
        Insert: {
          created_at?: string
          express_delivery?: boolean
          id?: string
          medicine_id: string
          mrp: number
          pharmacy_id: string
          price: number
          stock?: number
        }
        Update: {
          created_at?: string
          express_delivery?: boolean
          id?: string
          medicine_id?: string
          mrp?: number
          pharmacy_id?: string
          price?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_medicines_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_medicines_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decide_verification: {
        Args: { _decision: string; _remarks?: string; _verification_id: string }
        Returns: {
          address: string | null
          ai_summary: string | null
          authority_name: string | null
          created_at: string
          expiry_date: string | null
          full_name: string | null
          id: string
          issue_date: string | null
          partner_id: string
          partner_type: Database["public"]["Enums"]["partner_type"]
          registration_number: string | null
          rejected_at: string | null
          reviewer_id: string | null
          reviewer_remarks: string | null
          risk_breakdown: Json | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string | null
          suspended_at: string | null
          updated_at: string
          verification_score: number | null
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "partner_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      flag_expiring_verifications: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_verification: {
        Args: { _verification_id: string }
        Returns: {
          address: string | null
          ai_summary: string | null
          authority_name: string | null
          created_at: string
          expiry_date: string | null
          full_name: string | null
          id: string
          issue_date: string | null
          partner_id: string
          partner_type: Database["public"]["Enums"]["partner_type"]
          registration_number: string | null
          rejected_at: string | null
          reviewer_id: string | null
          reviewer_remarks: string | null
          risk_breakdown: Json | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string | null
          suspended_at: string | null
          updated_at: string
          verification_score: number | null
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "partner_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      wallet_topup: {
        Args: { _amount: number; _description?: string }
        Returns: number
      }
      track_doctor_event: {
        Args: { _doctor_id: string; _event_type: string }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      premium_tier: "free" | "silver" | "gold" | "featured"
      medicine_order_status:
        | "pending"
        | "confirmed"
        | "packing"
        | "picked_up"
        | "out_for_delivery"
        | "nearby"
        | "delivered"
        | "cancelled"
      payment_mode: "cod" | "prepaid" | "wallet"
      app_role: "patient" | "doctor" | "lab" | "courier" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "sample_collected"
        | "processing"
        | "completed"
        | "cancelled"
      partner_type:
        | "doctor"
        | "laboratory"
        | "pharmacy"
        | "collection_center"
        | "franchise"
      verification_doc_type:
        | "aadhaar"
        | "pan"
        | "passport"
        | "medical_registration"
        | "drug_license"
        | "nabl_certificate"
        | "lab_registration"
        | "business_registration"
        | "other"
      verification_status:
        | "draft"
        | "submitted"
        | "ai_in_progress"
        | "manual_review"
        | "approved"
        | "rejected"
        | "suspended"
        | "expired"
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
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      premium_tier: ["free", "silver", "gold", "featured"],
      medicine_order_status: [
        "pending",
        "confirmed",
        "packing",
        "picked_up",
        "out_for_delivery",
        "nearby",
        "delivered",
        "cancelled",
      ],
      payment_mode: ["cod", "prepaid", "wallet"],
      app_role: ["patient", "doctor", "lab", "courier", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "sample_collected",
        "processing",
        "completed",
        "cancelled",
      ],
      partner_type: [
        "doctor",
        "laboratory",
        "pharmacy",
        "collection_center",
        "franchise",
      ],
      verification_doc_type: [
        "aadhaar",
        "pan",
        "passport",
        "medical_registration",
        "drug_license",
        "nabl_certificate",
        "lab_registration",
        "business_registration",
        "other",
      ],
      verification_status: [
        "draft",
        "submitted",
        "ai_in_progress",
        "manual_review",
        "approved",
        "rejected",
        "suspended",
        "expired",
      ],
    },
  },
} as const
