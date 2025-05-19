import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import itemsService from '../services/itemsService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ItemList = ({ items, refreshItems }) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  // Handle delete confirmation
  const handleDeleteConfirm = async (itemId) => {
    try {
      setIsDeleting(true);
      setDeletingItemId(itemId);
      
      console.log(`Deleting item with ID: ${itemId}`);
      const response = await itemsService.deleteItem(itemId);
      
      if (response.success) {
        toast.success('Item deleted successfully');
        // Refresh the items list after deletion
        if (refreshItems) {
          refreshItems();
        }
      } else {
        toast.error(response.message || 'Failed to delete item');
        console.error('Delete error:', response.error);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('An error occurred while deleting the item');
    } finally {
      setIsDeleting(false);
      setDeletingItemId(null);
    }
  };

  // Check if user can edit/delete an item
  const canModifyItem = (item) => {
    return user && (
      user.role === 'admin' || 
      (item.reportedBy && item.reportedBy._id === user._id)
    );
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No items found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item._id}>
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Item image thumbnail */}
                <div className="flex-shrink-0 h-16 w-16 rounded-md bg-gray-100 overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <img 
                      src={`data:${item.images[0].contentType};base64,${item.images[0].data}`}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Item details */}
                <div>
                  <Link to={`/items/${item._id}`} className="text-lg font-medium text-blue-600 hover:text-blue-800">
                    {item.title}
                  </Link>
                  <div className="mt-1 flex items-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {item.category}{item.subcategory ? ` › ${item.subcategory}` : ''}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>{formatDate(item.date)}</span>
                    <span className="mx-1">•</span>
                    <span>{item.location?.address}</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              {canModifyItem(item) && (
                <div className="flex space-x-2">
                  <Link
                    to={`/items/${item._id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteConfirm(item._id)}
                    disabled={isDeleting && deletingItemId === item._id}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isDeleting && deletingItemId === item._id ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemList;
