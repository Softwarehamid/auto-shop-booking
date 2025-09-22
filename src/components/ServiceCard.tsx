import React from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { formatPrice, formatDuration } from '../lib/api';
import type { Service } from '../lib/supabase';

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
  featured?: boolean;
}

export function ServiceCard({ service, onSelect, featured }: ServiceCardProps) {
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        featured ? 'ring-2 ring-blue-500 relative overflow-hidden' : ''
      }`}
      onClick={() => onSelect(service)}
    >
      {featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-blue-600 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
          Popular
        </div>
      )}
      
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {service.name}
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm leading-relaxed">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-700">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">
              {formatDuration(service.duration_min)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(service.price_cents)}
            </span>
          </div>
        </div>
        
        <Button 
          className="w-full group-hover:bg-blue-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(service);
          }}
        >
          Book This Service
        </Button>
      </CardContent>
    </Card>
  );
}