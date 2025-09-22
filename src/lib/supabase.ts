import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up your Supabase connection.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Service {
  id: number;
  name: string;
  price_cents: number;
  duration_min: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Staff {
  id: number;
  name: string;
  bio: string;
  is_active: boolean;
  created_at: string;
}

export interface TimeSlot {
  id: number;
  staff_id: number;
  start_ts: string;
  end_ts: string;
  is_blocked: boolean;
  created_at: string;
}

export interface Booking {
  id: number;
  created_at: string;
  service_id: number;
  staff_id: number;
  timeslot_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  cancel_token: string;
  stripe_session_id?: string;
  total_cents?: number;
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_visible: boolean;
}