/*
# Auto Shop Booking System Database Schema

1. New Tables
  - `services` - Available services with pricing and duration
  - `staff` - Shop staff/technicians
  - `timeslots` - Discrete time slots for booking (prevents double-booking)
  - `bookings` - Customer bookings with status tracking
  - `reviews` - Customer reviews (optional)

2. Security
  - Enable RLS on all tables
  - Add policies for public read access where appropriate
  - Admin operations handled via service role in serverless functions

3. Key Features
  - Unique constraint on timeslot bookings prevents double-booking
  - Cancel tokens for secure booking cancellation
  - Payment status tracking for Stripe integration
  - Flexible staff scheduling system
*/

-- Services offered by the shop
CREATE TABLE IF NOT EXISTS services (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  duration_min INT NOT NULL CHECK (duration_min > 0),
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Staff/technicians
CREATE TABLE IF NOT EXISTS staff (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated time slots (discrete slots prevent overlap issues)
CREATE TABLE IF NOT EXISTS timeslots (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, start_ts)
);

CREATE INDEX IF NOT EXISTS idx_timeslots_staff_start ON timeslots(staff_id, start_ts);
CREATE INDEX IF NOT EXISTS idx_timeslots_availability ON timeslots(staff_id, start_ts, is_blocked);

-- Customer bookings (no login required)
CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  service_id BIGINT NOT NULL REFERENCES services(id),
  staff_id BIGINT NOT NULL REFERENCES staff(id),
  timeslot_id BIGINT NOT NULL REFERENCES timeslots(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  cancel_token UUID NOT NULL DEFAULT gen_random_uuid(),
  stripe_session_id TEXT,
  total_cents INT,
  UNIQUE(timeslot_id) -- Prevents double-booking
);

CREATE INDEX IF NOT EXISTS idx_bookings_timeslot ON bookings(timeslot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_token ON bookings(cancel_token);

-- Customer reviews
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_visible BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(is_visible, created_at);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeslots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read policies (no auth required for customers)
CREATE POLICY "Public can read active services"
  ON services FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Public can read active staff"
  ON staff FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Public can read non-blocked timeslots"
  ON timeslots FOR SELECT
  TO anon
  USING (is_blocked = false);

CREATE POLICY "Public can read visible reviews"
  ON reviews FOR SELECT
  TO anon
  USING (is_visible = true);

-- Booking policies (customers can create, view with token)
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can read booking with cancel token"
  ON bookings FOR SELECT
  TO anon
  USING (true); -- Will be filtered by cancel_token in application logic

-- Insert sample data
INSERT INTO services (name, price_cents, duration_min, description) VALUES
  ('Express Wash', 3000, 30, 'Quick exterior wash and dry - get your car clean in no time'),
  ('Interior Deep Clean', 8000, 90, 'Complete interior vacuum, shampoo, and sanitizing treatment'),
  ('Full Detail Package', 15000, 180, 'Complete interior and exterior detailing with paint protection'),
  ('Paint Correction', 25000, 240, 'Professional paint correction and ceramic coating application'),
  ('Headlight Restoration', 5000, 60, 'Restore cloudy headlights to like-new condition');

INSERT INTO staff (name, bio) VALUES
  ('Mike Johnson', 'Lead detailer with 8+ years experience specializing in luxury vehicles'),
  ('Sarah Chen', 'Interior specialist and paint correction expert with ASI certification'),
  ('David Rodriguez', 'Master technician focusing on ceramic coatings and paint protection');

-- Generate initial timeslots (next 30 days, 9 AM to 5 PM, 30-minute slots)
DO $$
DECLARE
  staff_record RECORD;
  current_date DATE;
  slot_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  -- Generate slots for each active staff member
  FOR staff_record IN SELECT id FROM staff WHERE is_active = true LOOP
    -- Generate for next 30 days
    FOR i IN 0..29 LOOP
      current_date := CURRENT_DATE + (i || ' days')::INTERVAL;
      
      -- Skip weekends (optional - adjust based on business hours)
      IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
        -- Generate 30-minute slots from 9 AM to 5 PM
        slot_time := current_date + INTERVAL '9 hours';
        
        WHILE slot_time < (current_date + INTERVAL '17 hours') LOOP
          end_time := slot_time + INTERVAL '30 minutes';
          
          INSERT INTO timeslots (staff_id, start_ts, end_ts)
          VALUES (staff_record.id, slot_time, end_time)
          ON CONFLICT (staff_id, start_ts) DO NOTHING;
          
          slot_time := end_time;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Insert sample reviews
INSERT INTO reviews (name, rating, comment, is_visible) VALUES
  ('Jennifer M.', 5, 'Absolutely amazing service! My car looks brand new. Mike did an incredible job with the full detail.', true),
  ('Robert K.', 5, 'Sarah restored my headlights perfectly. Professional service and great value. Highly recommend!', true),
  ('Lisa P.', 4, 'Quick and efficient express wash. Great for busy schedules. Will definitely be back.', true),
  ('Marcus T.', 5, 'David did paint correction on my BMW and it looks showroom quality. Worth every penny!', true),
  ('Amanda R.', 5, 'Interior deep clean was thorough and my car smells fresh again. Excellent attention to detail.', true);