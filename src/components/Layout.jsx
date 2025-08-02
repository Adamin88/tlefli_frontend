import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Initialize sidebar collapsed state based on window width
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 940)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-expand sidebar when returning to desktop from mobile
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false)
      }
      
      // Auto-collapse sidebar when width is under 940px
      if (window.innerWidth < 940 && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
      
      // Auto-expand sidebar when width is >= 940px
      if (window.innerWidth >= 940 && sidebarCollapsed && !mobile) {
        setSidebarCollapsed(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen, sidebarCollapsed])

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapseToggle={(collapsed) => setSidebarCollapsed(collapsed)}
      />
      
      {/* Mobile menu button - hide when sidebar is open */}
      {!sidebarOpen && (
        <div className="fixed top-0 left-0 z-40 md:hidden">
          <button
            type="button"
            className="p-2 m-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Main content - dynamically adjust padding based on sidebar state */}
      <div 
        className="transition-all duration-300 flex flex-col flex-1 pr-4 sm:pr-6 lg:pr-8"
        style={{ 
          paddingLeft: isMobile ? '1rem' : sidebarCollapsed ? '4.5rem' : '17rem',
          position: 'relative', // Add this to establish a new stacking context
          zIndex: 10 // Lower than sidebar but still positive
        }}
      >
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
