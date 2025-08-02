import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import itemsService from '../services/itemsService'
import LocationField from '../components/LocationField'

// Import configurations and icons from the config file
import { 
  COLOR_OPTIONS, 
  CATEGORIES_CONFIG,
  // Import specific icons needed for this component
  FaMapMarkerAlt,
  FaCalendarAlt
} from '../config/categoriesConfig'

// Update date options
const DATE_OPTIONS = [
  { label: "Aujourd'hui", value: new Date().toISOString().split('T')[0] },
  {
    label: "Hier",
    value: new Date(Date.now() - 86400000).toISOString().split('T')[0]
  },
  {
    label: "Avant-hier",
    value: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
  },
  { label: "Autre date", value: "custom" }
];

// Modern UI Components
const ModernInput = ({ type, label, value, onChange, options, placeholder, className = '' }) => {
  // Ensure value is always defined
  const safeValue = value === undefined || value === null ? '' : value;

  if (type === 'color') {
    return <ColorSelector value={safeValue} onChange={onChange} className={className} />;
  }

  const baseClass = `w-full px-4 py-3 rounded-lg border bg-white transition-all duration-300 
    focus:ring-2 focus:ring-yellow-400 focus:border-transparent focus:shadow-sm ${className}`;

  if (type === 'select') {
    return (
      <select 
        value={safeValue} 
        onChange={onChange} 
        className={`${baseClass} appearance-none bg-no-repeat bg-right pr-10 cursor-pointer`}
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1.5em 1.5em"
        }}
      >
        <option value="">{`Sélectionner ${label?.toLowerCase() || ''}`}</option>
        {options?.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (type === 'multiselect') {
    const selectedValues = Array.isArray(safeValue) ? safeValue : [];
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((val) => (
            <span
              key={val}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 transition-all duration-200 hover:bg-yellow-200"
            >
              {val}
              <button
                type="button"
                onClick={() => {
                  const newValues = selectedValues.filter(v => v !== val);
                  onChange({ target: { value: newValues } });
                }}
                className="ml-1.5 text-yellow-600 hover:text-yellow-900 transition-colors duration-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              const newValues = [...selectedValues, e.target.value];
              onChange({ target: { value: newValues } });
              e.target.value = '';
            }
          }}
          className={`${baseClass} appearance-none bg-no-repeat bg-right pr-10 cursor-pointer`}
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1.5em 1.5em"
          }}
        >
          <option value="">{`Ajouter ${label?.toLowerCase() || ''}`}</option>
          {options?.filter(opt => !selectedValues.includes(opt)).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <textarea
        value={safeValue}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseClass} min-h-[120px] resize-y transition-height duration-300 ease-in-out`}
      />
    );
  }

  return (
    <input
      type={type}
      value={safeValue}
      onChange={onChange}
      placeholder={placeholder}
      className={baseClass}
    />
  );
};

const CategoryCard = ({ category, config, selected, onClick }) => {
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 transform
        ${selected
          ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 shadow-lg scale-105'
          : 'bg-white border border-gray-200 hover:shadow-md hover:border-yellow-200 hover:scale-[1.02]'
        }
      `}
    >
      <div className="flex flex-col items-center space-y-3 py-1">
        <Icon className={`text-3xl ${selected ? 'text-yellow-600' : 'text-gray-600'} transition-colors duration-300`} />
        <span className={`font-medium text-sm text-center transition-colors duration-300 ${selected ? 'text-yellow-800' : 'text-gray-700'}`}>
          {config.label}
        </span>
      </div>
      {selected && (
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Icon className="absolute right-2 bottom-2 text-yellow-600 transform rotate-12 text-5xl" />
        </div>
      )}
    </div>
  );
};

// Enhanced color selector component
const ColorSelector = ({ value, onChange, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    <div className="grid grid-cols-7 gap-2 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange({ target: { value: color.label } })}
          className={`
            group relative w-10 h-10 rounded-full transition-all duration-300 
            ${value === color.label ? 'ring-2 ring-yellow-400 ring-offset-2 scale-110 z-10' : 'hover:scale-110 hover:shadow-md'}
            ${color.value === 'multicolor' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500' : ''}
          `}
          style={color.value !== 'multicolor' ? {
            backgroundColor: color.value,
            borderColor: color.value === '#FFFFFF' ? '#E5E7EB' : color.value,
            borderWidth: color.value === '#FFFFFF' ? '1px' : '0'
          } : {}}
        >
          <span className="sr-only">{color.label}</span>
          <div className="absolute -bottom-9 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-20 transition-opacity duration-200">
            <div className="px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap shadow-lg">
              {color.label}
            </div>
          </div>
        </button>
      ))}
    </div>
    {value && (
      <div className="flex items-center gap-2 px-2 py-1 bg-yellow-50 rounded-lg border border-yellow-100">
        <div 
          className="w-5 h-5 rounded-full" 
          style={{
            backgroundColor: COLOR_OPTIONS.find(c => c.label === value)?.value || '#999',
            borderColor: value === 'Blanc' ? '#E5E7EB' : 'transparent',
            borderWidth: value === 'Blanc' ? '1px' : '0'
          }}
        />
        <span className="text-sm text-yellow-800">{value}</span>
      </div>
    )}
  </div>
);

// Image upload preview component
const ImageUploadPreview = ({ images, onImageAdd, onImageRemove }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium text-gray-700  items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        Photos de l'objet
      </label>
      <label className="cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-gray-700">Ajouter une photo</span>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={onImageAdd}
        />
      </label>
    </div>

    {images.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div 
            key={index} 
            className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-yellow-400 transition-all duration-300 shadow-sm hover:shadow-md"
            style={{animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`}}
          >
            <img
              src={image.url}
              alt={`Preview ${index + 1}`}
              className="h-24 w-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onImageRemove(index);
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity transform hover:scale-110 z-20"
              aria-label="Remove image"
            >
              ×
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs px-3 py-1 rounded-full shadow-sm">
                Principal
              </span>
            )}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
          </div>
        ))}
      </div>
    )}

    <style jsx="true">{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
);

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve({
            file: compressedFile,
            url: canvas.toDataURL('image/jpeg', 0.7)
          });
        }, 'image/jpeg', 0.7);
      };
    };
  });
};

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  return (
    <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fadeIn">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      {error}
    </p>
  );
};

export default function ReportItem() {
  const navigate = useNavigate()
  const { user, isAuthenticated, refreshAuth } = useAuth()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isCategorySelected, setIsCategorySelected] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    subcategoryFields: {},
    type: 'lost',
    location: {
      type: 'Point',
      coordinates: [2.3522, 48.8566], 
      address: '',
      country: 'Morocco', // Add default country
      city: '' // Add city field
    },
    date: new Date().toISOString().split('T')[0],
    tags: [],
    images: [],
    status: 'active',
    reward: {
      offered: false,
      amount: 0,
      currency: 'EUR',
      description: ''
    },
    hasReward: false,
    showCustomDate: false,
    secretQuestion: {
      question: '',
      answer: ''
    }
  })

  const [validationState, setValidationState] = useState({
    title: { touched: false, error: '' },
    description: { touched: false, error: '' },
    category: { touched: false, error: '' },
    subcategory: { touched: false, error: '' },
    location: { touched: false, error: '' },
    date: { touched: false, error: '' },
    images: { touched: false, error: '' },
    secretQuestion: { touched: false, error: '' }
  });

  // Add authentication check when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        // Try to refresh auth state first
        await refreshAuth();
        
        // If still not authenticated, redirect to login
        if (!isAuthenticated) {
          // Store the current path so we can redirect back after login
          const returnUrl = encodeURIComponent(window.location.pathname);
          navigate(`/login?redirect=${returnUrl}`);
        }
      }
    };
    
    checkAuth();
  }, [isAuthenticated, navigate, refreshAuth]);

  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        if (!value?.trim()) return 'Le titre est requis';
        if (value.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères';
        if (value.trim().length > 100) return 'Le titre ne peut pas dépasser 100 caractères';
        break;
      case 'description':
        if (!value?.trim()) return 'La description est requise';
        if (value.trim().length < 10) return 'La description doit contenir au moins 10 caractères';
        if (value.trim().length > 2000) return 'La description ne peut pas dépasser 2000 caractères';
        break;
      case 'category':
        if (!value) return 'La catégorie est requise';
        break;
      case 'subcategory':
        if (formData.category && !value) return 'La sous-catégorie est requise';
        break;
      case 'location':
        if (!value.address?.trim()) return 'La localisation est requise';
        break;
      case 'date':
        if (!value) return 'La date est requise';
        if (new Date(value) > new Date()) return 'La date ne peut pas être dans le futur';
        break;
      case 'images':
        if (Array.isArray(value)) {
          if (value.length > 5) return 'Maximum 5 images autorisées';
          const invalidImages = value.filter(img => img.file.size > 5 * 1024 * 1024);
          if (invalidImages.length > 0) return 'Certaines images dépassent la taille maximale de 5MB';
        }
        break;
      case 'secretQuestion':
        if (formData.type === 'found') {
          if (!value.question?.trim()) return 'La question secrète est requise';
          if (!value.answer?.trim()) return 'La réponse à la question secrète est requise';
          if (value.question.trim().length < 10) return 'La question doit contenir au moins 10 caractères';
          if (value.answer.trim().length < 10) return 'La réponse doit contenir au moins 10 caractères';
        }
        break;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Check if user is authenticated before submitting
    if (!isAuthenticated) {
      setError("Vous devez être connecté pour signaler un objet");
      setLoading(false);
      
      // Store the current path so we can redirect back after login
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/login?redirect=${returnUrl}`);
      return;
    }

    console.log("Submitting form with authenticated user:", user);

    // Validate all fields
    const newValidationState = { ...validationState };
    let hasErrors = false;

    // Validate title
    newValidationState.title.touched = true;
    newValidationState.title.error = validateField('title', formData.title);
    if (newValidationState.title.error) hasErrors = true;

    // Validate description
    newValidationState.description.touched = true;
    newValidationState.description.error = validateField('description', formData.description);
    if (newValidationState.description.error) hasErrors = true;

    // Validate category
    newValidationState.category.touched = true;
    newValidationState.category.error = validateField('category', formData.category);
    if (newValidationState.category.error) hasErrors = true;

    // Validate subcategory
    newValidationState.subcategory.touched = true;
    newValidationState.subcategory.error = validateField('subcategory', formData.subcategory);
    if (newValidationState.subcategory.error) hasErrors = true;

    // Validate location
    newValidationState.location.touched = true;
    newValidationState.location.error = validateField('location', formData.location);
    if (newValidationState.location.error) hasErrors = true;

    // Validate date
    newValidationState.date.touched = true;
    newValidationState.date.error = validateField('date', formData.date);
    if (newValidationState.date.error) hasErrors = true;

    // Validate images
    newValidationState.images.touched = true;
    newValidationState.images.error = validateField('images', formData.images);
    if (newValidationState.images.error) hasErrors = true;

    // Validate secret question for found items
    if (formData.type === 'found') {
      newValidationState.secretQuestion.touched = true;
      newValidationState.secretQuestion.error = validateField('secretQuestion', formData.secretQuestion);
      if (newValidationState.secretQuestion.error) hasErrors = true;
    }

    // Update validation state
    setValidationState(newValidationState);

    // If there are validation errors, stop submission
    if (hasErrors) {
      setLoading(false);
      return;
    }

    try {
      // Process images if any
      const processedImages = formData.images.map(img => ({
        data: img.url.split(',')[1], 
        contentType: 'image/jpeg', 
        isMain: img === formData.images[0] 
      }));

      // Create item data with proper structure
      const itemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        subcategoryFields: Object.entries(formData.subcategoryFields).reduce((acc, [key, value]) => {
          if (Array.isArray(value)) {
            if (value.length > 0) acc[key] = value;
          } else if (value && String(value).trim() !== '') {
            acc[key] = String(value).trim();
          }
          return acc;
        }, {}),
        type: formData.type,
        location: {
          type: 'Point',
          coordinates: formData.location.coordinates,
          address: formData.location.address.trim(),
          country: formData.location.country,
          city: formData.location.city
        },
        date: new Date(formData.date).toISOString(),
        images: processedImages,
        status: 'posted',
        reward: formData.hasReward ? {
          amount: parseFloat(formData.reward.amount) || 0,
          currency: formData.reward.currency || 'EUR',
          description: formData.reward.description?.trim() || ''
        } : null,
        secretQuestion: formData.type === 'found' ? {
          question: formData.secretQuestion.question.trim(),
          answer: formData.secretQuestion.answer.trim()
        } : null,
        // Add user information explicitly with fallbacks
        reportedBy: user?._id || user?.id || user?.uid
      };

      console.log("Submitting item data:", JSON.stringify(itemData, null, 2));

      // Submit the item
      const response = await itemsService.createItem(itemData);
      
      console.log("Server response:", response);
      
      if (response.success) {
        // Show success message before redirecting
        alert("Votre signalement a été enregistré avec succès!");
        navigate('/dashboard');
      } else {
        // Handle specific error cases
        if (response.error === 'Authentication required') {
          // Try to refresh auth token and try again
          await refreshAuth();
          if (isAuthenticated) {
            // Retry submission after auth refresh
            console.log("Retrying submission after auth refresh");
            const retryResponse = await itemsService.createItem(itemData);
            console.log("Retry response:", retryResponse);
            if (retryResponse.success) {
              navigate('/dashboard');
              return;
            }
          }
          // If still failing, redirect to login
          const returnUrl = encodeURIComponent(window.location.pathname);
          navigate(`/login?redirect=${returnUrl}`);
          return;
        }
        
        setError(response.error || 'Échec de la création de l\'objet');
        console.error("Error details from server:", response);
      }
    } catch (err) {
      console.error('Error creating item:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Check for auth-related errors
      if (err.response?.status === 401) {
        // If unauthorized, redirect to login
        const returnUrl = encodeURIComponent(window.location.pathname);
        navigate(`/login?redirect=${returnUrl}`);
        return;
      }
      
      setError(err.message || 'Une erreur est survenue lors de la création de l\'objet');
    } finally {
      setLoading(false);
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index).map((img, i) => ({
        ...img,
        isMain: i === 0
      }))
    }));
  };

  const handleImageAdd = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate each file
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setValidationState(prev => ({
          ...prev,
          images: { touched: true, error: `L'image ${file.name} est trop volumineuse` }
        }));
        return false;
      }
      return true;
    });

    validFiles.forEach(async (file) => {
      try {
        const compressed = await compressImage(file);
        setFormData(prev => {
          const newImages = [...prev.images, {
            url: compressed.url,
            file: compressed.file,
            isMain: prev.images.length === 0
          }];

          const error = validateField('images', newImages);
          setValidationState(prev => ({
            ...prev,
            images: { touched: true, error }
          }));

          return { ...prev, images: newImages };
        });
      } catch (error) {
        console.error('Error compressing image:', error);
        setValidationState(prev => ({
          ...prev,
          images: { touched: true, error: 'Erreur lors du traitement de l\'image' }
        }));
      }
    });
  };

  // Add this function to render subcategory fields
  const renderSubcategoryFields = () => {
    if (!formData.category || !formData.subcategory) return null;

    const subcategory = CATEGORIES_CONFIG[formData.category]?.subcategories[formData.subcategory];
    if (!subcategory) return null;

    return (
      <div className="space-y-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200 shadow-sm animate-fadeIn transition-all duration-300">
        <h3 className="text-lg font-medium text-yellow-800 flex items-center gap-2">
          {subcategory.icon && <subcategory.icon className="text-yellow-600" />}
          {subcategory.label}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(subcategory.fields).map(([fieldKey, field], index) => (
            <div 
              key={fieldKey} 
              className="transition-all duration-300 transform"
              style={{animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`}}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <ModernInput
                type={field.type}
                label={field.label}
                value={formData.subcategoryFields[fieldKey] || (field.type === 'multiselect' ? [] : '')}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  subcategoryFields: {
                    ...prev.subcategoryFields,
                    [fieldKey]: e.target.value
                  }
                }))}
                options={field.options}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Show a message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v4m0-4H9m12 0v4m0-4h-3m-9 0H3m18 0h-3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Connexion requise</h2>
          <p className="text-gray-600">Vous devez être connecté pour signaler un objet perdu ou trouvé.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 font-medium"
          >
            Se connecter avec Google
          </button>
        </div>
      </div>
    );
  }

  // Function to handle category selection
  const handleCategorySelect = (key) => {
    setFormData(prev => ({
      ...prev,
      category: key,
      subcategory: '',
      subcategoryFields: {}
    }));
    
    setIsCategorySelected(true);
    
    if (validationState.category.touched) {
      const error = validateField('category', key);
      setValidationState(prev => ({
        ...prev,
        category: { ...prev.category, error }
      }));
    }
  };

  // Function to go back to category selection
  const handleBackToCategories = () => {
    setIsCategorySelected(false);
    // Clear the category selection when going back
    setFormData(prev => ({
      ...prev,
      category: '',
      subcategory: '',
      subcategoryFields: {}
    }));
  };

  // Function to handle location changes
  const handleLocationChange = (newLocation) => {
    setFormData(prev => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates: newLocation.coordinates,
        address: newLocation.address,
        country: newLocation.country || 'Morocco',
        city: newLocation.city || ''
      }
    }));
    
    if (validationState.location.touched) {
      const error = validateField('location', newLocation);
      setValidationState(prev => ({
        ...prev,
        location: { ...prev.location, error }
      }));
    }
  };

  // Function to handle location blur event
  const handleLocationBlur = () => {
    const error = validateField('location', formData.location);
    setValidationState(prev => ({
      ...prev,
      location: { touched: true, error }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-8 transition-all duration-300">
          {/* 1. Type Selection */}
          <div className="mb-6 animate-fadeIn">
            <label className="block text-lg font-medium text-gray-800 mb-3">
              Type d'objet *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="relative">
                <input
                  type="radio"
                  name="type"
                  value="lost"
                  checked={formData.type === 'lost'}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      type: e.target.value,
                      hasReward: false,
                      reward: null,
                      secretQuestion: { question: '', answer: '' }
                    }));
                  }}
                  className="sr-only"
                />
                <div className={`w-full py-4 text-center rounded-xl cursor-pointer transition-all duration-300 text-base font-medium ${
                  formData.type === 'lost'
                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 shadow-md text-yellow-700 border-2 border-yellow-300 transform scale-[1.02]'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-200 hover:text-yellow-600 hover:shadow-sm'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Perdu
                  </div>
                </div>
              </label>
              <label className="relative">
                <input
                  type="radio"
                  name="type"
                  value="found"
                  checked={formData.type === 'found'}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      type: e.target.value,
                      hasReward: false,
                      reward: null,
                      secretQuestion: { question: '', answer: '' }
                    }));
                  }}
                  className="sr-only"
                />
                <div className={`w-full py-4 text-center rounded-xl cursor-pointer transition-all duration-300 text-base font-medium ${
                  formData.type === 'found'
                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 shadow-md text-yellow-700 border-2 border-yellow-300 transform scale-[1.02]'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-200 hover:text-yellow-600 hover:shadow-sm'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Trouvé
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Date Selection */}
          <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FaCalendarAlt className="text-yellow-500" />
              Date de {formData.type === 'lost' ? 'perte' : 'trouvaille'} *
            </h2>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl shadow-inner space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (option.value === "custom") {
                        setFormData(prev => ({ ...prev, date: '', showCustomDate: true }));
                      } else {
                        setFormData(prev => ({ ...prev, date: option.value, showCustomDate: false }));
                      }
                    }}
                    className={`
                      p-4 rounded-xl text-sm font-medium transition-all duration-300 transform
                      ${(formData.date === option.value || (option.value === "custom" && formData.showCustomDate))
                        ? 'bg-white text-yellow-800 border-2 border-yellow-300 shadow-md scale-[1.02]'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-yellow-200 hover:shadow hover:scale-[1.01]'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {formData.showCustomDate && (
                <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-yellow-200 shadow-sm transition-all duration-300 animate-fadeIn">
                  <FaCalendarAlt className="text-yellow-500" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="flex-1 p-2 rounded-md border-0 focus:ring-2 focus:ring-yellow-300 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Location - Using the new LocationField component */}
          <LocationField 
            location={formData.location}
            onChange={handleLocationChange}
            onBlur={handleLocationBlur}
            validationState={validationState.location}
          />

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 4. Title */}
            <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.3s" }}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Titre *
              </h2>
              <div className={`bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl shadow-inner ${
                validationState.title.touched && validationState.title.error ? 'border-2 border-red-300' : ''
              }`}>
                <ModernInput
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData(prev => ({ ...prev, title: newValue }));
                    if (validationState.title.touched) {
                      const error = validateField('title', newValue);
                      setValidationState(prev => ({
                        ...prev,
                        title: { ...prev.title, error }
                      }));
                    }
                  }}
                  onBlur={() => {
                    const error = validateField('title', formData.title);
                    setValidationState(prev => ({
                      ...prev,
                      title: { touched: true, error }
                    }));
                  }}
                  placeholder="Décrivez brièvement l'objet"
                  className={`text-lg ${validationState.title.touched && validationState.title.error
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-transparent'
                    }`}
                />
              </div>
              <ErrorMessage error={validationState.title.touched && validationState.title.error} />
            </div>

            {/* 5. Category Selection */}
            <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.4s" }}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Catégorie *
              </h2>
              
              <div className={`${validationState.category.touched && validationState.category.error
                  ? 'border-2 border-red-300 rounded-xl p-4'
                  : ''
                }`}>
                
                {!isCategorySelected ? (
                  // Show all categories when none is selected
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(CATEGORIES_CONFIG).map(([key, config], index) => (
                      <div 
                        key={key} 
                        style={{
                          animation: `fadeInUp 0.3s ease-out ${0.1 + index * 0.05}s both`,
                          transitionDelay: `${index * 0.05}s`
                        }}
                      >
                        <CategoryCard
                          category={key}
                          config={config}
                          selected={formData.category === key}
                          onClick={() => handleCategorySelect(key)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show only selected category with back button
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleBackToCategories}
                      className="mb-4 flex items-center gap-2 text-yellow-600 hover:text-yellow-700 transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-yellow-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Changer de catégorie
                    </button>
                    
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-5 shadow-md border border-yellow-200 animate-fadeIn">
                      {formData.category && (
                        <div className="flex items-center gap-3">
                          {CATEGORIES_CONFIG[formData.category].icon && (
                            <div className="p-3 bg-white rounded-full shadow-sm">
                              {React.createElement(CATEGORIES_CONFIG[formData.category].icon, {
                                className: "text-2xl text-yellow-600"
                              })}
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-medium text-yellow-800">
                              {CATEGORIES_CONFIG[formData.category].label}
                            </h3>
                            <p className="text-sm text-yellow-700">
                              Sélectionnez maintenant une sous-catégorie
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <ErrorMessage error={validationState.category.touched && validationState.category.error} />
              <style jsx="true">{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(15px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>

            {/* 6. Subcategory Selection */}
            {formData.category && (
              <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.5s" }}>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  Sous-catégorie *
                </h2>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${validationState.subcategory.touched && validationState.subcategory.error
                    ? 'border-2 border-red-300 rounded-xl p-4'
                    : ''
                  }`}>
                  {Object.entries(CATEGORIES_CONFIG[formData.category].subcategories).map(([key, config], index) => (
                    <div 
                      key={key}
                      className="transition-all duration-300" 
                      style={{
                        animation: `fadeInRight 0.3s ease-out ${0.1 + index * 0.1}s both`
                      }}
                    >
                      <div
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            subcategory: key,
                            subcategoryFields: {}
                          }));
                          if (validationState.subcategory.touched) {
                            const error = validateField('subcategory', key);
                            setValidationState(prev => ({
                              ...prev,
                              subcategory: { ...prev.subcategory, error }
                            }));
                          }
                        }}
                        className={`
                          p-4 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 transform
                          ${formData.subcategory === key
                            ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 shadow-md scale-[1.02]'
                            : 'bg-white border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 hover:shadow-sm hover:scale-[1.01]'
                          }
                        `}
                      >
                        <div className={`p-2 rounded-full ${formData.subcategory === key ? 'bg-yellow-200' : 'bg-gray-100'} transition-colors duration-300`}>
                          {config.icon && <config.icon className={`text-xl ${formData.subcategory === key ? 'text-yellow-700' : 'text-gray-600'} transition-colors duration-300`} />}
                        </div>
                        <span className={`font-medium transition-colors duration-300 ${formData.subcategory === key ? 'text-yellow-800' : 'text-gray-700'}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <ErrorMessage error={validationState.subcategory.touched && validationState.subcategory.error} />
                <style jsx="true">{`
                  @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(-15px); }
                    to { opacity: 1; transform: translateX(0); }
                  }
                `}</style>
              </div>
            )}

            {/* 7. Subcategory Fields */}
            {renderSubcategoryFields()}

            {/* 8. Description */}
            <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.6s" }}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Description détaillée *
              </h2>
              <div className={`bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl shadow-inner ${validationState.description.touched && validationState.description.error
                  ? 'border-2 border-red-300'
                  : ''
                }`}>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData(prev => ({ ...prev, description: newValue }));
                    if (validationState.description.touched) {
                      const error = validateField('description', newValue);
                      setValidationState(prev => ({
                        ...prev,
                        description: { ...prev.description, error }
                      }));
                    }
                  }}
                  onBlur={() => {
                    const error = validateField('description', formData.description);
                    setValidationState(prev => ({
                      ...prev,
                      description: { touched: true, error }
                    }));
                  }}
                  placeholder="Donnez plus de détails sur l'objet (caractéristiques distinctives, circonstances, etc.)"
                  rows={5}
                  className={`w-full px-4 py-3 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm ${validationState.description.touched && validationState.description.error
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-transparent focus:ring-yellow-400 focus:shadow'
                    }`}
                />
              </div>
              <ErrorMessage error={validationState.description.touched && validationState.description.error} />
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>{formData.description.length}/2000 caractères</span>
              </div>
            </div>

            {/* 9. Pictures */}
            <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.7s" }}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Photos
              </h2>
              <div className={`bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl shadow-inner ${validationState.images.touched && validationState.images.error
                  ? 'border-2 border-red-300'
                  : ''
                }`}>
                <ImageUploadPreview
                  images={formData.images}
                  onImageAdd={handleImageAdd}
                  onImageRemove={handleImageRemove}
                />
              </div>
              <ErrorMessage error={validationState.images.touched && validationState.images.error} />
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>{formData.images.length}/5 images (max 5MB par image)</span>
              </div>
            </div>

            {/* Reward Toggle and Section */}
            {formData.type === 'lost' && (
              <div className="mb-6 bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg animate-fadeIn" style={{ animationDelay: "0.8s" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-100">
                      <span className="text-xl">🎁</span>
                    </div>
                    <div>
                      <h3 className="text-gray-800 font-semibold">Récompense</h3>
                      <p className="text-gray-500 text-sm">Offrir une récompense peut augmenter les chances de retrouver l'objet</p>
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
                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer dark:bg-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700 transition-colors duration-200">
                      {formData.hasReward ? 'Activée' : 'Désactivée'}
                    </span>
                  </label>
                </div>

                {formData.hasReward && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 text-sm mb-1.5 font-medium">
                          Montant
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
                            className={`w-full pl-8 pr-4 py-2.5 rounded-lg focus:ring-2 transition-all duration-300 ${formData.reward?.amount < 0
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border border-gray-300 focus:ring-yellow-400 focus:border-yellow-400'
                              }`}
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
                        {formData.reward?.amount < 0 && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1 animate-fadeIn">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Le montant ne peut pas être négatif
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1.5 font-medium">
                          Devise
                        </label>
                        <select
                          className="w-full py-2.5 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                          style={{
                            backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                            backgroundPosition: "right 0.75rem center",
                            backgroundSize: "1.5em 1.5em"
                          }}
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

                    {/* Tips Section */}
                    <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="font-medium">Conseils pour la récompense</span>
                      </div>
                      <ul className="space-y-2 ml-6 list-disc text-blue-700">
                        <li className="transition-all duration-200 hover:translate-x-1">Choisissez un montant raisonnable et approprié</li>
                        <li className="transition-all duration-200 hover:translate-x-1">La récompense n'est pas obligatoire</li>
                        <li className="transition-all duration-200 hover:translate-x-1">Vous pourrez modifier le montant plus tard</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Secret Question Section for Found Items */}
            {formData.type === 'found' && (
              <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.8s" }}>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1v-1H4a2 2 0 01-2-2V8a2 2 0 012-2h2v-1l1-1 1-1h2l1 1 1 1v1h2a2 2 0 012 2z" clipRule="evenodd" />
                  </svg>
                  Question Secrète *
                </h2>
                <div className="bg-blue-50 p-5 rounded-xl mb-4 shadow-inner border border-blue-100 transition-all duration-300 hover:shadow-md hover:border-blue-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1.5 bg-blue-100 rounded-full">
                      <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Pourquoi une question secrète ?</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Cette question aidera à vérifier que la personne qui réclame l'objet en est bien le propriétaire. Choisissez une question dont seul le propriétaire connaîtrait la réponse.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Question
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={formData.secretQuestion.question}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            secretQuestion: {
                              ...prev.secretQuestion,
                              question: newValue
                            }
                          }));
                          if (validationState.secretQuestion.touched) {
                            const error = validateField('secretQuestion', {
                              ...formData.secretQuestion,
                              question: newValue
                            });
                            setValidationState(prev => ({
                              ...prev,
                              secretQuestion: { ...prev.secretQuestion, error }
                            }));
                          }
                        }}
                        onBlur={() => {
                          const error = validateField('secretQuestion', formData.secretQuestion);
                          setValidationState(prev => ({
                            ...prev,
                            secretQuestion: { touched: true, error }
                          }));
                        }}
                        className={`mt-1 block w-full rounded-lg shadow-sm py-3 px-4 transition-all duration-300 ${
                          validationState.secretQuestion.touched && validationState.secretQuestion.error
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-yellow-400 focus:border-yellow-400'
                        }`}
                        placeholder="Ex: Quelle est la marque et le modèle exact de l'objet ?"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Réponse
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={formData.secretQuestion.answer}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            secretQuestion: {
                              ...prev.secretQuestion,
                              answer: newValue
                            }
                          }));
                          if (validationState.secretQuestion.touched) {
                            const error = validateField('secretQuestion', {
                              ...formData.secretQuestion,
                              answer: newValue
                            });
                            setValidationState(prev => ({
                              ...prev,
                              secretQuestion: { ...prev.secretQuestion, error }
                            }));
                          }
                        }}
                        onBlur={() => {
                          const error = validateField('secretQuestion', formData.secretQuestion);
                          setValidationState(prev => ({
                            ...prev,
                            secretQuestion: { touched: true, error }
                          }));
                        }}
                        className={`mt-1 block w-full rounded-lg shadow-sm py-3 px-4 transition-all duration-300 ${
                          validationState.secretQuestion.touched && validationState.secretQuestion.error
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-yellow-400 focus:border-yellow-400'
                        }`}
                        placeholder="La réponse exacte attendue"
                      />
                    </div>
                  </div>
                </div>

                <ErrorMessage error={validationState.secretQuestion.touched && validationState.secretQuestion.error} />
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end pt-6 animate-fadeIn" style={{ animationDelay: "1s" }}>
              <button
                type="submit"
                disabled={loading}
                className={`
                  inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-md text-white
                  transition-all duration-300
                  ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 hover:shadow-lg transform hover:-translate-y-0.5'
                  }
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi en cours...
                  </>
                ) : (
                  <div className="flex items-center">
                    <span>Soumettre le Rapport</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>

            <style jsx="true">{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fadeIn {
                animation: fadeIn 0.6s ease-out both;
              }
            `}</style>
          </form>
        </div>
      </div>
    </div>
  )
}
