import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from 'recharts';
import { 
  ChartPieIcon, 
  ListBulletIcon, 
  ClipboardDocumentCheckIcon 
} from '@heroicons/react/24/outline';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c'];

const STATUS_COLORS = {
  'Annonce déposée': '#FFBB28',
  'Authentification en cours': '#0088FE',
  'Authentification validée': '#00C49F',
  'Restitution en cours': '#FF8042',
  'Objet restitué': '#8884d8'
};

export default function BusinessAnalytics({ data }) {
  const { categoryData, subcategoryData, statusData } = data;
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Get subcategories for selected category or first category if none selected
  const getSubcategoryData = () => {
    if (selectedCategory && subcategoryData && subcategoryData[selectedCategory]) {
      return subcategoryData[selectedCategory];
    } else {
      // If no category is selected, use the first available one
      const firstCategory = Object.keys(subcategoryData || {})[0];
      return firstCategory ? subcategoryData[firstCategory] : [];
    }
  };

  // Handle category selection from pie chart
  const handleCategoryClick = (data, index) => {
    setSelectedCategory(data.name);
  };

  // Custom tick formatter that ensures only integer values at reasonable intervals
  const formatYAxisTick = (value) => {
    return Math.round(value);
  };

  // Function to calculate appropriate ticks based on data
  const getCustomTicks = (data) => {
    if (!data || data.length === 0) return [0];
    
    const maxValue = Math.max(...data.map(item => item.value));
    
    // If max value is small, just return integers up to the max
    if (maxValue <= 5) {
      return Array.from({length: maxValue + 1}, (_, i) => i);
    }
    
    // Otherwise calculate a nice set of ticks
    const tickCount = Math.min(5, maxValue);
    const step = Math.ceil(maxValue / tickCount);
    
    return Array.from(
      {length: tickCount + 1}, 
      (_, i) => i * step
    );
  };

  // Get custom ticks for status data
  const statusTicks = getCustomTicks(statusData);

  // Custom tooltip to avoid number repetition
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-sm text-gray-600 font-semibold">
            {`${Math.round(payload[0].value)} items`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Chart Card Component
  const ChartCard = ({ title, icon: Icon, children, subtitle, className }) => (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="bg-gray-100 p-2 rounded-lg">
              <Icon className="h-5 w-5 text-gray-600" />
            </span>
            <h3 className="ml-3 text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Distribution */}
      <ChartCard 
        title="Category Distribution" 
        icon={ChartPieIcon}
        subtitle={`${categoryData.length} categories`}
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                onClick={handleCategoryClick}
                isAnimationActive={true}
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke={selectedCategory === entry.name ? '#000' : undefined}
                    strokeWidth={selectedCategory === entry.name ? 2 : undefined}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} items`, name]} />
              <Legend onClick={(data) => setSelectedCategory(data.value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded-md">
          Click on a category slice to see its subcategories
        </div>
      </ChartCard>

      {/* Subcategory Distribution */}
      <ChartCard 
        title={`Subcategory Distribution ${selectedCategory ? `- ${selectedCategory}` : ''}`}
        icon={ListBulletIcon}
        subtitle={getSubcategoryData().length > 0 ? `${getSubcategoryData().length} subcategories` : 'Select a category'}
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getSubcategoryData()} layout="vertical">
              <XAxis 
                type="number" 
                tickFormatter={formatYAxisTick}
                ticks={getCustomTicks(getSubcategoryData())}
                allowDecimals={false}
              />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                {getSubcategoryData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
                <LabelList dataKey="value" position="right" formatter={formatYAxisTick} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Item Status Distribution */}
      <ChartCard 
        title="Item Status Distribution" 
        icon={ClipboardDocumentCheckIcon}
        subtitle="Processing status overview"
        className="lg:col-span-2"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={formatYAxisTick}
                ticks={statusTicks}
                allowDecimals={false}
                domain={[0, 'dataMax']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="Items" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                ))}
                <LabelList dataKey="value" position="top" formatter={formatYAxisTick} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
