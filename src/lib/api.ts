import { supabase } from "./supabase";
import type { Service, Staff, TimeSlot, Booking, Review } from "./supabase";

export class ApiError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = "ApiError";
  }
}

// Services API
export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("price_cents");

  if (error) throw new ApiError(error.message);
  return data || [];
}

// Staff API
export async function getStaff(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new ApiError(error.message);
  return data || [];
}

// Reviews API
export async function getReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new ApiError(error.message);
  return data || [];
}

// Availability API (simplified - in production use Netlify Functions)
export async function getAvailableSlots(
  serviceId: number,
  staffId?: number,
  date?: Date
): Promise<TimeSlot[]> {
  let query = supabase
    .from("timeslots")
    .select(
      `
      *,
      bookings!left(id, status)
    `
    )
    .eq("is_blocked", false);

  if (staffId) {
    query = query.eq("staff_id", staffId);
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query
      .gte("start_ts", startOfDay.toISOString())
      .lte("start_ts", endOfDay.toISOString());
  } else {
    // Default to next 7 days
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    query = query
      .gte("start_ts", now.toISOString())
      .lte("start_ts", weekFromNow.toISOString());
  }

  const { data, error } = await query.order("start_ts");

  if (error) throw new ApiError(error.message);

  // Filter out booked slots
  const availableSlots = (data || []).filter((slot: any) => {
    return (
      !slot.bookings ||
      slot.bookings.length === 0 ||
      slot.bookings.every((booking: any) => booking.status === "cancelled")
    );
  });

  return availableSlots;
}

// Booking API (uses Netlify Functions for security and email functionality)
export async function createBooking(bookingData: {
  serviceId: number;
  staffId: number;
  timeslotId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}): Promise<{ bookingId: number; cancelToken: string }> {
  try {
    // First try to use the Netlify function (production environment)
    const response = await fetch("/.netlify/functions/create-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        bookingId: result.bookingId,
        cancelToken: result.cancelToken,
      };
    } else {
      throw new Error("Netlify function failed");
    }
  } catch (netlifyError) {
    console.log(
      "Netlify function unavailable, falling back to direct Supabase call"
    );

    // Fallback to direct Supabase calls for development
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        service_id: bookingData.serviceId,
        staff_id: bookingData.staffId,
        timeslot_id: bookingData.timeslotId,
        customer_name: bookingData.customerName,
        customer_email: bookingData.customerEmail,
        customer_phone: bookingData.customerPhone,
        notes: bookingData.notes,
        status: "confirmed",
      })
      .select("id, cancel_token")
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        throw new ApiError(
          "This time slot has already been booked. Please select another time."
        );
      }
      throw new ApiError(error.message);
    }

    console.log(
      "⚠️ Booking created without email confirmation (development mode)"
    );
    console.log(
      "📧 In production, confirmation emails would be sent to:",
      bookingData.customerEmail
    );

    return {
      bookingId: data.id,
      cancelToken: data.cancel_token,
    };
  }
}

// Get booking by ID and token (for cancellation)
export async function getBooking(
  bookingId: number,
  cancelToken: string
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("cancel_token", cancelToken)
    .single();

  if (error) return null;
  return data;
}

// Cancel booking
export async function cancelBooking(
  bookingId: number,
  cancelToken: string
): Promise<boolean> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("cancel_token", cancelToken);

  return !error;
}

// Utility functions
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
