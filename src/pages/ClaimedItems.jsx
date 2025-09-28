import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  TagIcon,
  ArrowPathRoundedSquareIcon,
  CheckBadgeIcon,
  UserIcon,
  MapPinIcon,
  XMarkIcon,
  PhoneIcon,
  FunnelIcon,
  Bars3Icon,
  Squares2X2Icon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { FaMapMarkerAlt } from 'react-icons/fa'
import { CATEGORIES_CONFIG } from '../config/categoriesConfig'
import itemsService from '../services/itemsService'
import { useAuth } from '../contexts/AuthContext'

export default function ClaimedItems() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [claimedItems, setClaimedItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [returnDeadline, setReturnDeadline] = useState('')
  const [updatingDeadline, setUpdatingDeadline] = useState(false)
  
  // UI State
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('deadline') // 'deadline', 'date', 'title'
  const [filterBy, setFilterBy] = useState('all') // 'all', 'owner', 'claimer', 'urgent', 'delivery'
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedItems, setExpandedItems] = useState(new Set()) // Track expanded items

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchClaimedItems()
  }, [isAuthenticated, navigate])

  const fetchClaimedItems = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch items with 'returning' status using the dedicated service method
      const response = await itemsService.getClaimedItems()
      
      if (response.success) {
        setClaimedItems(response.data || [])
        setFilteredItems(response.data || [])
      } else {
        setError(response.error || 'Failed to fetch claimed items')
      }
    } catch (error) {
      console.error('Error fetching claimed items:', error)
      setError('Failed to fetch claimed items')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort items
  useEffect(() => {
    let items = [...claimedItems]

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'owner':
          items = items.filter(item => isItemOwner(item))
          break
        case 'claimer':
          items = items.filter(item => isItemClaimer(item))
          break
        case 'urgent':
          items = items.filter(item => {
            const deadline = getDaysUntilDeadline(item.returnDeadline)
            return deadline !== null && deadline <= 3
          })
          break
        case 'delivery':
          items = items.filter(item => hasDeliveryOption(item))
          break
        case 'pickup':
          items = items.filter(item => !hasDeliveryOption(item))
          break
        case 'overdue':
          items = items.filter(item => {
            const deadline = getDaysUntilDeadline(item.returnDeadline)
            return deadline !== null && deadline < 0
          })
          break
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'deadline':
        items.sort((a, b) => {
          if (!a.returnDeadline && !b.returnDeadline) return 0
          if (!a.returnDeadline) return 1
          if (!b.returnDeadline) return -1
          return new Date(a.returnDeadline) - new Date(b.returnDeadline)
        })
        break
      case 'date':
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        break
      case 'title':
        items.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    setFilteredItems(items)
  }, [claimedItems, searchTerm, filterBy, sortBy, user])

  const getSubcategoryIcon = (category, subcategory) => {
    const categoryConfig = CATEGORIES_CONFIG[category]
    if (!categoryConfig) return null
    
    const subcategoryConfig = categoryConfig.subcategories[subcategory]
    if (!subcategoryConfig) return null

    const Icon = subcategoryConfig.icon
    return Icon ? <Icon className="h-5 w-5" /> : null
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateInput = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().slice(0, 16)
  }

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isItemOwner = (item) => {
    // The owner is the person who originally found and reported the item
    const currentUserId = user?._id || user?.id
    const itemOwnerId = item.reportedBy?._id || item.reportedBy?.id
    return currentUserId === itemOwnerId
  }

  const isItemClaimer = (item) => {
    // The claimer is the person who lost the item and paid to claim it
    const currentUserId = user?._id || user?.id
    // Check if user is the one who paid (through twin relationship)
    const claimerUserId = item.twin?.item?.reportedBy?._id || item.twin?.item?.reportedBy?.id
    return currentUserId === claimerUserId
  }

  const getUserDisplayName = (user) => {
    if (!user) return 'Utilisateur inconnu'
    
    // Check if it's a business user
    if (user.userType === 'business' && user.businessName) {
      return user.businessName
    }
    
    // For individual users, show first and last name
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    } else if (firstName) {
      return firstName
    } else if (lastName) {
      return lastName
    }
    
    return 'Utilisateur'
  }

  const getUserPhone = (user) => {
    if (!user) return null
    
    // For business users, return businessPhone
    if (user.userType === 'business' && user.businessPhone) {
      return user.businessPhone
    }
    
    // For individual users, return phone
    if (user.userType === 'individual' && user.phone) {
      return user.phone
    }
    
    return null
  }

  const getUserAddress = (user) => {
    if (!user) return null
    
    // For business users, return businessAddress
    if (user.userType === 'business' && user.businessAddress) {
      return user.businessAddress
    }
    
    // Individual users don't have addresses in this context
    return null
  }

  const hasDeliveryOption = (item) => {
    return item.claimFee?.deliveryOption?.enabled === true
  }

  const getDeliveryInfo = (item) => {
    if (!hasDeliveryOption(item)) {
      return {
        hasDelivery: false,
        message: 'Récupération en personne'
      }
    }
    
    const deliveryFee = item.claimFee?.deliveryOption?.fee || 4
    return {
      hasDelivery: true,
      fee: deliveryFee,
      message: `Livraison payée (${deliveryFee}€)`
    }
  }

  const handleSetDeadline = (item) => {
    setSelectedItem(item)
    setReturnDeadline(item.returnDeadline ? formatDateInput(item.returnDeadline) : '')
    setShowDeadlineModal(true)
  }

  const updateReturnDeadline = async () => {
    if (!selectedItem || !returnDeadline) return

    try {
      setUpdatingDeadline(true)
      
      const deadlineDate = new Date(returnDeadline)
      const now = new Date()
      
      // Validate deadline is in the future
      if (deadlineDate <= now) {
        alert('La date limite doit être dans le futur')
        return
      }

      // Update the item with the new deadline using the dedicated service method
      const response = await itemsService.setReturnDeadline(selectedItem._id, deadlineDate.toISOString())

      if (response.success) {
        // Update local state
        setClaimedItems(items => 
          items.map(item => 
            item._id === selectedItem._id 
              ? { ...item, returnDeadline: deadlineDate.toISOString() }
              : item
          )
        )
        
        setShowDeadlineModal(false)
        setSelectedItem(null)
        setReturnDeadline('')
        
        // Show success message
        alert('Date limite de retour mise à jour avec succès')
      } else {
        alert(response.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating return deadline:', error)
      alert('Erreur lors de la mise à jour de la date limite')
    } finally {
      setUpdatingDeadline(false)
    }
  }

  const markAsReturned = async (item) => {
    const deliveryInfo = getDeliveryInfo(item)
    const isOwner = isItemOwner(item)
    
    let confirmMessage
    if (deliveryInfo.hasDelivery) {
      confirmMessage = isOwner 
        ? 'Êtes-vous sûr de vouloir marquer cet objet comme envoyé ?' 
        : 'Avez-vous bien reçu cet objet par livraison ?'
    } else {
      confirmMessage = isOwner 
        ? 'Êtes-vous sûr de vouloir marquer cet objet comme retourné ?' 
        : 'Avez-vous bien récupéré cet objet ?'
    }
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      console.log('Starting markAsReturned for item:', item._id)
      console.log('Item twin data:', item.twin)
      
      const response = await itemsService.updateItemStatus(item._id, 'returned')
      
      if (response.success) {
        console.log('Main item updated successfully')
        
        // Update both twinned items to 'returned' status
        if (item.twin?.item) {
          console.log('Updating twin item:', item.twin.item._id)
          const twinResponse = await itemsService.updateItemStatus(item.twin.item._id, 'returned')
          console.log('Twin item update response:', twinResponse)
        } else {
          console.log('No twin item found to update')
        }
        
        // Remove from claimed items list
        setClaimedItems(items => items.filter(i => i._id !== item._id))
        
        const successMessage = deliveryInfo.hasDelivery
          ? 'Objet marqué comme envoyé avec succès'
          : 'Objet marqué comme retourné avec succès'
        alert(successMessage)
      } else {
        alert(response.error || 'Erreur lors du marquage')
      }
    } catch (error) {
      console.error('Error marking item as returned:', error)
      alert('Erreur lors du marquage de l\'objet')
    }
  }

  const getDeadlineStatus = (item) => {
    const deliveryInfo = getDeliveryInfo(item)
    const deliveryPrefix = deliveryInfo.hasDelivery ? 'envoi' : 'retour'
    
    if (!item.returnDeadline) {
      return {
        status: 'no-deadline',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        message: `Aucune date limite de ${deliveryPrefix} définie`
      }
    }

    const daysLeft = getDaysUntilDeadline(item.returnDeadline)
    
    if (daysLeft < 0) {
      return {
        status: 'overdue',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        message: `Date limite de ${deliveryPrefix} dépassée depuis ${Math.abs(daysLeft)} jour(s)`
      }
    } else if (daysLeft === 0) {
      return {
        status: 'today',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
        message: `Date limite de ${deliveryPrefix} aujourd'hui`
      }
    } else if (daysLeft <= 3) {
      return {
        status: 'urgent',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        message: `${daysLeft} jour(s) restant(s) pour le ${deliveryPrefix}`
      }
    } else {
      return {
        status: 'normal',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        message: `${daysLeft} jour(s) restant(s) pour le ${deliveryPrefix}`
      }
    }
  }

  // Toggle expand/collapse for list view items
  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des objets réclamés...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto" />
            <p className="mt-4 text-red-600">{error}</p>
            <button
              onClick={fetchClaimedItems}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Objets Réclamés</h1>
              <p className="mt-2 text-gray-600">
                Gérez les objets en cours de restitution. En tant que propriétaire d'un objet trouvé, vous pouvez définir des dates limites de retour.
              </p>
            </div>
            {filteredItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {filteredItems.length} objet{filteredItems.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          {claimedItems.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par titre, référence ou description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>

                {/* Filters and View Controls */}
                <div className="flex items-center gap-3">
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <FunnelIcon className="h-4 w-4" />
                      Filtrer
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    
                    {showFilters && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => { setFilterBy('all'); setShowFilters(false) }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterBy === 'all' ? 'bg-yellow-50 text-yellow-700' : ''}`}
                          >
                            Tous les objets
                          </button>
                          <button
                            onClick={() => { setFilterBy('owner'); setShowFilters(false) }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterBy === 'owner' ? 'bg-yellow-50 text-yellow-700' : ''}`}
                          >
                            Mes objets trouvés
                          </button>
                          <button
                            onClick={() => { setFilterBy('claimer'); setShowFilters(false) }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterBy === 'claimer' ? 'bg-yellow-50 text-yellow-700' : ''}`}
                          >
                            Mes objets réclamés
                          </button>
                          <button
                            onClick={() => { setFilterBy('urgent'); setShowFilters(false) }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterBy === 'urgent' ? 'bg-yellow-50 text-yellow-700' : ''}`}
                          >
                            Urgents (≤3 jours)
                          </button>
                          <button
                            onClick={() => { setFilterBy('overdue'); setShowFilters(false) }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterBy === 'overdue' ? 'bg-yellow-50 text-yellow-700' : ''}`}
                          >
                            En retard
                          </button>
                          <button
                            onClick={() => { setFilterBy('delivery'); setShowFilters(false) }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterBy === 'delivery' ? 'bg-yellow-50 text-yellow-700' : ''}`}
                          >
                            🚚 Avec livraison
                          </button>
                          <button
                            onClick={() => { setFilterBy('pickup'); setShowFilters(false) }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterBy === 'pickup' ? 'bg-yellow-50 text-yellow-700' : ''}`}
                          >
                            🤝 Récupération en personne
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="deadline">Trier par date limite</option>
                    <option value="date">Trier par date récente</option>
                    <option value="title">Trier par titre</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Bars3Icon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filterBy !== 'all' || searchTerm) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      Recherche: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-1 hover:text-yellow-900"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filterBy !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Filtre: {
                        filterBy === 'owner' ? 'Mes objets trouvés' :
                        filterBy === 'claimer' ? 'Mes objets réclamés' :
                        filterBy === 'urgent' ? 'Urgents' :
                        filterBy === 'overdue' ? 'En retard' :
                        filterBy === 'delivery' ? '🚚 Avec livraison' :
                        filterBy === 'pickup' ? '🤝 En personne' : filterBy
                      }
                      <button
                        onClick={() => setFilterBy('all')}
                        className="ml-1 hover:text-blue-900"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            {claimedItems.length === 0 ? (
              <>
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun objet réclamé</h3>
                <p className="mt-2 text-gray-500">
                  Vous n'avez actuellement aucun objet en cours de restitution.
                </p>
              </>
            ) : (
              <>
                <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun résultat</h3>
                <p className="mt-2 text-gray-500">
                  Aucun objet ne correspond à vos critères de recherche ou de filtrage.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterBy('all')
                  }}
                  className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Effacer les filtres
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-6'}>
            {filteredItems.map((item) => {
              const deadlineStatus = getDeadlineStatus(item)
              const isExpanded = expandedItems.has(item._id)
              
              return (
                <div key={item._id} className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow ${viewMode === 'grid' ? 'h-fit' : ''}`}>
                  {/* Header with Priority Indicator */}
                  <div 
                    className={`flex items-start justify-between mb-4 ${viewMode === 'list' ? 'cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg' : ''}`}
                    onClick={viewMode === 'list' ? () => toggleItemExpansion(item._id) : undefined}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {getSubcategoryIcon(item.category, item.subcategory)}
                          <span className="text-sm text-gray-600">
                            {CATEGORIES_CONFIG[item.category]?.subcategories[item.subcategory]?.label || item.subcategory}
                          </span>
                        </div>
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          #{item.reference}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{item.title}</h3>
                      
                      {/* Role Badges */}
                      <div className="flex items-center gap-2 mb-3">
                        {isItemOwner(item) && (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Propriétaire
                          </span>
                        )}
                        {isItemClaimer(item) && (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Réclamé par vous
                          </span>
                        )}
                        {hasDeliveryOption(item) && (
                          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                            � Livraison
                          </span>
                        )}
                        {!hasDeliveryOption(item) && (
                          <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-700/10">
                            🤝 En personne
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Priority Indicator and Expand/Collapse Button */}
                    <div className="ml-4 flex items-center gap-2">
                      {deadlineStatus.status === 'overdue' && (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                      {deadlineStatus.status === 'urgent' && (
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      )}
                      {deadlineStatus.status === 'today' && (
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                      )}
                      
                      {/* Expand/Collapse Button - Only in List View */}
                      {viewMode === 'list' && (
                        <div className="p-1 rounded-md transition-colors">
                          <ChevronDownIcon 
                            className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deadline Status - Compact */}
                  <div className={`mb-4 p-2 rounded-lg ${deadlineStatus.bgColor} border-l-4 ${hasDeliveryOption(item) ? 'border-purple-500' : 'border-orange-500'}`}>
                    <div className="flex items-center gap-2">
                      <ClockIcon className={`h-4 w-4 ${deadlineStatus.color}`} />
                      <span className={`text-xs font-medium ${deadlineStatus.color}`}>
                        {deadlineStatus.message}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                      {hasDeliveryOption(item) ? (
                        <>
                          <span>🚚</span>
                          <span>Mode: Livraison payée ({getDeliveryInfo(item).fee}€)</span>
                        </>
                      ) : (
                        <>
                          <span>🤝</span>
                          <span>Mode: Récupération en personne</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Always visible summary in list view */}
                  {viewMode === 'list' && !isExpanded && (
                    <div className="text-xs text-gray-500 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="line-clamp-1 flex-1">{item.description}</span>
                        <div className="flex items-center gap-2 ml-2 whitespace-nowrap">
                          {isItemOwner(item) && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              Actions disponibles
                            </span>
                          )}
                          {isItemClaimer(item) && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                              Confirmer réception
                            </span>
                          )}
                          <span className="text-blue-600 font-medium">Cliquer pour plus</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewMode === 'list' && isExpanded && (
                    <div className="transition-all duration-300 ease-in-out">
                      <p className="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          <span>{item.location?.address || 'Adresse non disponible'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>Réclamé le {formatDate(item.claimFee?.paidAt || item.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions - Compact - Only visible when expanded in list view */}
                  {(viewMode === 'grid' || isExpanded) && (
                    <div className="flex gap-2">
                      {isItemOwner(item) ? (
                        <>
                          <button
                            onClick={() => handleSetDeadline(item)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                          >
                            {item.returnDeadline ? 'Modifier date' : 'Définir date'}
                          </button>
                          <button
                            onClick={() => markAsReturned(item)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                          >
                            {hasDeliveryOption(item) ? 'Marquer envoyé' : 'Marquer retourné'}
                          </button>
                        </>
                      ) : isItemClaimer(item) ? (
                        <>
                          <div className="flex-1 px-3 py-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
                            {hasDeliveryOption(item) ? 'Livraison en cours' : 'Objet réclamé'}
                          </div>
                          <button
                            onClick={() => markAsReturned(item)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                          >
                            Confirmer réception
                          </button>
                        </>
                      ) : (
                        <div className="w-full px-3 py-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
                          {hasDeliveryOption(item) ? 'Livraison en cours' : 'En cours de restitution'}
                        </div>
                      )}
                    </div>
                  )}

                  {viewMode === 'list' && isExpanded && (
                    <div className="transition-all duration-300 ease-in-out">
                      {/* Contact Information - Compact */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-900 mb-2">Contact:</h4>
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-medium">Propriétaire objet trouvé:</span>
                            <div className="text-gray-600">{getUserDisplayName(item.reportedBy)}</div>
                            {item.reportedBy?.email && (
                              <a href={`mailto:${item.reportedBy.email}`} className="text-blue-600 hover:text-blue-800 block">
                                {item.reportedBy.email}
                              </a>
                            )}
                            {getUserPhone(item.reportedBy) && (
                              <a href={`tel:${getUserPhone(item.reportedBy)}`} className="text-green-600 hover:text-green-800 flex items-center gap-1">
                                <PhoneIcon className="h-3 w-3" />
                                {getUserPhone(item.reportedBy)}
                              </a>
                            )}
                            {getUserAddress(item.reportedBy) && (
                              <div className="text-gray-600 flex items-start gap-1 mt-1">
                                <MapPinIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{getUserAddress(item.reportedBy)}</span>
                              </div>
                            )}
                          </div>
                          {item.twin?.item?.reportedBy && (
                            <div className="text-xs border-t border-blue-200 pt-1">
                              <span className="font-medium">Propriétaire objet perdu:</span>
                              <div className="text-gray-600">{getUserDisplayName(item.twin.item.reportedBy)}</div>
                              {item.twin.item.reportedBy?.email && (
                                <a href={`mailto:${item.twin.item.reportedBy.email}`} className="text-blue-600 hover:text-blue-800 block">
                                  {item.twin.item.reportedBy.email}
                                </a>
                              )}
                              {getUserPhone(item.twin.item.reportedBy) && (
                                <a href={`tel:${getUserPhone(item.twin.item.reportedBy)}`} className="text-green-600 hover:text-green-800 flex items-center gap-1">
                                  <PhoneIcon className="h-3 w-3" />
                                  {getUserPhone(item.twin.item.reportedBy)}
                                </a>
                              )}
                              {getUserAddress(item.twin.item.reportedBy) && (
                                <div className="text-gray-600 flex items-start gap-1 mt-1">
                                  <MapPinIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>{getUserAddress(item.twin.item.reportedBy)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Deadline Modal */}
        {showDeadlineModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {hasDeliveryOption(selectedItem) ? 'Définir la date limite d\'envoi' : 'Définir la date limite de retour'}
                  </h3>
                  <button
                    onClick={() => setShowDeadlineModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Objet: <strong>{selectedItem?.title}</strong>
                  </p>
                  {hasDeliveryOption(selectedItem) ? (
                    <p className="text-sm text-gray-500">
                      En tant que propriétaire de cet objet trouvé, définissez une date limite pour l'envoi de l'objet. 
                      Le réclamant a payé pour la livraison ({getDeliveryInfo(selectedItem).fee}€). 
                      Après cette date, l'objet sera automatiquement marqué comme envoyé.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      En tant que propriétaire de cet objet trouvé, définissez une date limite pour sa restitution en personne. 
                      Après cette date, l'objet sera automatiquement marqué comme retourné.
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date et heure limite
                  </label>
                  <input
                    type="datetime-local"
                    value={returnDeadline}
                    onChange={(e) => setReturnDeadline(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeadlineModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={updateReturnDeadline}
                    disabled={!returnDeadline || updatingDeadline}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingDeadline ? 'Mise à jour...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
