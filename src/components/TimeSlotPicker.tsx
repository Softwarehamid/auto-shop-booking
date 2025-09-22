import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { getAvailableSlots, getStaff } from '../lib/api';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import type { Service, Staff, TimeSlot } from '../lib/supabase';

interface TimeSlotPickerProps {
  service: Service;
  onSlotSelect: (slot: TimeSlot, staff: Staff, date: Date) => void;
  selectedDate?: Date;
  selectedStaffId?: number;
}

export function TimeSlotPicker({ 
  service, 
  onSlotSelect, 
  selectedDate: initialDate,
  selectedStaffId: initialStaffId 
}: TimeSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<number | undefined>(initialStaffId);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (selectedStaffId) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedStaffId, service.id]);

  const loadStaff = async () => {
    try {
      const staffData = await getStaff();
      setStaff(staffData);
      if (staffData.length > 0 && !selectedStaffId) {
        setSelectedStaffId(staffData[0].id);
      }
    } catch (err) {
      setError('Failed to load staff information');
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedStaffId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const slots = await getAvailableSlots(service.id, selectedStaffId, selectedDate);
      setAvailableSlots(slots);
    } catch (err) {
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = addDays(selectedDate, direction === 'next' ? 1 : -1);
    setSelectedDate(newDate);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    const selectedStaff = staff.find(s => s.id === selectedStaffId);
    if (selectedStaff) {
      onSlotSelect(slot, selectedStaff, selectedDate);
    }
  };

  const getDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  const formatSlotTime = (slot: TimeSlot) => {
    const startTime = new Date(slot.start_ts);
    const endTime = new Date(slot.end_ts);
    return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-500" />
            <span>Select Staff Member</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedStaffId(member.id)}
                className={`p-4 text-left rounded-lg border transition-all duration-200 hover:shadow-md ${
                  selectedStaffId === member.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-sm text-gray-600 mt-1">{member.bio}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span>Select Date</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange('prev')}
              disabled={isSameDay(selectedDate, new Date())}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-lg">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {getDateOptions().map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`p-3 text-center rounded-lg border transition-all duration-200 hover:shadow-sm ${
                  isSameDay(date, selectedDate)
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-medium">
                  {format(date, 'EEE')}
                </div>
                <div className="text-lg font-bold mt-1">
                  {format(date, 'd')}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading available times...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No available times for this date.</p>
              <p className="text-sm mt-2">Please select a different date or staff member.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant="outline"
                  onClick={() => handleSlotSelect(slot)}
                  className="h-auto p-4 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="font-medium">
                      {formatSlotTime(slot)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {service.duration_min} minutes
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}