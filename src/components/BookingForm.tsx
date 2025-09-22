import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Car, Calendar, Clock, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { createBooking, formatPrice, formatDuration } from '../lib/api';
import { bookingFormSchema, type BookingFormData } from '../lib/validation';
import { format } from 'date-fns';
import type { Service, Staff, TimeSlot } from '../lib/supabase';

interface BookingFormProps {
  service: Service;
  staff: Staff;
  timeSlot: TimeSlot;
  date: Date;
  onSuccess: (bookingId: number, cancelToken: string) => void;
  onCancel: () => void;
}

export function BookingForm({ 
  service, 
  staff, 
  timeSlot, 
  date, 
  onSuccess, 
  onCancel 
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: service.id,
      staffId: staff.id,
      timeslotId: timeSlot.id
    }
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createBooking({
        serviceId: data.serviceId,
        staffId: data.staffId,
        timeslotId: data.timeslotId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        notes: data.notes
      });

      onSuccess(result.bookingId, result.cancelToken);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSlotTime = () => {
    const startTime = new Date(timeSlot.start_ts);
    const endTime = new Date(timeSlot.end_ts);
    return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Booking Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Car className="w-5 h-5" />
            <span>Booking Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-blue-900">{service.name}</div>
                <div className="text-sm text-blue-700">
                  {formatDuration(service.duration_min)} • {formatPrice(service.price_cents)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-blue-900">{staff.name}</div>
                <div className="text-sm text-blue-700">Your technician</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-blue-900">
                  {format(date, 'EEEE, MMMM d')}
                </div>
                <div className="text-sm text-blue-700">{format(date, 'yyyy')}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-blue-900">{formatSlotTime()}</div>
                <div className="text-sm text-blue-700">
                  {formatDuration(service.duration_min)} session
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                placeholder="John Doe"
                required
                {...register('customerName')}
                error={errors.customerName?.message}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                required
                {...register('customerEmail')}
                error={errors.customerEmail?.message}
              />
            </div>

            <Input
              label="Phone Number"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('customerPhone')}
              error={errors.customerPhone?.message}
            />

            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">
                Additional Notes
                <span className="text-gray-500 ml-1">(Optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Any special requests or information we should know about your vehicle..."
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('notes')}
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-2">{errors.notes.message}</p>
              )}
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Back to Time Selection
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Booking...</span>
                  </div>
                ) : (
                  `Book Now • ${formatPrice(service.price_cents)}`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}