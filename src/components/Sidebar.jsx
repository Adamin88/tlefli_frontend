import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationsContext'
import {
  HomeIcon,
  FolderIcon,
  DocumentPlusIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  // Removed XMarkIcon import
  ChartBarIcon,
  BellIcon,
  PresentationChartBarIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

const getNavigation = (isAdmin, unreadCount, userType) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Vos objets', href: '/items', icon: FolderIcon },
    { name: 'Déclarer un objet', href: '/report', icon: DocumentPlusIcon },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: BellIcon,
      badge: unreadCount > 0 ? unreadCount : null 
    },
    { name: 'Mon compte', href: '/settings', icon: Cog6ToothIcon },
  ]

  // Add Analytics tab for business users
  if (userType === 'business') {
    baseNavigation.splice(1, 0, { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: PresentationChartBarIcon 
    });
  }

  if (isAdmin) {
    baseNavigation.splice(1, 0, { name: 'Admin Panel', href: '/admin', icon: ChartBarIcon })
    baseNavigation.splice(3, 0, { name: 'Users', href: '/users', icon: UserGroupIcon })
  }

  return baseNavigation
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onCollapseToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notifications = useNotifications();
  const unreadCount = notifications?.unreadCount || 0;
  const isAdmin = user?.role === 'admin';
  const navigation = getNavigation(isAdmin, unreadCount, user?.userType);
  
  // Use the prop for collapsed state instead of local state
  const collapsed = isCollapsed;
  const setCollapsed = (state) => {
    if (onCollapseToggle) {
      onCollapseToggle(state);
    }
  };
  
  const [tooltipInfo, setTooltipInfo] = useState({ visible: false, text: '', position: { x: 0, y: 0 } });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [shouldCollapse, setShouldCollapse] = useState(window.innerWidth < 1024);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [userHasManuallyToggled, setUserHasManuallyToggled] = useState(false);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      const desktop = window.innerWidth >= 1024;
      const narrowScreen = window.innerWidth < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      setShouldCollapse(narrowScreen);
      
      // Enhanced responsive behavior - less aggressive auto-management
      if (mobile) {
        // On mobile, sidebar should always be full width when open
        if (collapsed && isOpen) {
          setCollapsed(false);
        }
      } else {
        // For tablet and desktop, only auto-collapse on very first load or extreme size changes
        // Allow user to manually control sidebar state otherwise
        if (!userHasManuallyToggled) {
          if (tablet && !collapsed) {
            // Auto-collapse only on first load for tablets
            setCollapsed(true);
          } else if (desktop && collapsed && window.innerWidth >= 1200) {
            // Auto-expand only on first load for large desktops
            setCollapsed(false);
          }
        }
        // Reset manual toggle flag when switching between major breakpoints
        const prevMobile = window.innerWidth < 768;
        if (prevMobile !== mobile) {
          setUserHasManuallyToggled(false);
        }
      }
    };
    
    // Debounce resize events
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    handleResize(); // Call immediately
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [collapsed, setCollapsed, isOpen, userHasManuallyToggled]);

  // Touch gesture handlers for mobile swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isMobile && isOpen && isLeftSwipe) {
      onClose();
    }
  };

  // Enhanced manual toggle handler
  const handleManualToggle = () => {
    setCollapsed(!collapsed);
    setUserHasManuallyToggled(true);
  };

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getUserTypeColor = (userType) => {
    if (user?.role === 'admin') return 'text-yellow-600'
    return userType === 'business' ? 'text-yellow-600' : 'text-blue-600'
  }
  
  const showTooltip = (text, event) => {
    if (collapsed) {
      setTooltipInfo({
        visible: true,
        text,
        position: { x: event.currentTarget.offsetWidth + 10, y: event.currentTarget.offsetTop + 12 }
      });
    }
  };
  
  const hideTooltip = () => {
    setTooltipInfo({ ...tooltipInfo, visible: false });
  };

  // Enhanced keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isOpen && isMobile) {
      onClose();
    }
  };

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && isMobile) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isMobile]);

  return (
    <>
      {/* Mobile menu overlay - enhanced with better touch handling */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      )}

      {/* Sidebar - enhanced responsive design */}
      <div
        className={`fixed inset-y-0 left-0 z-40 
          ${isMobile ? 'w-80' : collapsed ? 'w-16' : 'w-64'} 
          ${isMobile ? 'max-w-[85vw]' : ''} 
          bg-gradient-to-b from-gray-50 via-white to-gray-50 shadow-xl 
          transform transition-all duration-300 ease-in-out 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
          ${isMobile ? 'border-r-2 border-gray-200' : ''}
        `}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isOpen && isMobile ? 'true' : 'false'}
      >
        {/* Note: Enhanced z-index management */}
        <div className="flex flex-col h-full relative">
          {/* Mobile close button */}
          {isMobile && (
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
              <button
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all duration-200"
                onClick={onClose}
                aria-label="Close menu"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
            </div>
          )}

          {/* Desktop collapse button - improved positioning and manual control */}
          {!isMobile && (
            <button
              className={`absolute ${collapsed ? '-right-3' : '-right-3'} top-20 bg-white rounded-full p-1.5 shadow-lg text-gray-400 hover:text-yellow-600 hover:shadow-xl active:scale-95 transition-all duration-200 z-50 border border-gray-200`}
              onClick={handleManualToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? 
                <ChevronRightIcon className="h-4 w-4" /> : 
                <ChevronLeftIcon className="h-4 w-4" />
              }
            </button>
          )}
          
          {/* Removed logo header section completely */}

          {/* User Profile Section - enhanced for mobile */}
          <div className={`${isMobile ? 'p-4' : 'p-4 mt-4'} border-b border-gray-100 transition-all duration-300 ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
            <div className={`${collapsed && !isMobile ? 'w-full flex justify-center' : 'flex items-center'}`}>
              <div className="relative group">
                <img
                  className={`${isMobile ? 'h-12 w-12' : collapsed ? 'h-8 w-8' : 'h-10 w-10'} rounded-full border-2 border-yellow-200 object-cover transition-all duration-300 transform group-hover:scale-110 shadow-sm`}
                  src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"}
                  alt="User avatar"
                />
                <div className={`absolute bottom-0 right-0 ${isMobile ? 'h-4 w-4' : 'h-3 w-3'} bg-green-400 rounded-full border-2 border-white`}></div>
              </div>
              
              {(!collapsed || isMobile) && (
                <div className="ml-3 overflow-hidden">
                  <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 truncate`}>
                    {user?.userType === 'business' 
                      ? user?.businessName || user?.name || user?.email
                      : (user?.firstName && user?.lastName) 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.name || user?.email
                    }
                  </p>
                  <p className={`${isMobile ? 'text-sm' : 'text-xs'} capitalize ${getUserTypeColor(user?.userType)}`}>
                    {user?.role === 'admin' ? 'Administrator' : user?.userType || 'User'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation - enhanced for mobile and touch */}
          <nav 
            className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar"
            role="menu"
            aria-label="Navigation menu"
          >
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    ${isActive
                      ? `${collapsed && !isMobile ? 'justify-center ' : ''}bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-r-4 border-yellow-500 shadow-sm font-medium`
                      : `${collapsed && !isMobile ? 'justify-center ' : ''}text-gray-600 hover:bg-yellow-50 hover:text-yellow-800 active:bg-yellow-100 focus:bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none`
                    } 
                    group flex items-center ${isMobile ? 'px-4 py-3' : 'px-3 py-2.5'} ${isMobile ? 'text-base' : 'text-sm'} rounded-lg transition-all duration-200 mb-1 relative
                    ${isMobile ? 'active:scale-[0.98]' : ''}
                  `}
                  onClick={isMobile ? onClose : undefined}
                  onMouseEnter={(e) => !isMobile && showTooltip(item.name, e)}
                  onMouseLeave={!isMobile ? hideTooltip : undefined}
                >
                  <div className={`${isActive ? 'bg-yellow-200' : 'bg-gray-100 group-hover:bg-yellow-100'} rounded-lg ${isMobile ? 'p-2.5' : 'p-2'} transition-all duration-200 relative`}>
                    <item.icon
                      className={`
                        ${isActive ? 'text-yellow-700' : 'text-gray-500 group-hover:text-yellow-700'} 
                        ${collapsed && !isMobile ? 'h-5 w-5' : isMobile ? 'h-6 w-6 mr-3' : 'h-5 w-5 mr-3'} transition-colors duration-200
                      `}
                      aria-hidden="true"
                    />
                    
                    {/* Enhanced notification badge for collapsed sidebar */}
                    {collapsed && !isMobile && item.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md z-50 border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  {(!collapsed || isMobile) && (
                    <span className="flex-1 ml-2">{item.name}</span>
                  )}
                  
                  {/* Badge for expanded sidebar */}
                  {(!collapsed || isMobile) && item.badge && (
                    <span className="animate-pulse bg-red-500 text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            
            {/* Tooltip for collapsed mode - only on desktop */}
            {tooltipInfo.visible && !isMobile && (
              <div 
                className="fixed bg-gray-800 text-white text-xs rounded py-1 px-2 z-50 animate-fadeIn"
                style={{ 
                  top: `${tooltipInfo.position.y}px`, 
                  left: `${tooltipInfo.position.x}px` 
                }}
              >
                {tooltipInfo.text}
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 border-t-2 border-r-2 border-b-2 border-transparent border-r-gray-800 border-t-transparent border-b-transparent"></div>
              </div>
            )}
          </nav>

          {/* Logout Button - enhanced for mobile */}
          <div className={`p-2 border-t border-gray-100 transition-all duration-300 ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
            <button
              onClick={handleLogout}
              onMouseEnter={(e) => !isMobile && showTooltip('Logout', e)}
              onMouseLeave={!isMobile ? hideTooltip : undefined}
              className={`
                flex items-center ${collapsed && !isMobile ? 'justify-center' : ''} w-full ${isMobile ? 'px-4 py-3' : 'px-3 py-2.5'} ${isMobile ? 'text-base' : 'text-sm'} font-medium
                text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200
                ${isMobile ? 'active:scale-[0.98] active:bg-red-100' : ''}
              `}
            >
              <div className={`bg-red-100 rounded-lg ${isMobile ? 'p-2.5' : 'p-2'} transition-colors duration-200`}>
                <ArrowLeftOnRectangleIcon className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} ${collapsed && !isMobile ? '' : 'mr-3'}`} />
              </div>
              {(!collapsed || isMobile) && <span className="ml-2">Exit</span>}
            </button>
          </div>
          
          {/* Version number - enhanced for mobile */}
          {(!collapsed || isMobile) && (
            <div className={`${isMobile ? 'px-4 py-3' : 'px-4 py-2'} text-center ${isMobile ? 'text-sm' : 'text-xs'} text-gray-400`}>
              v1.2.0
            </div>
          )}
        </div>
      </div>
      
      {/* Add enhanced custom styles for better responsiveness */}
      <style jsx="true">{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.2);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        /* Enhanced touch targets for mobile */
        @media (max-width: 767px) {
          .custom-scrollbar {
            scrollbar-width: auto;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
        }
        
        /* Smooth transitions for better UX */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Prevent text selection on mobile gestures */
        .sidebar-content {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </>
  )
}
