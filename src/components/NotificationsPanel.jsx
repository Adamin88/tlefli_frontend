import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationsContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon, 
  CheckIcon, 
  FunnelIcon,
  BellIcon,
  BellAlertIcon,
  BellSlashIcon,
  ArrowPathIcon,
  XMarkIcon,
  CalendarIcon,
  CheckBadgeIcon,
  InboxIcon,
  ArchiveBoxXMarkIcon
} from '@heroicons/react/24/outline';
import itemsService from '../services/itemsService';
import SecretAnswerVerification from './SecretAnswerVerification';
import { Link } from 'react-router-dom';

const NotificationsPanel = () => {
  const { notifications = [], loading, markAsRead, fetchNotifications } = useNotifications() || {};
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const getItemId = (itemId) => {
    if (!itemId) return null;
    return typeof itemId === 'object' ? itemId._id : itemId;
  };

  const handleVerifyAnswer = async (itemId, answerId, isCorrect) => {
    if (!itemId || !answerId) return;
    
    try {
      const response = await itemsService.verifySecretAnswer(itemId, answerId, isCorrect);
      
      if (response.success) {
        toast.success(isCorrect 
          ? 'Réponse marquée comme correcte' 
          : 'Réponse marquée comme incorrecte. Le jumelage a été annulé.');

        // If this verification untwinned the items, the backend already handled that
        // Just log for debugging
        if (!isCorrect) {
          console.log('Items have been untwinned due to incorrect answer');
        }

        await fetchNotifications(); // Refresh notifications after verification
        setSelectedAnswer(null); // Reset selected answer
        setSelectedItem(null);
      } else {
        throw new Error(response.error || 'Failed to verify answer');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleViewAnswer = async (notification) => {
    if (!notification?.itemId || !notification?.metadata?.answerId) return;
    
    try {
      const itemId = getItemId(notification.itemId);
      const answerId = notification.metadata.answerId;

      console.log('Viewing answer:', {
        notification: {
          _id: notification._id,
          type: notification.type,
          itemId: notification.itemId,
          metadata: notification.metadata
        },
        extractedIds: {
          itemId,
          answerId,
          itemIdType: typeof itemId,
          answerIdType: typeof answerId
        }
      });

      // Fetch the item and answer details
      const itemResponse = await itemsService.getItemById(itemId);
      if (!itemResponse.success) {
        throw new Error(itemResponse.message || 'Failed to fetch item details');
      }

      const item = itemResponse.data;
      console.log('Item details:', {
        item: {
          _id: item._id,
          title: item.title,
          secretAnswers: item.secretAnswers?.map(a => ({
            _id: a._id,
            userId: a.user?._id
          }))
        }
      });

      // Find the answer by comparing string versions of IDs
      const answer = item.secretAnswers?.find(a => a._id.toString() === answerId);
      
      if (!answer) {
        console.error('Answer not found:', {
          targetAnswerId: answerId,
          availableAnswerIds: item.secretAnswers?.map(a => a._id.toString())
        });
        throw new Error('Answer not found');
      }

      console.log('Found matching answer:', {
        answer: {
          _id: answer._id,
          userId: answer.user?._id
        }
      });

      setSelectedItem(item);
      setSelectedAnswer(answer);
      markAsRead(notification._id);
    } catch (error) {
      console.error('Error viewing answer:', error);
      setError(error.message);
    }
  };

  const navigateToItem = (itemId) => {
    if (!itemId) return;
    navigate(`/items/${itemId}`);
  };

  const handleLinkClick = async (notification, e) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;
      
      const promises = unreadNotifications.map(notification => markAsRead(notification._id));
      await Promise.all(promises);
      
      // Show a toast or some feedback
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all notifications as read');
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setError('Failed to refresh notifications');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600); // Add slight delay for better UX
    }
  };

  const renderNotificationActions = (notification) => {
    if (!notification || !notification.type) return null;
    
    const { type, itemId, metadata } = notification;

    switch (type) {
      case 'secret_answer_pending':
        return metadata?.answerId ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleViewAnswer(notification)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200 shadow-sm hover:shadow"
            >
              <EyeIcon className="h-4 w-4 mr-1.5" />
              Voir et vérifier
            </button>
          </div>
        ) : null;
      case 'secret_answer_verified':
      case 'secret_answer_submitted':
        return itemId ? (
          <button
            onClick={() => navigateToItem(itemId)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
          >
            <EyeIcon className="h-4 w-4 mr-1.5" />
            Voir l'objet
          </button>
        ) : null;
      default:
        return itemId ? (
          <button
            onClick={() => navigateToItem(itemId)}
            className="p-1.5 text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-200"
            title="Voir les détails"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
        ) : null;
    }
  };

  const getNotificationIcon = (type) => {
    if (!type) return <BellIcon className="h-6 w-6 text-gray-400" />;
    
    switch (type.toUpperCase()) {
      case 'SECRET_ANSWER_PENDING':
        return <div className="p-2 bg-yellow-100 rounded-full"><EyeIcon className="h-5 w-5 text-yellow-600" /></div>;
      case 'SECRET_ANSWER_SUBMITTED':
        return <div className="p-2 bg-blue-100 rounded-full"><InboxIcon className="h-5 w-5 text-blue-600" /></div>;
      case 'SECRET_ANSWER_VERIFIED':
        return <div className="p-2 bg-green-100 rounded-full"><CheckBadgeIcon className="h-5 w-5 text-green-600" /></div>;
      case 'MATCH':
        return <div className="p-2 bg-purple-100 rounded-full"><svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg></div>;
      case 'STATUS_UPDATE':
        return <div className="p-2 bg-indigo-100 rounded-full"><ArrowPathIcon className="h-5 w-5 text-indigo-600" /></div>;
      case 'ITEM_TWINNED':
        return <div className="p-2 bg-pink-100 rounded-full"><svg className="h-5 w-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg></div>;
      case 'ITEM_UNTWINNED':
        return <div className="p-2 bg-red-100 rounded-full"><ArchiveBoxXMarkIcon className="h-5 w-5 text-red-600" /></div>;
      default:
        return <div className="p-2 bg-gray-100 rounded-full"><BellIcon className="h-5 w-5 text-gray-600" /></div>;
    }
  };

  const renderNotificationContent = (notification) => {
    if (!notification || !notification.type) return null;

    switch (notification.type.toUpperCase()) {
      case 'SECRET_ANSWER_PENDING':
        return (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-gray-600">{notification.message}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  handleLinkClick(notification);
                  handleViewAnswer(notification);
                }}
                className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
              >
                <EyeIcon className="h-4 w-4 mr-1.5" />
                Voir la réponse
              </button>
            </div>
          </div>
        );

      case 'ITEM_TWINNED':
      case 'ITEM_UNTWINNED':
        const itemId = getItemId(notification.itemId);
        const twinItemId = getItemId(notification.metadata?.twinItemId);

        return (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-gray-600">{notification.message}</p>
            <div className="flex space-x-2">
              {itemId && (
                <Link
                  to={`/items/${itemId}`}
                  onClick={() => handleLinkClick(notification)}
                  className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                >
                  <EyeIcon className="h-4 w-4 mr-1.5" />
                  Voir mon objet
                </Link>
              )}
              {twinItemId && (
                <Link
                  to={`/items/${twinItemId}`}
                  onClick={() => handleLinkClick(notification)}
                  className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                >
                  <EyeIcon className="h-4 w-4 mr-1.5" />
                  Voir l'objet jumelé
                </Link>
              )}
            </div>
          </div>
        );

      default:
        const defaultItemId = getItemId(notification.itemId);
        return (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-gray-600">{notification.message}</p>
            {defaultItemId && (
              <div className="flex space-x-2">
                <Link
                  to={`/items/${defaultItemId}`}
                  onClick={() => handleLinkClick(notification)}
                  className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                >
                  <EyeIcon className="h-4 w-4 mr-1.5" />
                  Voir l'objet
                </Link>
              </div>
            )}
          </div>
        );
    }
  };

  // Function to group notifications by date
  const groupNotificationsByDate = (notificationsArray) => {
    if (!notificationsArray) return {};
    
    // Filter by search term if provided
    let filtered = notificationsArray;
    if (searchTerm.trim()) {
      filtered = notificationsArray.filter(n => 
        n.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };
    
    filtered.forEach(notification => {
      const notifDate = new Date(notification.createdAt || notification.date);
      notifDate.setHours(0, 0, 0, 0);
      
      if (notifDate.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else if (notifDate >= lastWeekStart) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });
    
    return groups;
  };
  
  const notificationGroups = groupNotificationsByDate(notifications);
  
  const hasUnreadNotifications = notifications?.some(n => !n.read) || false;
  
  const getFilterCount = (filterType) => {
    if (!Array.isArray(notifications)) return 0;
    
    if (filterType === 'unread') {
      return notifications.filter(n => !n.read).length;
    } else if (filterType !== 'all') {
      return notifications.filter(n => n.type === filterType).length;
    }
    return notifications.length;
  };
  
  // Check if there are any notifications after filtering
  const hasFilteredNotifications = 
    notificationGroups.today.length > 0 ||
    notificationGroups.yesterday.length > 0 ||
    notificationGroups.thisWeek.length > 0 ||
    notificationGroups.older.length > 0;

  // Render Skeleton Loader
  const NotificationSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex items-start space-x-3 p-4 rounded-lg bg-white border border-gray-100">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="h-2.5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
          <div className="h-2 bg-gray-200 rounded w-5/6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="w-10 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 max-w-5xl mx-auto bg-gradient-to-r from-gray-50 to-white rounded-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BellAlertIcon className="h-7 w-7 text-yellow-500 mr-2" />
            Notifications
          </h2>
          <div className="bg-gray-100 w-32 h-10 rounded-md"></div> {/* Placeholder for actions */}
        </div>
        
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto bg-gradient-to-r from-gray-50 to-white rounded-xl animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BellAlertIcon className="h-7 w-7 text-yellow-500 mr-2" />
            Notifications
            {hasUnreadNotifications && (
              <span className="ml-2 px-2 py-0.5 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                {getFilterCount('unread')} non lues
              </span>
            )}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Restez informé des mises à jour concernant vos objets</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-3 py-2 w-full sm:w-auto rounded-lg border border-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm transition-all duration-200"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                title="Effacer la recherche"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${showFilterMenu ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 border border-gray-200'}`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtrer
              {filter !== 'all' && <span className="ml-1 w-2 h-2 bg-blue-600 rounded-full"></span>}
            </button>
            
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 animate-slideIn">
                <button
                  onClick={() => {
                    setFilter('all');
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${filter === 'all' ? 'bg-blue-50 text-blue-700' : ''}`}
                >
                  <span>Toutes les notifications</span>
                  <span className="text-xs text-gray-500">{getFilterCount('all')}</span>
                </button>
                <button
                  onClick={() => {
                    setFilter('unread');
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${filter === 'unread' ? 'bg-blue-50 text-blue-700' : ''}`}
                >
                  <span className="flex items-center">
                    <BellAlertIcon className="h-4 w-4 mr-2" />
                    Non lues
                  </span>
                  <span className="text-xs text-gray-500">{getFilterCount('unread')}</span>
                </button>
                <button
                  onClick={() => {
                    setFilter('secret_answer_pending');
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${filter === 'secret_answer_pending' ? 'bg-blue-50 text-blue-700' : ''}`}
                >
                  <span>En attente de vérification</span>
                  <span className="text-xs text-gray-500">{getFilterCount('secret_answer_pending')}</span>
                </button>
                <button
                  onClick={() => {
                    setFilter('status_update');
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${filter === 'status_update' ? 'bg-blue-50 text-blue-700' : ''}`}
                >
                  <span>Mises à jour de statut</span>
                  <span className="text-xs text-gray-500">{getFilterCount('status_update')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg transition-all duration-200 ${isRefreshing ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            title="Actualiser les notifications"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
          
          {/* Mark all as read button */}
          {hasUnreadNotifications && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
              title="Marquer tout comme lu"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 animate-fadeIn flex items-center">
          <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {selectedAnswer && selectedItem && (
        <div className="mb-6 p-5 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm animate-fadeIn">
          <SecretAnswerVerification
            answer={{
              ...selectedAnswer,
              _id: selectedAnswer._id.toString(),
              userWhoAnswered: selectedAnswer.user
            }}
            item={{
              ...selectedItem,
              _id: selectedItem._id.toString()
            }}
            onVerificationComplete={async () => {
              await fetchNotifications();
              setSelectedAnswer(null);
              setSelectedItem(null);
            }}
          />
        </div>
      )}

      {!notifications || notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BellSlashIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Vous n'avez aucune notification pour le moment. Les notifications apparaîtront ici lorsque vous recevrez des mises à jour concernant vos objets.
          </p>
        </div>
      ) : !hasFilteredNotifications ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <FunnelIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Aucune notification ne correspond à votre recherche ou à votre filtre.
          </p>
          <button
            onClick={() => {
              setFilter('all');
              setSearchTerm('');
            }}
            className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today notifications */}
          {notificationGroups.today.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Aujourd'hui
              </h3>
              <div className="space-y-3">
                {notificationGroups.today.map((notification) => renderNotificationItem(notification))}
              </div>
            </div>
          )}
          
          {/* Yesterday notifications */}
          {notificationGroups.yesterday.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Hier
              </h3>
              <div className="space-y-3">
                {notificationGroups.yesterday.map((notification) => renderNotificationItem(notification))}
              </div>
            </div>
          )}
          
          {/* This week notifications */}
          {notificationGroups.thisWeek.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Cette semaine
              </h3>
              <div className="space-y-3">
                {notificationGroups.thisWeek.map((notification) => renderNotificationItem(notification))}
              </div>
            </div>
          )}
          
          {/* Older notifications */}
          {notificationGroups.older.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Plus ancien
              </h3>
              <div className="space-y-3">
                {notificationGroups.older.map((notification) => renderNotificationItem(notification))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
  
  // Helper function to render each notification item
  function renderNotificationItem(notification) {
    if (!notification || !notification._id) return null;
    
    const formattedDate = notification.createdAt 
      ? new Date(notification.createdAt).toLocaleString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      : '';
      
    return (
      <div
        key={notification._id}
        className={`p-4 rounded-lg transition-all duration-300 border ${
          notification.read ? 'bg-white border-gray-100' : 'bg-yellow-50 border-yellow-200'
        } hover:shadow-md`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getNotificationIcon(notification.type)}
            <div className="flex-1 min-w-0">
              {renderNotificationContent(notification)}
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span>{formattedDate}</span>
                {!notification.read && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Non lu
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="ml-4 flex items-start shrink-0">
            {notification.read === false && (
              <button
                onClick={() => markAsRead(notification._id)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Marquer comme lu"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            )}
            {renderNotificationActions(notification)}
          </div>
        </div>
      </div>
    );
  }
};

export default NotificationsPanel;
