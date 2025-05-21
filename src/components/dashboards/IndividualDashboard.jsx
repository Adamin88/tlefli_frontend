import React from 'react';
import PropTypes from 'prop-types';
import {
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  DocumentPlusIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import ItemCard from '../ItemCard';
import { useAuth } from '../../contexts/AuthContext';

export default function IndividualDashboard({ stats, recentItems, isLoading }) {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenue, {user?.firstName || user?.username}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Suivez vos objets perdus et aidez les autres à retrouver leurs biens.
            </p>
          </div>
          <Link
            to="/report"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Déclarer un objet
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentPlusIcon className="h-6 w-6 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Vos objets perdus</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalLost || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link to="/items?type=lost" className="text-sm text-yellow-700 hover:text-yellow-900">
              Voir tous les objets perdus
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Objets que vous avez trouvés</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalFound || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link to="/items?type=found" className="text-sm text-yellow-700 hover:text-yellow-900">
              Voir tous les objets trouvés
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Objets restitués</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalReturned || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link to="/items?status=returned" className="text-sm text-yellow-700 hover:text-yellow-900">
              Voir les objets restitués
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Objets récents</h2>
          <Link
            to="/items"
            className="text-sm font-medium text-yellow-600 hover:text-yellow-500"
          >
            Voir tous les objets
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentItems && recentItems.length > 0 ? (
            recentItems.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun objet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par déclarer un objet perdu ou enregistrer un objet trouvé.
              </p>
              <div className="mt-6">
                <Link
                  to="/items/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Nouvel objet
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

IndividualDashboard.propTypes = {
  stats: PropTypes.shape({
    totalLost: PropTypes.number,
    totalFound: PropTypes.number,
    totalReturned: PropTypes.number
  }).isRequired,
  recentItems: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired
};
