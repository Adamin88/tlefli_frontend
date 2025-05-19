import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BusinessDashboard from '../components/dashboards/BusinessDashboard';
import IndividualDashboard from '../components/dashboards/IndividualDashboard';
import dashboardService from '../services/dashboardService';
import itemsService from '../services/itemsService';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalLost: 0,
      totalFound: 0,
      totalReturned: 0,
      activeUsers: 0,
    },
    recentItems: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Add delay before navigation to prevent race condition
    let redirectTimer;
    
    if (!isAuthenticated) {
      redirectTimer = setTimeout(() => {
        navigate('/login');
      }, 500); // Small delay
      return () => clearTimeout(redirectTimer);
    }

    if (!user) {
      return; // Wait for user data to be loaded
    }

    const fetchDashboardData = async () => {
      if (!user?.userType) {
        setDashboardData(prev => ({
          ...prev,
          error: 'User type not available',
          isLoading: false
        }));
        return;
      }

      try {
        console.log('Fetching dashboard data for user type:', user.userType);
        
        // Set user ID correctly - use either id or _id
        const userId = user.id || user._id;
        
        // Fetch stats from dashboard service
        const statsResponse = await dashboardService.getStats(user.userType);
        console.log('Stats Response:', statsResponse);
        
        if (!statsResponse.success) {
          throw new Error(statsResponse.error || 'Failed to fetch statistics');
        }

        // Fetch user's items with a simpler approach that's more likely to succeed
        let recentItemsResponse;
        try {
          // Use the most reliable method - getAllItems with userId
          recentItemsResponse = await itemsService.getAllItems({
            userId: userId,
            limit: 10,
            sort: '-createdAt'
          });
          
          console.log('Recent Items Response:', recentItemsResponse);
        } catch (itemsError) {
          console.error('Error fetching items:', itemsError);
          // Provide a fallback empty array
          recentItemsResponse = { success: true, data: [] };
        }

        setDashboardData({
          stats: statsResponse.data,
          recentItems: recentItemsResponse.data || [],
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setDashboardData(prev => ({
          ...prev,
          stats: {
            totalLost: 0,
            totalFound: 0,
            totalReturned: 0,
            activeUsers: 0
          },
          recentItems: [],
          error: error.message || 'Failed to load dashboard data',
          isLoading: false
        }));
      }
    };

    fetchDashboardData();
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  const { stats, recentItems, isLoading, error } = dashboardData;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-red-700 font-medium">Error loading dashboard</div>
          <div className="text-red-600 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!user?.userType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-yellow-700">User type not available</div>
          <button
            onClick={() => navigate('/login')}
            className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const DashboardComponent = user.userType === 'business' ? BusinessDashboard : IndividualDashboard;

  return (
    <DashboardComponent
      stats={stats}
      recentItems={recentItems}
      isLoading={isLoading}
      userType={user.userType}
      user={user}
    />
  );
}
