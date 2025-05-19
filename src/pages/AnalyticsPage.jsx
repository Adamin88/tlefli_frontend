import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BusinessAnalytics from '../components/BusinessAnalytics';
import dashboardService from '../services/dashboardService';
import itemsService from '../services/itemsService';
import { PresentationChartBarIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    categoryData: [],
    subcategoryData: {},
    statusData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (user?.userType !== 'business') {
        setError('Analytics are only available for business accounts');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get business ID
        const businessId = user.businessId || user._id;
        
        // Fetch all items for this business
        const itemsResponse = await itemsService.getAllItems({ businessId });
        
        if (itemsResponse.success && itemsResponse.data) {
          const items = itemsResponse.data;
          
          // Process category distribution
          const categoryCount = {};
          const subcategoryCount = {};
          const statusCount = {
            'posted': 0,
            'authenticating': 0, 
            'authenticated': 0,
            'returning': 0,
            'returned': 0
          };
          
          items.forEach(item => {
            // Count categories
            if (item.category) {
              categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
              
              // Count subcategories
              if (item.subcategory) {
                const subCatKey = `${item.category}-${item.subcategory}`;
                subcategoryCount[subCatKey] = (subcategoryCount[subCatKey] || 0) + 1;
              }
            }
            
            // Count statuses
            if (item.status) {
              statusCount[item.status] = (statusCount[item.status] || 0) + 1;
            }
          });
          
          // Format category data for charts
          const categoryData = Object.keys(categoryCount).map(cat => ({
            name: cat,
            value: categoryCount[cat]
          }));
          
          // Format subcategory data grouped by category
          const subcategoryData = {};
          Object.keys(subcategoryCount).forEach(key => {
            const [category, subcategory] = key.split('-');
            if (!subcategoryData[category]) {
              subcategoryData[category] = [];
            }
            subcategoryData[category].push({
              name: subcategory,
              value: subcategoryCount[key]
            });
          });
          
          // Format status data for charts
          const statusLabels = {
            'posted': 'Annonce déposée',
            'authenticating': 'Authentification en cours', 
            'authenticated': 'Authentification validée',
            'returning': 'Restitution en cours',
            'returned': 'Objet restitué'
          };
          
          const statusData = Object.keys(statusCount).map(status => ({
            name: statusLabels[status] || status,
            value: statusCount[status]
          }));
          
          setAnalyticsData({
            categoryData,
            subcategoryData,
            statusData
          });
          
          console.log('Processed analytics data:', {
            categoryData,
            subcategoryData,
            statusData
          });
        } else {
          // Fall back to mock data if needed
          console.log('Using mock data for analytics');
          const mockData = {
            categoryData: [
              { name: 'Electronics', value: 42 },
              { name: 'Clothing', value: 28 },
              { name: 'Personal Items', value: 15 },
              { name: 'Documents', value: 10 },
              { name: 'Other', value: 5 }
            ],
            subcategoryData: {
              'Electronics': [
                { name: 'Phones', value: 20 },
                { name: 'Laptops', value: 12 },
                { name: 'Tablets', value: 10 }
              ],
              'Clothing': [
                { name: 'Jackets', value: 10 },
                { name: 'Shoes', value: 8 },
                { name: 'Accessories', value: 10 }
              ]
            },
            statusData: [
              { name: 'Annonce déposée', value: 25 },
              { name: 'Authentification en cours', value: 15 },
              { name: 'Authentification validée', value: 20 },
              { name: 'Restitution en cours', value: 10 },
              { name: 'Objet restitué', value: 30 }
            ]
          };
          
          setAnalyticsData(mockData);
        }
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg mr-4">
              <PresentationChartBarIcon className="h-8 w-8 text-yellow-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Business Analytics</h1>
              <p className="text-gray-600 mt-1">Data insights for your lost and found operations</p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <div className="bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200 text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Content */}
      <div className="bg-gray-50 rounded-xl p-4 md:p-6 shadow-sm">
        <BusinessAnalytics data={analyticsData} />
      </div>
    </div>
  );
}
