import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import itemsService from '../services/itemsService';
import { useAuth } from '../contexts/AuthContext';

// Ultra-simplified emergency version
export default function ItemDetails() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Basic data fetching
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await itemsService.getItemById(id);
        if (response.success) {
          setItem(response.data);
        } else {
          setError(response.error || 'Failed to fetch item details');
        }
      } catch (err) {
        setError('Failed to fetch item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-red-700 font-medium">Error loading item details</div>
          <div className="text-red-600 mt-1">{error || "Item not found"}</div>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center mb-6">
        <Link to="/items" className="px-3 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200">
          Back to List
        </Link>
        
        {currentUser && (
          <Link to={`/items/${item._id}/edit`} className="px-4 py-2 rounded-md text-white bg-yellow-600 hover:bg-yellow-700">
            Edit
          </Link>
        )}
      </div>

      {/* Basic Item Details */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
              {item.type === 'lost' ? 'Lost Item' : 'Found Item'}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
              {item.status}
            </span>
            <span className="ml-auto text-sm bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
              Ref: {item.reference}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h1>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">
              {item.type === 'lost' ? 'Lost on: ' : 'Found on: '} 
              {new Date(item.date).toLocaleDateString()}
            </div>
            
            {item.location && (
              <div className="text-sm text-gray-500">
                Location: {item.location.address}
              </div>
            )}
          </div>
          
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <div className="text-gray-600">
              {item.description}
            </div>
          </div>

          {item.category && (
            <div className="text-sm text-gray-600 mb-6">
              Category: {item.category}
              {item.subcategory && ` - ${item.subcategory}`}
            </div>
          )}
          
          {item.images && item.images.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Images</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {item.images.slice(0, 6).map((image, index) => (
                  <div key={index} className="aspect-square rounded-md overflow-hidden">
                    <img
                      src={`data:${image.contentType};base64,${image.data}`}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center text-gray-500 mt-8">
        <p>This is a simplified emergency view of the item.</p>
        <p>If you need full functionality, please try refreshing the page.</p>
      </div>
    </div>
  );
}
