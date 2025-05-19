import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CATEGORIES_CONFIG, COLOR_OPTIONS } from '../config/categoriesConfig'
import itemsService from '../services/itemsService'
import { useAuth } from '../contexts/AuthContext'

export default function EditItem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    category: '',
    subcategory: '',
    description: '',
    date: '',
    location: {
      address: '',
      coordinates: null
    },
    status: '',
    images: [],
    fields: {},
    hasReward: false,
    reward: null,
    secretQuestion: {
      question: '',
      answer: ''
    }
  })

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')

  // Debug log whenever formData changes
  useEffect(() => {
    console.log('FormData updated:', formData);
    console.log('Current fields:', formData.fields);
  }, [formData]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const fetchItem = async () => {
      try {
        setIsLoading(true)
        console.log('Fetching item with ID:', id);
        const response = await itemsService.getItemById(id)
        console.log('Fetch response:', response);
        
        if (response.success) {
          const item = response.data
          console.log('Fetched item:', item);

          // Initialize fields as an empty object if undefined
          const fields = typeof item.subcategoryFields === 'object' ? item.subcategoryFields : {};
          console.log('Initialized fields:', fields);

          // Get subcategory config if available
          const subcategoryConfig = item.category && item.subcategory ? 
            CATEGORIES_CONFIG[item.category]?.subcategories[item.subcategory] : null;
          
          // Initialize default values for fields based on subcategory config
          const initializedFields = subcategoryConfig?.fields ? 
            Object.entries(subcategoryConfig.fields).reduce((acc, [fieldName, fieldConfig]) => {
              // Keep existing value or set default empty value based on type
              acc[fieldName] = fields[fieldName] ?? (fieldConfig.type === 'multiselect' ? [] : '');
              return acc;
            }, {}) : fields;

          console.log('Fields with defaults:', initializedFields);
          
          setFormData({
            title: item.title || '',
            type: item.type || '',
            status: item.status || '',
            category: item.category || '',
            subcategory: item.subcategory || '',
            description: item.description || '',
            date: item.date ? item.date.split('T')[0] : '',
            location: {
              address: item.location?.address || '',
              coordinates: item.location?.coordinates || null
            },
            images: item.images || [],
            fields: initializedFields,
            hasReward: !!item.reward,
            reward: item.reward || null,
            secretQuestion: item.secretQuestion || { question: '', answer: '' }
          })
          
          setSelectedCategory(item.category || '')
          setSelectedSubcategory(item.subcategory || '')
          console.log('Form data initialized with fields:', initializedFields);
        } else {
          console.error('Failed to fetch item:', response.error);
          setError(response.error)
        }
      } catch (err) {
        console.error('Error fetching item:', err)
        setError('Failed to fetch item details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchItem()
  }, [id, isAuthenticated, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`handleChange - name: ${name}, value:`, value);

    // Remove real-time description validation
    if (name === 'description') {
      // Only show character count, not validation error
      setValidationErrors({});
    }

    if (name === 'category') {
      console.log('Changing category to:', value);
      setSelectedCategory(value);
      setSelectedSubcategory('');
      setFormData(prev => {
        console.log('Resetting fields for new category');
        return {
          ...prev,
          category: value,
          subcategory: '',
          fields: {}
        };
      });
    } else if (name === 'subcategory') {
      console.log('Changing subcategory to:', value);
      setSelectedSubcategory(value);
      
      // Get the subcategory configuration
      const subcategoryConfig = CATEGORIES_CONFIG[formData.category]?.subcategories[value];
      console.log('New subcategory config:', subcategoryConfig);

      setFormData(prev => {
        // Keep existing fields that are valid for the new subcategory
        const newFields = {};
        if (subcategoryConfig?.fields) {
          Object.entries(subcategoryConfig.fields).forEach(([fieldName, fieldConfig]) => {
            // Keep existing value if it exists and is valid for this field type
            if (prev.fields?.[fieldName] !== undefined) {
              newFields[fieldName] = prev.fields[fieldName];
            } else {
              // Set default value based on field type
              newFields[fieldName] = fieldConfig.type === 'multiselect' ? [] : '';
            }
          });
        }
        
        console.log('Initializing fields for new subcategory:', newFields);
        return {
          ...prev,
          subcategory: value,
          fields: newFields
        };
      });
    } else if (name.startsWith('fields.')) {
      const fieldName = name.split('.')[1];
      console.log(`Updating field ${fieldName} with value:`, value);
      
      // Get the field configuration
      const fieldConfig = CATEGORIES_CONFIG[formData.category]?.subcategories[formData.subcategory]?.fields[fieldName];
      console.log('Field config:', fieldConfig);

      setFormData(prev => {
        let fieldValue = value;

        // Handle different field types
        if (fieldConfig?.type === 'multiselect') {
          fieldValue = Array.isArray(value) ? value : value ? [value] : [];
        } else if (fieldConfig?.type === 'select' || fieldConfig?.type === 'color') {
          fieldValue = value || ''; // Keep empty string for select/color fields
        } else {
          fieldValue = value || ''; // Keep empty string for text fields
        }

        const newFields = {
          ...prev.fields,
          [fieldName]: fieldValue
        };

        console.log('Updated fields:', newFields);
        return {
          ...prev,
          fields: newFields
        };
      });
    } else if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else if (name === 'hasReward') {
      setFormData(prev => ({
        ...prev,
        hasReward: value,
        reward: value ? { amount: 0, currency: 'EUR' } : null
      }));
    } else if (name === 'reward.amount') {
      const value = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        reward: {
          ...prev.reward,
          amount: isNaN(value) ? 0 : value
        }
      }));
    } else if (name === 'reward.currency') {
      setFormData(prev => ({
        ...prev,
        reward: {
          ...prev.reward,
          currency: value
        }
      }));
    } else if (name === 'secretQuestion.question' || name === 'secretQuestion.answer') {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        secretQuestion: {
          ...prev.secretQuestion,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Reset validation errors
      setValidationErrors({});
      setError(null);

      // Collect validation errors
      const errors = {};
      
      if (!formData.title?.trim()) errors.title = 'Title is required';
      if (!formData.type) errors.type = 'Type is required';
      if (!formData.status) errors.status = 'Status is required';
      if (!formData.category) errors.category = 'Category is required';
      if (!formData.subcategory) errors.subcategory = 'Subcategory is required';
      if (!formData.description?.trim()) {
        errors.description = 'Description is required';
      } else if (formData.description?.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters long';
      } else if (formData.description?.trim().length > 2000) {
        errors.description = 'Description cannot exceed 2000 characters';
      }
      if (!formData.date) errors.date = 'Date is required';
      if (!formData.location?.address?.trim()) errors.location = 'Location is required';

      // Validate secret question for found items
      if (formData.type === 'found') {
        if (!formData.secretQuestion?.question?.trim()) {
          errors.secretQuestion = 'La question secrète est requise';
        } else if (formData.secretQuestion.question.trim().length < 10) {
          errors.secretQuestion = 'La question doit contenir au moins 10 caractères';
        }
        
        if (!formData.secretQuestion?.answer?.trim()) {
          errors.secretAnswer = 'La réponse à la question secrète est requise';
        } else if (formData.secretQuestion.answer.trim().length < 10) {
          errors.secretAnswer = 'La réponse doit contenir au moins 10 caractères';
        }
      }

      // Get subcategory configuration
      const subcategoryConfig = CATEGORIES_CONFIG[formData.category]?.subcategories[formData.subcategory];
      
      // Validate required fields from subcategory
      if (subcategoryConfig?.fields) {
        Object.entries(subcategoryConfig.fields).forEach(([fieldName, fieldConfig]) => {
          if (fieldConfig.required && !formData.fields?.[fieldName]) {
            errors[`fields.${fieldName}`] = `${fieldConfig.label} is required`;
          }
        });
      }

      // If there are validation errors, show them and stop submission
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Prepare the item data
      const itemData = {
        title: formData.title.trim(),
        type: formData.type,
        status: formData.status,
        category: formData.category,
        subcategory: formData.subcategory,
        description: formData.description.trim(),
        date: new Date(formData.date).toISOString(),
        location: {
          type: 'Point',
          coordinates: formData.location.coordinates || [0, 0],
          address: formData.location.address.trim()
        },
        subcategoryFields: Object.entries(formData.fields || {}).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = Array.isArray(value) ? value : String(value).trim();
          }
          return acc;
        }, {}),
        images: formData.images.map((img, index) => ({
          data: img.data,
          contentType: img.contentType,
          isMain: index === 0
        })),
        reward: formData.hasReward ? formData.reward : null,
        secretQuestion: formData.type === 'found' ? {
          question: formData.secretQuestion.question.trim(),
          answer: formData.secretQuestion.answer.trim()
        } : null
      };

      console.log('Submitting item data:', itemData);
      const response = await itemsService.updateItem(id, itemData);
      
      if (response.success) {
        navigate(`/items/${id}`);
      } else {
        if (typeof response.error === 'object') {
          setValidationErrors(response.error);
        } else {
          setError(response.error || 'Failed to update item');
        }
      }
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message || 'Failed to update item');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    console.log('Processing image files:', files.map(f => f.name));
    
    const imagePromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            data: e.target.result.split(',')[1],
            contentType: file.type,
            isMain: false
          })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    })

    Promise.all(imagePromises)
      .then(newImages => {
        console.log('Images processed successfully');
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }))
      })
      .catch(error => {
        console.error('Error processing images:', error)
      })
  }

  const renderDynamicFields = () => {
    if (!selectedCategory || !selectedSubcategory) {
      console.log('No category or subcategory selected');
      return null;
    }

    const categoryConfig = CATEGORIES_CONFIG[selectedCategory];
    if (!categoryConfig?.subcategories) {
      console.log('No subcategories found for category:', selectedCategory);
      return null;
    }

    const subcategoryConfig = categoryConfig.subcategories[selectedSubcategory];
    if (!subcategoryConfig?.fields) {
      console.log('No fields found for subcategory:', selectedSubcategory);
      return null;
    }

    console.log('Rendering fields for:', {
      category: selectedCategory,
      subcategory: selectedSubcategory,
      fields: formData.fields
    });

    return Object.entries(subcategoryConfig.fields).map(([fieldName, fieldConfig]) => {
      const value = formData.fields?.[fieldName] || '';
      const uniqueId = `field_${selectedCategory}_${selectedSubcategory}_${fieldName}`;
      
      console.log(`Rendering field ${fieldName}:`, {
        config: fieldConfig,
        currentValue: value,
        uniqueId
      });

      // Initialize fields object if it doesn't exist
      if (!formData.fields) {
        setFormData(prev => ({
          ...prev,
          fields: {}
        }));
      }

      switch (fieldConfig.type) {
        case 'select':
          return (
            <div key={fieldName} className="sm:col-span-1">
              <label htmlFor={uniqueId} className="block text-sm font-medium text-gray-700">
                {fieldConfig.label}
                {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                id={uniqueId}
                name={`fields.${fieldName}`}
                value={value}
                onChange={(e) => {
                  console.log(`Select field ${fieldName} changed to:`, e.target.value);
                  handleChange(e);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required={fieldConfig.required}
              >
                <option value="">Select {fieldConfig.label}</option>
                {fieldConfig.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          );

        case 'multiselect':
          const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
          console.log(`Multiselect field ${fieldName} current values:`, selectedValues);
          return (
            <div key={fieldName} className="sm:col-span-1">
              <label htmlFor={uniqueId} className="block text-sm font-medium text-gray-700">
                {fieldConfig.label}
                {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                id={uniqueId}
                name={`fields.${fieldName}`}
                value={selectedValues}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  console.log(`Multiselect field ${fieldName} changed to:`, selectedOptions);
                  setFormData(prev => ({
                    ...prev,
                    fields: {
                      ...prev.fields,
                      [fieldName]: selectedOptions
                    }
                  }));
                }}
                multiple
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required={fieldConfig.required}
              >
                {fieldConfig.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          );

        case 'color':
          console.log(`Color field ${fieldName} current value:`, value);
          return (
            <div key={fieldName} className="sm:col-span-1">
              <label htmlFor={uniqueId} className="block text-sm font-medium text-gray-700">
                {fieldConfig.label}
                {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                id={uniqueId}
                name={`fields.${fieldName}`}
                value={value}
                onChange={(e) => {
                  console.log(`Color field ${fieldName} changed to:`, e.target.value);
                  handleChange(e);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required={fieldConfig.required}
              >
                <option value="">Select Color</option>
                {COLOR_OPTIONS.map(color => (
                  <option key={color.value} value={color.label}>{color.label}</option>
                ))}
              </select>
            </div>
          );

        default: // text input
          console.log(`Text field ${fieldName} current value:`, value);
          return (
            <div key={fieldName} className="sm:col-span-1">
              <label htmlFor={uniqueId} className="block text-sm font-medium text-gray-700">
                {fieldConfig.label}
                {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                id={uniqueId}
                name={`fields.${fieldName}`}
                value={value}
                onChange={(e) => {
                  console.log(`Text field ${fieldName} changed to:`, e.target.value);
                  handleChange(e);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required={fieldConfig.required}
              />
            </div>
          );
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-red-700 font-medium">Error</div>
          <div className="text-red-600 mt-1">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
        <p className="text-sm text-gray-500">Update the item's information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            {/* Basic Information */}
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required
              >
                <option value="">Select Type</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required
              >
                <option value="">Select Status</option>
                <option value="posted">Annonce déposée</option>
                <option value="authenticating">Authentification en cours</option>
                <option value="authenticated">Authentification validée</option>
                <option value="returning">Restitution en cours</option>
                <option value="returned">Objet restitué</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={selectedCategory}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required
              >
                <option value="">Select Category</option>
                {Object.entries(CATEGORIES_CONFIG).map(([key, category]) => (
                  <option key={key} value={key}>{category.label}</option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                  Subcategory
                </label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={selectedSubcategory}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  required
                >
                  <option value="">Select Subcategory</option>
                  {Object.entries(CATEGORIES_CONFIG[selectedCategory].subcategories).map(([key, subcategory]) => (
                    <option key={key} value={key}>{subcategory.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Fields based on Category/Subcategory */}
            {renderDynamicFields()}

            {/* Reward Section for Lost Items */}
            {formData.type === 'lost' && (
              <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎁</span>
                    <div>
                      <h3 className="text-gray-700 font-semibold">Reward</h3>
                      <p className="text-gray-500 text-sm">Offer a reward to increase chances of finding your item</p>
                    </div>
                  </div>
                  {/* Modern Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.hasReward}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        hasReward: !prev.hasReward,
                        reward: !prev.hasReward ? { amount: 0, currency: 'EUR' } : null
                      }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {formData.hasReward ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {formData.hasReward && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 text-sm mb-1.5 font-medium">
                          Amount
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">
                              {formData.reward?.currency === 'EUR' ? '€' :
                                formData.reward?.currency === 'USD' ? '$' :
                                  formData.reward?.currency === 'GBP' ? '£' : ''}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={formData.reward?.amount || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              setFormData(prev => ({
                                ...prev,
                                reward: {
                                  ...prev.reward,
                                  amount: isNaN(value) ? 0 : value
                                }
                              }));
                            }}
                            required={formData.hasReward}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1.5 font-medium">
                          Currency
                        </label>
                        <select
                          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={formData.reward?.currency || 'EUR'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            reward: {
                              ...prev.reward,
                              currency: e.target.value
                            }
                          }))}
                          required={formData.hasReward}
                        >
                          <option value="EUR">Euro (EUR)</option>
                          <option value="USD">Dollar (USD)</option>
                          <option value="GBP">Livre Sterling (GBP)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Secret Question Section */}
            {formData.type === 'found' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="secretQuestion.question" className="block text-sm font-medium text-gray-700">
                    Question secrète
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="secretQuestion.question"
                      id="secretQuestion.question"
                      value={formData.secretQuestion?.question || ''}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-yellow-500 focus:border-yellow-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        validationErrors.secretQuestion ? 'border-red-300' : ''
                      }`}
                      placeholder="Ex: Quelle est la couleur de l'objet?"
                    />
                    {validationErrors.secretQuestion && (
                      <p className="mt-2 text-sm text-red-600">
                        {validationErrors.secretQuestion}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="secretQuestion.answer" className="block text-sm font-medium text-gray-700">
                    Réponse à la question secrète
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="secretQuestion.answer"
                      id="secretQuestion.answer"
                      value={formData.secretQuestion?.answer || ''}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-yellow-500 focus:border-yellow-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        validationErrors.secretAnswer ? 'border-red-300' : ''
                      }`}
                      placeholder="Ex: Rouge"
                    />
                    {validationErrors.secretAnswer && (
                      <p className="mt-2 text-sm text-red-600">
                        {validationErrors.secretAnswer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Location Information */}
            <div className="sm:col-span-2">
              <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location.address"
                id="location.address"
                value={formData.location.address}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                name="date"
                id="date"
                value={formData.date?.split('T')[0]}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                required
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="mt-1 relative">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className={`block w-full border ${
                    validationErrors.description ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm`}
                  required
                />
                <div className="mt-1 text-sm text-gray-500">
                  {formData.description.trim().length}/2000 characters (minimum 10 characters)
                </div>
                {validationErrors.description && (
                  <div className="mt-1 text-sm text-red-600">
                    {validationErrors.description}
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Images</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="images"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-yellow-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="images"
                        name="images"
                        type="file"
                        multiple
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={`data:${image.contentType};base64,${image.data}`}
                        alt={`Preview ${index + 1}`}
                        className="h-24 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index)
                          }))
                        }}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/items/${id}`)}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
