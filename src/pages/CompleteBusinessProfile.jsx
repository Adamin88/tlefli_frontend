import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const CompleteBusinessProfile = () => {
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessAddress: '',
    businessPhone: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    // Pre-fill form with existing data if available
    if (user) {
      setFormData({
        businessName: user.businessName || '',
        businessType: user.businessType || '',
        businessAddress: user.businessAddress || '',
        businessPhone: user.businessPhone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({ ...prev, businessPhone: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.businessName || !formData.businessType || !formData.businessAddress) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        setIsLoading(false);
        return;
      }

      // Add profileCompleted flag and ensure phone field is null for business users
      const updatedData = {
        ...formData,
        profileCompleted: true,
        phone: null // Explicitly set phone to null for business users
      };

      console.log('Updating business profile with data:', JSON.stringify(updatedData, null, 2));

      const response = await authService.updateUser(updatedData);
      console.log('Business profile update response:', response);

      if (response.success) {
        toast.success('Profil professionnel complété avec succès');
        setSubmitSuccess(true);
        
        // Force immediate refresh of auth state
        try {
          const refreshResult = await refreshAuth();
          console.log('Auth refresh result after profile completion:', refreshResult);
        } catch (refreshError) {
          console.error('Auth refresh error:', refreshError);
        }
        
        // Increase timeout to 4 seconds (4000ms) to ensure message is visible longer
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          // Use replace to clear navigation history
          navigate('/dashboard', { replace: true });
        }, 4000); // Increased to 4 seconds
      } else {
        toast.error(response.error || 'Une erreur est survenue lors de la mise à jour');
        console.error('Business profile update failed:', response.error);
      }
    } catch (error) {
      console.error('Error completing business profile:', error);
      toast.error('Échec de la mise à jour du profil professionnel');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, isLoading]);

  // Add an effect for successful submission that forces redirect
  useEffect(() => {
    if (submitSuccess) {
      const redirectTimer = setTimeout(() => {
        console.log('Backup redirect to dashboard triggered');
        navigate('/dashboard', { replace: true });
      }, 4000); // Increased to 4 seconds for backup redirect
      
      return () => clearTimeout(redirectTimer);
    }
  }, [submitSuccess, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Complétez votre profil professionnel</h2>
        </div>

        {submitSuccess ? (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Profil professionnel complété avec succès</h3>
            <p className="mt-2 text-sm text-gray-500">Redirection vers votre tableau de bord...</p>
            <div className="mt-4 animate-pulse">
              <div className="h-2 w-20 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Nom de l'entreprise *
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                value={formData.businessName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                Type d'entreprise *
              </label>
              <select
                id="businessType"
                name="businessType"
                required
                value={formData.businessType}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="" disabled>Sélectionnez un type</option>
                <option value="Transport">Transport (Bus, Train, Taxi...)</option>
                <option value="Commerce">Commerce</option>
                <option value="Hôtellerie">Hôtellerie</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Administration">Administration</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
                Adresse *
              </label>
              <input
                id="businessAddress"
                name="businessAddress"
                type="text"
                required
                value={formData.businessAddress}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700">
                Téléphone *
              </label>
              <div className="mt-1">
                <PhoneInput
                  specialLabel=""
                  country={'ma'}
                  value={formData.businessPhone}
                  onChange={handlePhoneChange}
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-300"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Chargement...
                  </span>
                ) : (
                  "Terminer l'inscription"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompleteBusinessProfile;
