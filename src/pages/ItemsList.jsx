import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  TagIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  ArrowPathRoundedSquareIcon,
  CheckBadgeIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { FaMapMarkerAlt } from 'react-icons/fa'
import { CATEGORIES_CONFIG } from '../config/categoriesConfig'
import itemsService from '../services/itemsService'
import { useAuth } from '../contexts/AuthContext'

export default function ItemsList() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState(0)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [showDeleteToast, setShowDeleteToast] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const fetchItems = async () => {
      try {
        setIsLoading(true);
        
        // Prepare filters
        const filters = {};
        
        if (filterStatus !== 'all') {
          filters.status = filterStatus;
        }
        if (filterType !== 'all') {
          filters.type = filterType;
        }
        if (filterCategory !== 'all') {
          filters.category = filterCategory;
        }
        
        // Add date filtering
        if (filterDate !== 'all') {
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today
          
          const todayStr = today.toISOString();
          
          if (filterDate === 'today') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            filters.fromDate = startOfDay.toISOString();
            filters.toDate = todayStr;
          } else if (filterDate === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            weekAgo.setHours(0, 0, 0, 0);
            filters.fromDate = weekAgo.toISOString();
            filters.toDate = todayStr;
          } else if (filterDate === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            monthAgo.setHours(0, 0, 0, 0);
            filters.fromDate = monthAgo.toISOString();
            filters.toDate = todayStr;
          }
        }
        
        // Make sure user ID is available in both formats
        const userId = user?.id || user?._id;
        console.log('ItemsList: Fetching items with filters:', filters);
        console.log('ItemsList: Current user ID:', userId);

        // First, try using getCurrentUserItems
        let response;
        try {
          response = await itemsService.getCurrentUserItems(filters);
          console.log('ItemsList: Items response:', response);
        } catch (itemError) {
          console.error('ItemsList: Error in getCurrentUserItems:', itemError);
          // If that fails, try a direct approach
          try {
            response = await itemsService.getAllItems({
              ...filters,
              userId
            });
          } catch (directError) {
            console.error('ItemsList: Direct API call also failed:', directError);
            // Last resort - make a simple request with minimal parameters
            response = await itemsService.getAllItems({ userId });
          }
        }
        
        if (response && response.success) {
          // Always use an array, even if empty
          const itemsData = response.data || [];
          setItems(itemsData);
          
          // Log found items count for debugging
          console.log(`ItemsList: Found ${itemsData.length} items`);
        } else {
          console.error('ItemsList: Failed to fetch items:', response?.error);
          setError(response?.error || 'Erreur lors du chargement des objets.');
        }
      } catch (err) {
        console.error('ItemsList: Error fetching items:', err);
        setError('Failed to fetch items. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchItems();
    }
  }, [isAuthenticated, filterStatus, filterType, filterCategory, filterDate, navigate, user]);

  useEffect(() => {
    // Calculate active filters
    let count = 0
    if (filterStatus !== 'all') count++
    if (filterType !== 'all') count++
    if (filterCategory !== 'all') count++
    if (filterDate !== 'all') count++
    if (searchTerm.trim() !== '') count++
    setActiveFilters(count)
  }, [filterStatus, filterType, filterCategory, filterDate, searchTerm])

  const initiateDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteToast(true);
    
    // Auto-hide the toast after 10 seconds if no action is taken
    setTimeout(() => {
      setShowDeleteToast(false);
      setItemToDelete(null);
    }, 10000);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const response = await itemsService.deleteItem(itemToDelete._id);
      if (response.success) {
        setItems(items.filter((item) => item._id !== itemToDelete._id));
        // Close the toast
        setShowDeleteToast(false);
        setItemToDelete(null);
      } else {
        alert(response.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again later.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteToast(false);
    setItemToDelete(null);
  };

  const canDeleteItem = (item) => {
    // For debugging visibility issues, temporarily return true
    return true;
    
    // Original logic:
    // if (user?.role === 'admin') return true;
    // if (user?.userType === 'business') return true;
    // return item.reportedBy?._id === user?._id;
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || item.type === filterType
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory

    const matchesDate = filterDate === 'all' || (() => {
      const itemDate = new Date(item.date)
      const today = new Date()
      switch (filterDate) {
        case 'today':
          return itemDate.toDateString() === today.toDateString()
        case 'week':
          const weekAgo = new Date(today.setDate(today.getDate() - 7))
          return itemDate >= weekAgo
        case 'month':
          const monthAgo = new Date(today.setMonth(today.getMonth() - 1))
          return itemDate >= monthAgo
        default:
          return true
      }
    })()

    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesDate
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'found':
        return 'bg-green-100 text-green-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      case 'returned':
        return 'bg-blue-100 text-blue-800'
      case 'posted':
        return 'bg-yellow-100 text-yellow-800'
      case 'authenticating':
        return 'bg-purple-100 text-purple-800'
      case 'authenticated':
        return 'bg-teal-100 text-teal-800'
      case 'returning':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'posted':
        return <PaperAirplaneIcon className="w-4 h-4" />
      case 'authenticating':
        return <MagnifyingGlassIcon className="w-4 h-4" />
      case 'authenticated':
        return <ShieldCheckIcon className="w-4 h-4" />
      case 'returning':
        return <ArrowPathRoundedSquareIcon className="w-4 h-4" />
      case 'returned':
        return <CheckBadgeIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'lost':
        return 'bg-red-50 text-red-700 ring-red-600/10'
      case 'found':
        return 'bg-green-50 text-green-700 ring-green-600/10'
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/10'
    }
  }

  const getSubcategoryIcon = (category, subcategory) => {
    const categoryConfig = CATEGORIES_CONFIG[category]
    if (!categoryConfig) return null
    
    const subcategoryConfig = categoryConfig.subcategories[subcategory]
    if (!subcategoryConfig) return null

    const Icon = subcategoryConfig.icon
    return Icon ? <Icon className="h-5 w-5" /> : null
  }

  const formatDate = (dateString, itemType) => {
    const date = new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Add prefix based on item type
    const prefix = itemType === 'lost' ? 'Perdu le ' : 'Trouvé le ';
    return prefix + date;
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setFilterType('all')
    setFilterCategory('all')
    setFilterDate('all')
    setSearchTerm('')
  }

  const statusConfig = [
    { value: 'all', label: 'Tous les statuts', icon: FunnelIcon },
    { value: 'posted', label: 'Annonce déposée', icon: PaperAirplaneIcon },
    { value: 'authenticating', label: 'Authentification en cours', icon: MagnifyingGlassIcon },
    { value: 'authenticated', label: 'Authentification validée', icon: ShieldCheckIcon },
    { value: 'returning', label: 'Restitution en cours', icon: ArrowPathRoundedSquareIcon },
    { value: 'returned', label: 'Objet restitué', icon: CheckBadgeIcon }
  ];

  const FilterBadge = ({ label, onClear }) => (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 group">
      {label}
      <button onClick={onClear} className="ml-1 text-blue-400 hover:text-blue-700 rounded-full group-hover:bg-blue-100 p-0.5 transition-all">
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
        <p className="mt-4 text-gray-600 animate-pulse">Chargement des objets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200 max-w-md w-full transform transition-all hover:shadow-lg">
          <div className="text-red-700 font-medium text-lg flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Erreur lors du chargement
          </div>
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Section with Improved Design */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="bg-yellow-100 text-yellow-700 p-1.5 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                Mes Objets
              </h1>
              <p className="mt-1 text-gray-500">
                Gérez tous vos objets perdus et trouvés
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)} 
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} transition-all duration-300`}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <span>Filtres</span>
                {activeFilters > 0 && (
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {activeFilters}
                  </span>
                )}
              </button>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 hover:shadow transform hover:-translate-y-0.5"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Nouvel objet</span>
              </Link>
            </div>
          </div>

          {/* Enhanced Search */}
          <div className="mt-5">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full rounded-lg border-gray-200 pl-10 pr-3 py-3 focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm shadow-sm transition-all duration-300 focus:shadow"
                placeholder="Rechercher par titre, description ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Section - Expandable */}
          {showFilters && (
            <div className="mt-4 bg-blue-50 rounded-xl p-5 border border-blue-100 animate-fadeIn">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <h3 className="font-medium text-blue-800">Filtres avancés</h3>
                {activeFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                  >
                    Effacer tous les filtres
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-blue-700">Type d'objet</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-md border-blue-200 focus:border-yellow-500 focus:ring-yellow-500 bg-white text-sm py-2.5"
                  >
                    <option value="all">Tous les types</option>
                    <option value="lost">Objets perdus</option>
                    <option value="found">Objets trouvés</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-blue-700">Statut</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-md border-blue-200 focus:border-yellow-500 focus:ring-yellow-500 bg-white text-sm py-2.5"
                  >
                    {statusConfig.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-blue-700">Catégorie</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full rounded-md border-blue-200 focus:border-yellow-500 focus:ring-yellow-500 bg-white text-sm py-2.5"
                  >
                    <option value="all">Toutes les catégories</option>
                    {Object.entries(CATEGORIES_CONFIG).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-blue-700">Date</label>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full rounded-md border-blue-200 focus:border-yellow-500 focus:ring-yellow-500 bg-white text-sm py-2.5"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">7 derniers jours</option>
                    <option value="month">30 derniers jours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {activeFilters > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <FilterBadge 
                  label={`Recherche: ${searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}`} 
                  onClear={() => setSearchTerm('')} 
                />
              )}
              {filterType !== 'all' && (
                <FilterBadge 
                  label={`Type: ${filterType === 'lost' ? 'Perdu' : 'Trouvé'}`} 
                  onClear={() => setFilterType('all')} 
                />
              )}
              {filterStatus !== 'all' && (
                <FilterBadge 
                  label={`Statut: ${statusConfig.find(s => s.value === filterStatus)?.label.replace('Tous les statuts', '')}`} 
                  onClear={() => setFilterStatus('all')} 
                />
              )}
              {filterCategory !== 'all' && (
                <FilterBadge 
                  label={`Catégorie: ${CATEGORIES_CONFIG[filterCategory]?.label}`} 
                  onClear={() => setFilterCategory('all')} 
                />
              )}
              {filterDate !== 'all' && (
                <FilterBadge 
                  label={`Date: ${filterDate === 'today' ? 'Aujourd\'hui' : filterDate === 'week' ? '7 derniers jours' : '30 derniers jours'}`} 
                  onClear={() => setFilterDate('all')} 
                />
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-5">
          <div className="text-sm text-gray-500 font-medium">
            {filteredItems.length} {filteredItems.length === 1 ? 'objet' : 'objets'} trouvé{filteredItems.length !== 1 ? 's' : ''}
          </div>
          <div className="text-sm text-gray-500">
            {items.length} objet{items.length !== 1 ? 's' : ''} au total
          </div>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 border border-gray-200 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center">
              <MagnifyingGlassIcon className="h-10 w-10 text-yellow-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun objet trouvé</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterCategory !== 'all' || filterDate !== 'all'
                ? 'Aucun objet ne correspond à vos critères de recherche. Essayez d\'ajuster vos filtres.'
                : 'Vous n\'avez pas encore ajouté d\'objets. Cliquez sur "Nouvel objet" pour commencer.'}
            </p>
            <div className="mt-6">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterCategory !== 'all' || filterDate !== 'all' ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Effacer les filtres
                </button>
              ) : (
                <Link
                  to="/report"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Ajouter un objet
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Large Screen Table View - Replaced with more responsive design */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3.5 bg-gray-50 border-b border-gray-300">
                  <div className="col-span-4 text-left text-sm font-semibold text-gray-900">
                    Détails de l'objet
                  </div>
                  <div className="col-span-2 text-left text-sm font-semibold text-gray-900">
                    Type & Statut
                  </div>
                  <div className="col-span-2 text-left text-sm font-semibold text-gray-900">
                    Lieu
                  </div>
                  <div className="col-span-2 text-left text-sm font-semibold text-gray-900">
                    Date
                  </div>
                  <div className="col-span-2 text-right text-sm font-semibold text-gray-900">
                    Actions
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {filteredItems.map((item, index) => (
                    <div 
                      key={item._id} 
                      className="grid grid-cols-12 gap-2 px-4 py-4 hover:bg-gray-50 transition-colors duration-150 group relative"
                      style={{animationDelay: `${index * 0.05}s`}}
                    >
                      {/* Item Details */}
                      <div className="col-span-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            {item.images && item.images.length > 0 ? (
                              <img 
                                className="h-full w-full object-cover object-center" 
                                src={`data:${item.images[0].contentType};base64,${item.images[0].data}`}
                                alt={item.title} 
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4 min-w-0">
                            <div className="font-medium text-gray-900 truncate max-w-xs">{item.title}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                #{item.reference}
                              </span>
                              {getSubcategoryIcon(item.category, item.subcategory)}
                              <span className="truncate max-w-[150px]">{CATEGORIES_CONFIG[item.category]?.subcategories[item.subcategory]?.label || item.subcategory}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Type & Status */}
                      <div className="col-span-2 flex flex-col justify-center gap-1.5">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getTypeColor(item.type)}`}>
                          {item.type === 'lost' ? 'Perdu' : 'Trouvé'}
                        </span>
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium items-center gap-1 ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="col-span-2 flex items-center">
                        <div className="flex items-start">
                          <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mt-0.5 mr-1.5 flex-shrink-0" />
                          <span className="line-clamp-2 text-sm text-gray-500">{item.location?.address || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                          {formatDate(item.date, item.type)}
                        </div>
                      </div>

                      {/* Action Buttons - with high z-index and better positioning */}
                      <div className="col-span-2 flex justify-end items-center gap-2">
                        <Link
                          to={`/items/${item._id}`}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2.5 rounded-md transition-colors shadow-sm hover:shadow flex items-center justify-center"
                          aria-label="Voir les détails"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        
                        <Link
                          to={`/items/${item._id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 p-2.5 rounded-md transition-colors shadow-sm hover:shadow flex items-center justify-center"
                          aria-label="Modifier l'objet"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        
                        {/* Delete button with improved visibility */}
                        <button
                          onClick={() => initiateDelete(item)}
                          className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-2.5 rounded-md transition-all duration-200 shadow hover:shadow-md transform hover:scale-105"
                          aria-label="Supprimer l'objet"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Medium Screen Simplified View - New intermediate view */}
            <div className="hidden md:block lg:hidden">
              <div className="space-y-4">
                {filteredItems.map((item, index) => (
                  <div 
                    key={item._id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn overflow-hidden"
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex">
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            {item.images && item.images.length > 0 ? (
                              <img 
                                className="h-full w-full object-cover object-center" 
                                src={`data:${item.images[0].contentType};base64,${item.images[0].data}`}
                                alt={item.title} 
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900 truncate max-w-[250px]">{item.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                #{item.reference}
                              </span>
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getTypeColor(item.type)}`}>
                                {item.type === 'lost' ? 'Perdu' : 'Trouvé'}
                              </span>
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}>
                                {getStatusIcon(item.status)}
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-1">
                          <Link
                            to={`/items/${item._id}`}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-md transition-colors"
                            aria-label="Voir les détails"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          
                          <Link
                            to={`/items/${item._id}/edit`}
                            className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-md transition-colors"
                            aria-label="Modifier l'objet"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          
                          <button
                            onClick={() => initiateDelete(item)}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-2 rounded-md transition-all duration-200"
                            aria-label="Supprimer l'objet"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Additional info */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-start">
                          <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mt-0.5 mr-1.5 flex-shrink-0" />
                          <span className="line-clamp-1 text-sm text-gray-600">{item.location?.address || 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{formatDate(item.date, item.type)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Small/Mobile Card View - Enhanced for better layout */}
            <div className="md:hidden">
              <div className="space-y-4">
                {filteredItems.map((item, index) => (
                  <div 
                    key={item._id} 
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn"
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-grow min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                          <div className="flex items-center flex-wrap gap-1 mt-0.5">
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              #{item.reference}
                            </span>
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getTypeColor(item.type)}`}>
                              {item.type === 'lost' ? 'Perdu' : 'Trouvé'}
                            </span>
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="hidden xs:inline ml-1">{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            {item.images && item.images.length > 0 ? (
                              <img 
                                className="h-full w-full object-cover object-center" 
                                src={`data:${item.images[0].contentType};base64,${item.images[0].data}`}
                                alt={item.title} 
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mt-2 border-t border-gray-100 pt-2">
                        <div className="flex items-start">
                          <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mt-0.5 mr-1.5 flex-shrink-0" />
                          <span className="line-clamp-1">{item.location?.address || 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                          <span>{formatDate(item.date, item.type)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons footer */}
                    <div className="flex divide-x border-t border-gray-200 relative z-20">
                      <Link
                        to={`/items/${item._id}`}
                        className="flex-1 px-3 py-3 text-sm font-medium text-center text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Voir</span>
                      </Link>
                      <Link
                        to={`/items/${item._id}/edit`}
                        className="flex-1 px-3 py-3 text-sm font-medium text-center text-yellow-700 hover:bg-yellow-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Modifier</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          initiateDelete(item);
                        }}
                        className="flex-1 px-3 py-3 text-sm font-medium text-center text-red-700 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Toast */}
      {showDeleteToast && itemToDelete && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-fadeIn">
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-red-800">Confirmer la suppression</h3>
                <button 
                  onClick={cancelDelete}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700">
                Êtes-vous sûr de vouloir supprimer l'objet "<span className="font-semibold">{itemToDelete.title}</span>" ? 
                Cette action est irréversible.
              </p>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm hover:shadow transition-all duration-200"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
