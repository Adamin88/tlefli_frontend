import React, { useState, useEffect } from 'react';
import itemsService from '../services/itemsService';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const SecretAnswersSection = ({ item }) => {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnswers = async () => {
    try {
      console.log('Fetching answers for item:', item._id);
      const response = await itemsService.getSecretAnswers(item._id);
      console.log('Received answers:', {
        count: response.answers?.length || 0,
        answers: response.answers
      });
      
      // Use the answers array from the response
      setAnswers(response.answers || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching answers:', err);
      setError('Failed to load secret answers');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (item?.type === 'found' && item?.secretQuestion) {
      console.log('Initial answers fetch for item:', item._id);
      fetchAnswers();
    } else {
      // Make sure we're not showing loading state if there's no need to fetch
      setLoading(false);
    }
  }, [item]);

  // Set up polling for updates
  useEffect(() => {
    if (item?.type === 'found' && item?.secretQuestion) {
      console.log('Setting up polling for item:', item._id);
      const interval = setInterval(() => {
        console.log('Polling for new answers...');
        fetchAnswers();
      }, 5000);
      return () => {
        console.log('Cleaning up polling interval');
        clearInterval(interval);
      };
    }
  }, [item]);

  const handleVerifyAnswer = async (answerId, isCorrect) => {
    try {
      await itemsService.verifySecretAnswer(item._id, answerId, isCorrect);
      
      // Refresh the answers list
      await fetchAnswers();

    } catch (err) {
      console.error('Une erreur est survenue lors de la vérification');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des réponses...</div>;
  }
  
  if (error) {
    return <div className="text-red-600 py-4">{error}</div>;
  }
  
  // Return null instead of undefined when no answers
  if (!answers || !answers.length) {
    return null;
  }

  return (
    <div className="mt-6 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Réponses à la question secrète
        </h3>
        <div className="mt-4 space-y-4">
          {answers.map((answer) => (
            <div
              key={answer._id}
              className={`border rounded-lg p-4 ${
                answer.verified
                  ? answer.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">
                    Réponse de {answer.user?.name || `${answer.user?.firstName || ''} ${answer.user?.lastName || ''}`}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {answer.answer}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(answer.createdAt).toLocaleString()}
                  </p>
                </div>
                {!answer.verified && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerifyAnswer(answer._id, true)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => handleVerifyAnswer(answer._id, false)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Refuser
                    </button>
                  </div>
                )}
                {answer.verified && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      answer.isCorrect
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {answer.isCorrect ? 'Validée' : 'Refusée'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecretAnswersSection;
