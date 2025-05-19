import { useState } from 'react'
import {
  UsersIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

// Mock data - replace with actual API calls
const mockStats = {
  totalUsers: 156,
  totalItems: 324,
  resolvedItems: 89,
  pendingItems: 235,
  businessAccounts: 12,
  monthlyGrowth: 23,
}

const mockRecentActivity = [
  {
    id: 1,
    type: 'user_registration',
    user: 'John Doe',
    date: '2024-02-15T10:00:00',
    details: 'New user registration',
  },
  {
    id: 2,
    type: 'item_reported',
    user: 'Jane Smith',
    date: '2024-02-15T09:45:00',
    details: 'Reported a lost iPhone',
  },
  {
    id: 3,
    type: 'item_resolved',
    user: 'Mike Johnson',
    date: '2024-02-15T09:30:00',
    details: 'Found item matched and returned',
  },
]

const mockMonthlyStats = [
  { month: 'Jan', items: 45, resolved: 12 },
  { month: 'Feb', items: 52, resolved: 18 },
  { month: 'Mar', items: 61, resolved: 25 },
  { month: 'Apr', items: 48, resolved: 20 },
  { month: 'May', items: 55, resolved: 22 },
  { month: 'Jun', items: 67, resolved: 28 },
]

export default function AdminPanel() {
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  const stats = [
    {
      name: 'Total Users',
      value: mockStats.totalUsers,
      icon: UsersIcon,
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Total Items',
      value: mockStats.totalItems,
      icon: DocumentDuplicateIcon,
      change: '+8%',
      changeType: 'increase',
    },
    {
      name: 'Resolved Items',
      value: mockStats.resolvedItems,
      icon: CheckCircleIcon,
      change: '+23%',
      changeType: 'increase',
    },
    {
      name: 'Pending Items',
      value: mockStats.pendingItems,
      icon: ExclamationTriangleIcon,
      change: '+4%',
      changeType: 'increase',
    },
    {
      name: 'Business Accounts',
      value: mockStats.businessAccounts,
      icon: BuildingOfficeIcon,
      change: '+15%',
      changeType: 'increase',
    },
    {
      name: 'Monthly Growth',
      value: `${mockStats.monthlyGrowth}%`,
      icon: ArrowTrendingUpIcon,
      change: '+2%',
      changeType: 'increase',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-sm text-gray-700">
            A comprehensive overview of your platform's performance and statistics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-yellow-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <ul role="list" className="divide-y divide-gray-200">
            {mockRecentActivity.map((activity) => (
              <li key={activity.id} className="px-6 py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.user}
                    </p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(activity.date).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Monthly Statistics</h2>
        <div className="mt-4 rounded-lg bg-white shadow p-6">
          <div className="grid grid-cols-6 gap-4">
            {mockMonthlyStats.map((stat) => (
              <div key={stat.month} className="text-center">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-yellow-600">
                        {stat.month}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-24 flex flex-col justify-end">
                    <div
                      style={{
                        height: `${(stat.resolved / stat.items) * 100}%`,
                      }}
                      className="w-full bg-green-200"
                    ></div>
                    <div
                      style={{
                        height: `${
                          ((stat.items - stat.resolved) / stat.items) * 100
                        }%`,
                      }}
                      className="w-full bg-yellow-200"
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {stat.items} items
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-200 mr-1"></div>
              <span className="text-xs text-gray-500">Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-200 mr-1"></div>
              <span className="text-xs text-gray-500">Resolved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
