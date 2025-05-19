import React, { useState } from 'react';
import {
  DocumentChartBarIcon,
  CloudArrowDownIcon,
  PrinterIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

export default function BusinessReports({ reportData }) {
  const [selectedReport, setSelectedReport] = useState('daily');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const reports = [
    {
      id: 'daily',
      name: 'Daily Summary',
      description: 'Overview of daily activities and transactions',
      icon: DocumentChartBarIcon,
    },
    {
      id: 'weekly',
      name: 'Weekly Analysis',
      description: 'Detailed weekly performance metrics',
      icon: DocumentChartBarIcon,
    },
    {
      id: 'monthly',
      name: 'Monthly Report',
      description: 'Comprehensive monthly statistics and trends',
      icon: DocumentChartBarIcon,
    },
  ];

  const generateReport = () => {
    // Implement report generation logic
    console.log('Generating report:', selectedReport, dateRange);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Reports</h2>
        <p className="text-gray-600">Generate and manage detailed reports for your business</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-4 rounded-lg border-2 text-left ${
              selectedReport === report.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-200'
            }`}
          >
            <report.icon className="h-6 w-6 text-blue-500 mb-2" />
            <h3 className="font-medium text-gray-900">{report.name}</h3>
            <p className="text-sm text-gray-500">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Date Range Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-full rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-full rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Report Preview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <h4 className="font-medium text-gray-900">Items Summary</h4>
                <p className="text-sm text-gray-500">Total items processed in selected period</p>
              </div>
              <span className="text-2xl font-bold text-blue-600">247</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <h4 className="font-medium text-gray-900">Resolution Rate</h4>
                <p className="text-sm text-gray-500">Percentage of items successfully returned</p>
              </div>
              <span className="text-2xl font-bold text-green-600">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">Average Processing Time</h4>
                <p className="text-sm text-gray-500">Time taken to process and return items</p>
              </div>
              <span className="text-2xl font-bold text-purple-600">2.5 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={generateReport}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <CloudArrowDownIcon className="h-5 w-5 mr-2" />
          Download Report
        </button>
        <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          <PrinterIcon className="h-5 w-5 mr-2" />
          Print Report
        </button>
        <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          <ShareIcon className="h-5 w-5 mr-2" />
          Share Report
        </button>
      </div>
    </div>
  );
}
