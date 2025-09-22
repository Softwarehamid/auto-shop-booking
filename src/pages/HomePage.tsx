import React, { useEffect, useState } from 'react';
import { Car, Star, Clock, Shield, Award, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ServiceCard } from '../components/ServiceCard';
import { getServices, getReviews } from '../lib/api';
import type { Service, Review } from '../lib/supabase';

interface HomePageProps {
  onBookService: (service: Service) => void;
}

export function HomePage({ onBookService }: HomePageProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesData, reviewsData] = await Promise.all([
        getServices(),
        getReviews()
      ]);
      setServices(servicesData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 5;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AutoDetail Pro</h1>
                <p className="text-sm text-gray-600">Professional Car Care</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>(555) 123-4567</span>
              </div>
              <Button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                Shine Inside and Out
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                Professional auto detailing services that make your vehicle look showroom new. 
                Book online in minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center space-x-2 text-blue-100">
                <Shield className="w-5 h-5" />
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <Clock className="w-5 h-5" />
                <span>Same-Day Appointments</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <Star className="w-5 h-5 fill-current" />
                <span>{averageRating.toFixed(1)}★ from {reviews.length}+ reviews</span>
              </div>
            </div>

            <Button 
              size="xl" 
              className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book Your Service Today
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Why Choose AutoDetail Pro?</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional expertise, premium products, and exceptional service every time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Expert Technicians</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Certified professionals with years of experience in automotive detailing and care.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Premium Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We use only the highest quality detailing products and equipment for best results.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Convenient Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Easy online booking system with flexible scheduling to fit your busy life.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Our Services</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From quick washes to complete detailing packages, we have the perfect service for your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                onSelect={onBookService}
                featured={index === 2} // Mark "Full Detail Package" as featured
              />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-3xl font-bold text-gray-900">What Our Customers Say</h3>
            <div className="flex items-center justify-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-current text-yellow-400" />
                ))}
              </div>
              <span className="text-xl font-semibold text-gray-900">
                {averageRating.toFixed(1)} out of 5
              </span>
              <span className="text-gray-600">({reviews.length} reviews)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.slice(0, 6).map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{review.name}</CardTitle>
                    <div className="flex space-x-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">"{review.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold">Ready to Book?</h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Get your vehicle detailed by our professional team. Book online now or contact us directly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="w-5 h-5" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="w-5 h-5" />
                <span>info@autodetailpro.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="w-5 h-5" />
                <span>123 Main St, Your City</span>
              </div>
            </div>

            <Button 
              size="xl"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book Your Service Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">AutoDetail Pro</span>
            </div>
            <p className="text-sm">
              © 2025 AutoDetail Pro. All rights reserved. Professional auto detailing services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}