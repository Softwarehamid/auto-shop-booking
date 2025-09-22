import React, { useState } from 'react';
import { ChevronLeft, CheckCircle, Calendar, Car, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ServiceCard } from '../components/ServiceCard';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { BookingForm } from '../components/BookingForm';
import { getServices } from '../lib/api';
import { format } from 'date-fns';
import type { Service, Staff, TimeSlot } from '../lib/supabase';

interface BookingPageProps {
  initialService?: Service;
  onBack: () => void;
}

type BookingStep = 'service' | 'time' | 'details' | 'success';

interface BookingState {
  service?: Service;
  staff?: Staff;
  timeSlot?: TimeSlot;
  date?: Date;
  bookingId?: number;
  cancelToken?: string;
}

export function BookingPage({ initialService, onBack }: BookingPageProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>(initialService ? 'time' : 'service');
  const [services, setServices] = useState<Service[]>([]);
  const [bookingState, setBookingState] = useState<BookingState>({
    service: initialService
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (currentStep === 'service' && services.length === 0) {
      loadServices();
    }
  }, [currentStep, services.length]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const servicesData = await getServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setBookingState(prev => ({ ...prev, service }));
    setCurrentStep('time');
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot, staff: Staff, date: Date) => {
    setBookingState(prev => ({ 
      ...prev, 
      timeSlot, 
      staff, 
      date 
    }));
    setCurrentStep('details');
  };

  const handleBookingSuccess = (bookingId: number, cancelToken: string) => {
    setBookingState(prev => ({ 
      ...prev, 
      bookingId, 
      cancelToken 
    }));
    setCurrentStep('success');
  };

  const handleBackStep = () => {
    switch (currentStep) {
      case 'time':
        if (initialService) {
          onBack();
        } else {
          setCurrentStep('service');
        }
        break;
      case 'details':
        setCurrentStep('time');
        break;
      case 'success':
        onBack();
        break;
      default:
        onBack();
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'service', name: 'Service', icon: Car },
      { id: 'time', name: 'Time', icon: Calendar },
      { id: 'details', name: 'Details', icon: User },
      { id: 'success', name: 'Complete', icon: CheckCircle }
    ];

    const currentIndex = steps.findIndex(step => step.id === currentStep);

    return (
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-8">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <div className={`flex items-center space-x-2 ${
                isActive || isCompleted ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-px w-8 sm:w-16 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={handleBackStep}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Book Service</span>
            </div>

            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStepIndicator()}

        {/* Service Selection Step */}
        {currentStep === 'service' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Service</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select from our professional detailing services. Each service includes premium products and expert care.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading services...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onSelect={handleServiceSelect}
                    featured={index === 2}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time Selection Step */}
        {currentStep === 'time' && bookingState.service && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date & Time</h2>
              <p className="text-gray-600">
                Choose your preferred staff member and time slot for <strong>{bookingState.service.name}</strong>
              </p>
            </div>

            <TimeSlotPicker
              service={bookingState.service}
              onSlotSelect={handleTimeSlotSelect}
            />
          </div>
        )}

        {/* Booking Details Step */}
        {currentStep === 'details' && bookingState.service && bookingState.staff && bookingState.timeSlot && bookingState.date && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Booking</h2>
              <p className="text-gray-600">
                Just a few more details and you're all set!
              </p>
            </div>

            <BookingForm
              service={bookingState.service}
              staff={bookingState.staff}
              timeSlot={bookingState.timeSlot}
              date={bookingState.date}
              onSuccess={handleBookingSuccess}
              onCancel={() => setCurrentStep('time')}
            />
          </div>
        )}

        {/* Success Step */}
        {currentStep === 'success' && bookingState.service && bookingState.staff && bookingState.date && bookingState.timeSlot && (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h2>
              <p className="text-xl text-gray-600">
                Your <strong>{bookingState.service.name}</strong> appointment has been booked successfully.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-blue-900">Appointment Details</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Service:</span>
                  <p className="text-blue-900">{bookingState.service.name}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Technician:</span>
                  <p className="text-blue-900">{bookingState.staff.name}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Date:</span>
                  <p className="text-blue-900">{format(bookingState.date, 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Time:</span>
                  <p className="text-blue-900">
                    {format(new Date(bookingState.timeSlot.start_ts), 'h:mm a')} - {format(new Date(bookingState.timeSlot.end_ts), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-left bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900">What's Next?</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You'll receive a confirmation email with all the details</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>We'll send you a reminder 24 hours before your appointment</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>If you need to cancel or reschedule, use the link in your confirmation email</span>
                </li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => {
                  setBookingState({});
                  setCurrentStep('service');
                }}
                className="flex-1"
              >
                Book Another Service
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}