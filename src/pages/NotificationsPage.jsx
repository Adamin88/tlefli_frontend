import React from 'react';
import NotificationsPanel from '../components/NotificationsPanel';

const NotificationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <NotificationsPanel />
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
