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
    { name: 'Lost Items', href: '/items', icon: FolderIcon },
    { name: 'Report Item', href: '/report', icon: DocumentPlusIcon },
    { 
      name: 'Messages', 
      href: '/notifications', 
      icon: BellIcon,
      badge: unreadCount > 0 ? unreadCount : null 
    },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
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
  const [shouldCollapse, setShouldCollapse] = useState(window.innerWidth < 940);
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const narrowScreen = window.innerWidth < 940;
      
      setIsMobile(mobile);
      setShouldCollapse(narrowScreen);
      
      // Auto-collapse sidebar when width is under 940px
      if (narrowScreen && !collapsed) {
        setCollapsed(true);
      }
      
      // Auto-expand sidebar when width is >= 940px
      if (!narrowScreen && collapsed && !mobile) {
        setCollapsed(false);
      }
      
      // For mobile view, always ensure sidebar is expanded when visible
      if (mobile && collapsed) {
        setCollapsed(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed, setCollapsed]);

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

  return (
    <>
      {/* Mobile menu overlay - only visible when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile header button - only show when sidebar is not visible */}
      {!isOpen && !isMobile && (
        <div className="md:hidden fixed top-0 left-0 z-40 m-4">
          <button
            type="button"
            className="p-2 rounded-lg bg-white shadow-lg text-gray-600 hover:text-gray-900"
            onClick={() => onClose && onClose()}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 ${collapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-gray-50 via-white to-gray-50 shadow-lg transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Note: Changed z-index from 40 to 30 to prevent overlapping with content */}
        <div className="flex flex-col h-full relative">
          {/* Desktop collapse button */}
          {!isMobile && (
            <button
              className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-md text-gray-400 hover:text-yellow-600 transition-colors z-50"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? 
                <ChevronRightIcon className="h-5 w-5" /> : 
                <ChevronLeftIcon className="h-5 w-5" />
              }
            </button>
          )}
          
          {/* Removed logo header section completely */}

          {/* User Profile Section */}
          <div className={`p-4 mt-4 border-b border-gray-100 transition-all duration-300 ${collapsed ? 'flex justify-center' : ''}`}>
            <div className={`${collapsed ? 'w-full flex justify-center' : 'flex items-center'}`}>
              <div className="relative group">
                <img
                  className={`${collapsed ? 'h-8 w-8' : 'h-10 w-10'} rounded-full border-2 border-yellow-200 object-cover transition-all duration-300 transform group-hover:scale-110 shadow-sm`}
                  src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"}
                  alt="User avatar"
                />
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              
              {!collapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.userType === 'business' 
                      ? user?.businessName || user?.name || user?.email
                      : (user?.firstName && user?.lastName) 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.name || user?.email
                    }
                  </p>
                  <p className={`text-xs capitalize ${getUserTypeColor(user?.userType)}`}>
                    {user?.role === 'admin' ? 'Administrator' : user?.userType || 'User'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    ${isActive
                      ? `${collapsed ? 'justify-center ' : ''}bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-r-4 border-yellow-500 shadow-sm font-medium`
                      : `${collapsed ? 'justify-center ' : ''}text-gray-600 hover:bg-yellow-50 hover:text-yellow-800`
                    } 
                    group flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 mb-1 relative
                  `}
                  onClick={onClose}
                  onMouseEnter={(e) => showTooltip(item.name, e)}
                  onMouseLeave={hideTooltip}
                >
                  <div className={`${isActive ? 'bg-yellow-200' : 'bg-gray-100 group-hover:bg-yellow-100'} rounded-lg p-2 transition-all duration-200 relative`}>
                    <item.icon
                      className={`
                        ${isActive ? 'text-yellow-700' : 'text-gray-500 group-hover:text-yellow-700'} 
                        ${collapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3'} transition-colors duration-200
                      `}
                      aria-hidden="true"
                    />
                    
                    {/* Enhanced notification badge for collapsed sidebar */}
                    {collapsed && item.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md z-50 border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  {!collapsed && (
                    <span className="flex-1 ml-2">{item.name}</span>
                  )}
                  
                  {/* Badge for expanded sidebar */}
                  {!collapsed && item.badge && (
                    <span className="animate-pulse bg-red-500 text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            
            {/* Tooltip for collapsed mode */}
            {tooltipInfo.visible && (
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

          {/* Logout Button */}
          <div className={`p-2 border-t border-gray-100 transition-all duration-300 ${collapsed ? 'flex justify-center' : ''}`}>
            <button
              onClick={handleLogout}
              onMouseEnter={(e) => showTooltip('Logout', e)}
              onMouseLeave={hideTooltip}
              className={`
                flex items-center ${collapsed ? 'justify-center' : ''} w-full px-3 py-2.5 text-sm font-medium
                text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200
              `}
            >
              <div className="bg-red-100 rounded-lg p-2 transition-colors duration-200">
                <ArrowLeftOnRectangleIcon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
              </div>
              {!collapsed && <span className="ml-2">Logout</span>}
            </button>
          </div>
          
          {/* Version number */}
          {!collapsed && (
            <div className="px-4 py-2 text-center text-xs text-gray-400">
              v1.2.0
            </div>
          )}
        </div>
      </div>
      
      {/* Add custom styles */}
      <style jsx="true">{`
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
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
