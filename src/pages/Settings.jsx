import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { CameraIcon, BuildingOfficeIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import authService from '../services/authService'

function IndividualProfile({ formData, handleChange, handlePhoneChange, loading, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Informations Personnelles
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Gérez vos informations personnelles
        </p>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            Prénom
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Nom
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
          />
        </div>

        {/* Email field removed */}

        {/* Add Address field */}
        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Adresse
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            value={formData.address}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Téléphone
          </label>
          <div className="mt-1">
            <PhoneInput
              specialLabel=""
              country={'ma'}
              value={formData.phone}
              onChange={(value) => handlePhoneChange(value, 'phone')}
              inputProps={{
                name: 'phone',
                id: 'phone',
                required: true,
              }}
              containerClass="phone-input-container"
              inputClass="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              buttonClass="phone-input-button border border-gray-300 bg-gray-50"
              dropdownClass="phone-input-dropdown"
              enableSearch={true}
              disableSearchIcon={false}
              searchPlaceholder="Rechercher un pays..."
              containerStyle={{
                width: '100%',
              }}
              buttonStyle={{
                border: '1px solid #D1D5DB',
                borderRight: 'none',
                backgroundColor: '#F9FAFB',
                borderTopLeftRadius: '0.375rem',
                borderBottomLeftRadius: '0.375rem',
              }}
              inputStyle={{
                width: '100%',
                height: '38px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function BusinessProfile({ formData, handleChange, handlePhoneChange, loading, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Profil Professionnel
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Gérez les informations de votre entreprise
        </p>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
            Nom de l'entreprise
          </label>
          <input
            type="text"
            name="businessName"
            id="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
            Type d'entreprise
          </label>
          <select
            id="businessType"
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
          >
            <option value="">Sélectionnez un type</option>
            <option value="Transport">Transport (Bus, Train, Taxi...)</option>
            <option value="Commerce">Commerce</option>
            <option value="Hôtellerie">Hôtellerie</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Administration">Administration</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div>
          <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700">
            Téléphone professionnel
          </label>
          <div className="mt-1">
            <PhoneInput
              specialLabel=""
              country={'ma'}
              value={formData.businessPhone}
              onChange={(value) => handlePhoneChange(value, 'businessPhone')}
              inputProps={{
                name: 'businessPhone',
                id: 'businessPhone',
                required: true,
              }}
              containerClass="phone-input-container"
              inputClass="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              buttonClass="phone-input-button border border-gray-300 bg-gray-50"
              dropdownClass="phone-input-dropdown"
              enableSearch={true}
              disableSearchIcon={false}
              searchPlaceholder="Rechercher un pays..."
              containerStyle={{
                width: '100%',
              }}
              buttonStyle={{
                border: '1px solid #D1D5DB',
                borderRight: 'none',
                backgroundColor: '#F9FAFB',
                borderTopLeftRadius: '0.375rem',
                borderBottomLeftRadius: '0.375rem',
              }}
              inputStyle={{
                width: '100%',
                height: '38px',
              }}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
            Adresse de l'entreprise
          </label>
          <textarea
            id="businessAddress"
            name="businessAddress"
            rows={3}
            value={formData.businessAddress}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
          />
        </div>

        {/* Email field removed */}
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, loading, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formInitialized, setFormInitialized] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    avatar: '',
    firstName: '',
    lastName: '',
    address: '',
    businessName: '',
    businessType: '',
    businessAddress: '',
    businessPhone: '',
  });

  // Force auth refresh when component mounts with additional debug logging
  useEffect(() => {
    console.log('Settings: Component mounted, refreshing auth');
    const initAuth = async () => {
      try {
        await refreshAuth();
        console.log('Settings: Auth refreshed, user data after refresh:', user);
      } catch (error) {
        console.error('Settings: Error refreshing auth', error);
      }
    };
    initAuth();
  }, []);

  // Initialize form data when user data becomes available
  useEffect(() => {
    if (!loading && user && !formInitialized) {
      // Add detailed logging specifically for address
      console.log('Settings: Full user data:', JSON.stringify(user, null, 2));
      
      // Create a shallow copy of user for debugging to avoid console refs
      const userDebug = {...user};
      console.log('Settings: User data copy:', userDebug);
      console.log('Settings: Address field explicitly:', user.address);
      
      // Create a safely initialized formData object
      const initialFormData = {
        // Common fields
        email: user.email || '',
        
        // Individual fields with explicit logging for address
        firstName: user.userType === 'individual' ? (user.firstName || '') : '',
        lastName: user.userType === 'individual' ? (user.lastName || '') : '',
        phone: user.phone || '',
        avatar: user.avatar || '',

        // Very explicitly handle the address field with fallbacks
        address: user.userType === 'individual' 
          ? (user.address !== undefined ? user.address : '')
          : '',
        
        // Business fields
        businessName: user.userType === 'business' ? (user.businessName || '') : '',
        businessType: user.userType === 'business' ? (user.businessType || '') : '',
        businessAddress: user.userType === 'business' ? (user.businessAddress || '') : '',
        businessPhone: user.userType === 'business' ? (user.businessPhone || '') : '',
        
        // Avatar handling
        avatar: user.avatar || user.picture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      };
      
      console.log('Settings: Form initialization complete with address =', initialFormData.address);
      
      setFormData(initialFormData);
      setFormInitialized(true);
      setPageLoading(false);
    } else if (!loading && !user) {
      console.log('Settings: User data not available after loading');
      setPageLoading(false);
    }
  }, [user, loading, formInitialized]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePhoneChange = (value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Add detailed logging for the update data
      console.log('Submitting profile update with user type:', user.userType);
      console.log('Form data being submitted:', formData);
      
      // Create a copy of formData and ensure proper formatting
      const dataToSubmit = { ...formData };
      
      // Make sure address is explicitly included for individual users
      if (user.userType === 'individual') {
        dataToSubmit.address = formData.address || '';
        console.log('Ensuring address is included:', dataToSubmit.address);
      }
      
      // Make sure we're sending the correct user type
      dataToSubmit.userType = user.userType;
      
      console.log('Final data to submit:', dataToSubmit);
      
      const response = await authService.updateUser(dataToSubmit);
      console.log('Profile update response:', response);
      
      if (response.success) {
        // Update succeeded, show success message
        setMessage({
          type: 'success',
          text: 'Profil mis à jour avec succès!'
        });
        
        // Force auth refresh to update user data throughout app
        await refreshAuth();
      } else {
        throw new Error(response.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erreur lors de la mise à jour du profil'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Show loading spinner while authentication status is being checked
  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos informations...</p>
        </div>
      </div>
    );
  }

  // Check if user data is available
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erreur d'authentification!</strong>
            <span className="block sm:inline"> Votre session a expiré. Veuillez vous reconnecter.</span>
            <button 
              onClick={() => navigate('/login')}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          {user?.userType === 'business' ? (
            <BuildingOfficeIcon className="h-8 w-8 text-gray-900" />
          ) : (
            <UserIcon className="h-8 w-8 text-gray-900" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.userType === 'business' ? 'Paramètres Professionnels' : 'Paramètres du Compte'}
          </h1>
        </div>

        {message.text && (
          <div
            className={`mb-4 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Photo de profil</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Cette photo sera affichée sur votre profil
                </p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={formData.avatar}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-sm border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                  >
                    <CameraIcon className="h-4 w-4 text-gray-400" />
                    <input
                      type="file"
                      id="avatar-upload"
                      name="avatar"
                      className="sr-only"
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Render appropriate profile section based on user type */}
            {user?.userType === 'business' ? (
              <BusinessProfile 
                formData={formData} 
                handleChange={handleChange}
                handlePhoneChange={handlePhoneChange}
                loading={formLoading} 
              />
            ) : (
              <IndividualProfile 
                formData={formData} 
                handleChange={handleChange}
                handlePhoneChange={handlePhoneChange}
                loading={formLoading} 
              />
            )}

            {/* Save Button */}
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  {formLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </form>

          {/* Security section removed */}
        </div>
      </div>
    </div>
  )
}

