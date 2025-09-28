import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  DocumentPlusIcon,
  PlusIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import ItemCard from '../ItemCard';
import { useAuth } from '../../contexts/AuthContext';
import itemsService from '../../services/itemsService';

export default function IndividualDashboard({ recentItems, isLoading }) {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    totalLost: 0,
    totalFound: 0,
    totalReturned: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      
      try {
        setStatsLoading(true);
        const userId = user.id || user._id;
        
        // Fetch all user's items to calculate real statistics
        const response = await itemsService.getAllItems({
          userId: userId
        });

        if (response.success && response.data) {
          const userItems = response.data;
          
          // Calculate real user statistics
          const lostItems = userItems.filter(item => 
            item.type === 'lost' || item.type === 'Lost' || item.itemType === 'lost'
          );
          
          const foundItems = userItems.filter(item => 
            item.type === 'found' || item.type === 'Found' || item.itemType === 'found'
          );
          
          const returnedItems = userItems.filter(item => 
            item.status === 'returned' || item.status === 'Returned' || 
            item.status === 'completed' || item.status === 'resolved'
          );

          setUserStats({
            totalLost: lostItems.length,
            totalFound: foundItems.length,
            totalReturned: returnedItems.length
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setUserStats({
          totalLost: 0,
          totalFound: 0,
          totalReturned: 0
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const getUserGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  const ActionCard = ({ to, icon: Icon, title, description, color }) => (
    <Link
      to={to}
      className={`group relative bg-gradient-to-br ${color} rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-white">{title}</p>
          <p className="text-sm text-white/80">{description}</p>
        </div>
        <ArrowRightIcon className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
      </div>
    </Link>
  );

  const InfoCard = ({ icon: Icon, title, value, link, linkText }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-black/60 rounded-xl p-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <p className="text-gray-600 font-medium mb-2">{title}</p>
      {link && (
        <Link
          to={link}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
        >
          {linkText}
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="bg-black/60 rounded-3xl p-8 text-white shadow-2xl">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-2">
              {getUserGreeting()}, {user?.firstName || user?.username}!
            </h1>
            <p className="text-xl text-blue-100 mb-6">
              Bienvenue sur votre tableau de bord personnel. Suivez vos objets perdus et aidez les autres à retrouver leurs biens.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Déclarer un objet
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={DocumentPlusIcon}
            title="Vos objets perdus"
            value={userStats.totalLost}
            link="/items?type=lost"
            linkText="Voir tous les objets perdus"
          />
          <InfoCard
            icon={DocumentMagnifyingGlassIcon}
            title="Objets que vous avez trouvés"
            value={userStats.totalFound}
            link="/items?type=found"
            linkText="Voir tous les objets trouvés"
          />
          <InfoCard
            icon={ChartBarIcon}
            title="Objets restitués"
            value={userStats.totalReturned}
            link="/items?status=returned"
            linkText="Voir les objets restitués"
          />
        </div>

        {/* Recent Items */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-black/60 rounded-xl p-3">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Objets Récents</h2>
                <p className="text-gray-600">Vos dernières déclarations</p>
              </div>
            </div>
            <Link
              to="/items"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors duration-200"
            >
              Voir tout
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentItems && recentItems.length > 0 ? (
              recentItems.map((item) => (
                <div key={item._id} className="transform hover:scale-105 transition-all duration-300">
                  <ItemCard item={item} />
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <DocumentPlusIcon className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucun objet déclaré</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Commencez par déclarer un objet perdu ou enregistrer un objet trouvé pour voir votre activité ici.
                  </p>
                  <Link
                    to="/report"
                    className="inline-flex items-center px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Déclarer votre premier objet
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

IndividualDashboard.propTypes = {
  recentItems: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool.isRequired
};
