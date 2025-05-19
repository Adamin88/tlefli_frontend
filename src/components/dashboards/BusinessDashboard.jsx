import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  DocumentPlusIcon,
  UserGroupIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ArrowPathRoundedSquareIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import ItemCard from '../ItemCard';
import { useAuth } from '../../contexts/AuthContext';
import itemsService from '../../services/itemsService';
import { useNavigate } from 'react-router-dom';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalLost: 0,
    totalFound: 0,
    totalReturned: 0,
    activeUsers: 0
  });
  const [items, setItems] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      console.log('Current user:', user);
      try {
        setIsLoading(true);
        setError(null);
        
        // Make sure we have the user ID in a consistent format
        const userId = user.id || user._id;
        
        // Log the request details
        console.log('Fetching items for business user:', {
          userId: userId,
          status: selectedStatus
        });

        // Use userId parameter to ensure we only get this user's items
        const response = await itemsService.getAllItems({
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          userId: userId // Explicitly pass userId to ensure we only get this user's items
        });

        console.log('API Response:', response);

        if (response.success && response.data) {
          // Log the received items
          console.log('Received items:', response.data);
          
          // Set the items
          setItems(response.data);
          
          // Calculate stats
          const totalLost = response.data.filter(item => item.type === 'lost').length;
          const totalFound = response.data.filter(item => item.type === 'found').length;
          const totalReturned = response.data.filter(item => item.status === 'returned').length;
          const uniqueUsers = new Set(response.data.map(item => item.reportedBy?._id)).size;
          
          setStats({
            totalLost,
            totalFound,
            totalReturned,
            activeUsers: uniqueUsers
          });
        } else {
          console.error('Invalid response format:', response);
          setError('Failed to load items. Invalid response format.');
          setItems([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load items. Please try again later.');
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, selectedStatus]);

  const stats_cards = [
    {
      name: 'Objets Perdus',
      value: stats.totalLost,
      icon: DocumentMagnifyingGlassIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Objets Trouvés',
      value: stats.totalFound,
      icon: DocumentPlusIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Objets Restitués',
      value: stats.totalReturned,
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Utilisateurs Actifs',
      value: stats.activeUsers,
      icon: UserGroupIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const statusConfig = [
    { value: 'all', label: 'Tous', icon: FunnelIcon },
    { value: 'posted', label: 'Annonce déposée', icon: PaperAirplaneIcon },
    { value: 'authenticating', label: 'Authentification en cours', icon: MagnifyingGlassIcon },
    { value: 'authenticated', label: 'Authentification validée', icon: ShieldCheckIcon },
    { value: 'returning', label: 'Restitution en cours', icon: ArrowPathRoundedSquareIcon },
    { value: 'returned', label: 'Objet restitué', icon: CheckBadgeIcon }
  ];

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats_cards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon
                    className={`h-6 w-6 ${stat.color}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {statusConfig.map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                selectedStatus === status.value
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <status.icon className="h-4 w-4 mr-2" />
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="bg-white shadow rounded-lg p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => loadData()}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Try Again
            </button>
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              console.log('Rendering item:', item);
              return (
                <ItemCard
                  key={item._id}
                  item={{
                    ...item,
                    reportedBy: item.reportedBy || {},
                    contact: {
                      email: item.reportedBy?.email,
                      phone: item.reportedBy?.phone
                    }
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <img
                src="/empty-box.svg"
                alt="No items"
                className="w-48 h-48 mx-auto mb-4 text-gray-400"
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Items Found
              </h3>
              <p className="text-gray-500 mb-6">
                Start managing lost and found items by adding your first item.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/report-item?type=lost')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <DocumentPlusIcon className="h-5 w-5 mr-2" />
                  Add Lost Item
                </button>
                <button
                  onClick={() => navigate('/report-item?type=found')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Add Found Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
