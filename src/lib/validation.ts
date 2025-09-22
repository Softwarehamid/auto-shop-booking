import { z } from 'zod';

export const bookingFormSchema = z.object({
  serviceId: z.number().positive('Please select a service'),
  staffId: z.number().positive('Please select a staff member'),
  timeslotId: z.number().positive('Please select a time slot'),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Please enter a valid email address'),
  customerPhone: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

export const adminKeySchema = z.object({
  key: z.string().min(1, 'Admin key is required')
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters')
});