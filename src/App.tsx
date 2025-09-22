import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';
import type { Service } from './lib/supabase';

type Page = 'home' | 'booking' | 'admin';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedService, setSelectedService] = useState<Service | undefined>();

  // Check if we're on admin route
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setCurrentPage('admin');
    }
  }, []);

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setCurrentPage('booking');
  };

  const handleBackToHome = () => {
    setSelectedService(undefined);
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onBookService={handleBookService} />;
      case 'booking':
        return (
          <BookingPage 
            initialService={selectedService} 
            onBack={handleBackToHome} 
          />
        );
      case 'admin':
        return <AdminPage />;
      default:
        return <HomePage onBookService={handleBookService} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;