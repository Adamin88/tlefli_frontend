import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import itemsService from '../services/itemsService';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

export default function SecretAnswerVerification({ answer, answers, item, onVerificationComplete }) {
  const navigate = useNavigate();
  const [selectedAnswerId, setSelectedAnswerId] = useState(answer?._id || null);
  const [activeAnswers, setActiveAnswers] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    incorrect: false,
    correct: false
  });
  const [error, setError] = useState(null);

  // Initialize with either a single answer or multiple answers
  useEffect(() => {
    if (answers && answers.length > 0) {
      setActiveAnswers(answers);
      
      // Find first pending answer, if any
      const firstPending = answers.find(a => !a.verified);
      if (firstPending) {
        setSelectedAnswerId(firstPending._id);
      } else if (!selectedAnswerId && answers[0]?._id) {
        setSelectedAnswerId(answers[0]._id);
      }
    } else if (answer) {
      setActiveAnswers([answer]);
      setSelectedAnswerId(answer._id);
    }
  }, [answer, answers, selectedAnswerId]);

  // Get the currently selected answer
  const currentAnswer = activeAnswers.find(a => a._id === selectedAnswerId) || activeAnswers[0];

  // Group answers by verification status
  const groupedAnswers = {
    pending: activeAnswers.filter(a => !a.verified),
    correct: activeAnswers.filter(a => a.verified && a.isCorrect),
    incorrect: activeAnswers.filter(a => a.verified && !a.isCorrect)
  };

  const handleVerification = async (isCorrect) => {
    if (!currentAnswer) {
      toast.error("Aucune réponse sélectionnée");
      return;
    }
    
    try {
      if (!item?._id || !currentAnswer?._id) {
        console.error('Missing required IDs:', { 
          itemId: item?._id, 
          answerId: currentAnswer?._id 
        });
        toast.error('IDs d\'objet ou de réponse manquants');
        return;
      }

      setIsVerifying(true);
      setError(null);

      // Convert IDs to strings to ensure consistent formatting
      const itemId = String(item._id);
      const answerId = String(currentAnswer._id);

      console.log('Verifying answer with params:', {
        itemId,
        answerId,
        isCorrect
      });

      const response = await itemsService.verifySecretAnswer(
        itemId,
        answerId,
        isCorrect
      );
      
      if (response.success) {
        // Display appropriate message
        if (isCorrect) {
          toast.success('Réponse marquée comme correcte. L\'objet est maintenant authentifié.');
        } else {
          toast.success('Réponse marquée comme incorrecte. Le jumelage a été annulé et les deux objets sont retournés au statut "publié".');
        }
        
        // Update the current answer status in the UI
        setActiveAnswers(prev => 
          prev.map(ans => {
            if (ans._id === currentAnswer._id) {
              return { 
                ...ans, 
                verified: true, 
                isCorrect,
                verifiedAt: new Date() 
              };
            }
            return ans;
          })
        );
        
        // Call the provided callback if it exists
        if (onVerificationComplete) {
          // Pass the result status, untwinned flag, and statusReset flag
          const untwinned = !isCorrect;
          const statusReset = !isCorrect;
          
          // IMPORTANT: For correct answers, we need to update both items to 'authenticated'
          if (isCorrect) {
            // Update the local item status to authenticated
            if (item) {
              item.status = 'authenticated';
            }
            
            // If twin item info is available, update it too
            if (item?.twin?.item) {
              item.twin.item.status = 'authenticated';
            }
          }
          
          onVerificationComplete(isCorrect, currentAnswer._id, untwinned, statusReset);
        }

        // If we just verified the last pending answer, expand the relevant section
        if (groupedAnswers.pending.length === 1) {
          setExpandedSections({
            ...expandedSections,
            pending: false,
            [isCorrect ? 'correct' : 'incorrect']: true
          });
        }
      } else {
        throw new Error(response.error || 'La vérification a échoué');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      
      // Enhanced error handling to provide more specific messages
      let errorMessage = 'Erreur lors de la vérification';
      
      if (error.response?.status === 403) {
        errorMessage = 'Vous n\'êtes pas autorisé à vérifier cette réponse. Seul le propriétaire de l\'objet peut le faire.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // Toggle a section's expanded state
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // If no answers or item, don't render anything
  if (!activeAnswers.length || !item) {
    return (
      <div className="bg-white shadow sm:rounded-lg mb-4 p-6">
        <p className="text-gray-500">Aucune réponse à vérifier.</p>
      </div>
    );
  }

  // Render a single answer card in compact form
  const renderAnswerCard = (answer, isSelected) => {
    const statusColor = answer.verified 
      ? (answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
      : 'bg-yellow-50 border-yellow-200';
    
    return (
      <div 
        key={answer._id}
        className={`mb-2 p-3 rounded-md cursor-pointer border ${statusColor} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setSelectedAnswerId(answer._id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <UserCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
            <div>
              <p className="font-medium">{answer.user?.firstName} {answer.user?.lastName}</p>
              <p className="text-xs text-gray-500">
                Soumise le {new Date(answer.submittedAt).toLocaleDateString('fr-FR')} à {new Date(answer.submittedAt).toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>
          <div>
            {answer.verified ? (
              answer.isCorrect 
                ? <CheckCircleIcon className="h-5 w-5 text-green-500" />
                : <XCircleIcon className="h-5 w-5 text-red-500" />
            ) : (
              <ClockIcon className="h-5 w-5 text-yellow-500" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render a section with collapsible answers
  const renderSection = (title, answers, sectionKey, icon, bgColor) => {
    if (!answers.length) return null;
    
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className={`mb-6 border rounded-md ${bgColor}`}>
        <button 
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 flex items-center justify-between border-b focus:outline-none"
        >
          <div className="flex items-center text-left">
            {icon}
            <span className="ml-2 font-medium">
              {title} <span className="text-sm font-normal">({answers.length})</span>
            </span>
          </div>
          {isExpanded 
            ? <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            : <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          }
        </button>
        
        {isExpanded && (
          <div className="p-4">
            {answers.map(ans => renderAnswerCard(ans, ans._id === selectedAnswerId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow sm:rounded-lg mb-4 p-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
        Vérification des réponses à la question secrète
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Answer sections */}
        <div className="col-span-1">
          {renderSection(
            "Réponses en attente", 
            groupedAnswers.pending, 
            "pending", 
            <ClockIcon className="h-5 w-5 text-yellow-500" />,
            "bg-yellow-50"
          )}
          
          {renderSection(
            "Réponses correctes", 
            groupedAnswers.correct, 
            "correct",
            <CheckCircleIcon className="h-5 w-5 text-green-500" />,
            "bg-green-50"
          )}
          
          {renderSection(
            "Réponses incorrectes", 
            groupedAnswers.incorrect, 
            "incorrect",
            <XCircleIcon className="h-5 w-5 text-red-500" />,
            "bg-red-50"
          )}
          
          {/* Answer count summary */}
          <div className="text-sm text-gray-500 mt-4">
            Total: {activeAnswers.length} réponse{activeAnswers.length > 1 ? 's' : ''}
          </div>
        </div>
        
        {/* Right column - Selected answer details */}
        {currentAnswer && (
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Original Secret Question & Answer */}
              <div className="bg-blue-50 p-5 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">Question et réponse originale</h4>
                
                <div className="mb-4">
                  <p className="font-medium text-blue-700 mb-1">Question secrète:</p>
                  <div className="bg-white p-3 rounded border border-blue-200 text-blue-800 whitespace-pre-wrap">
                    {item.secretQuestion?.question || "Aucune question définie"}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="font-medium text-blue-700 mb-1">Réponse attendue:</p>
                  <div className="bg-white p-3 rounded border border-blue-200 text-blue-800 whitespace-pre-wrap">
                    {item.secretQuestion?.answer || "Aucune réponse définie"}
                  </div>
                </div>
              </div>
              
              {/* Right Column: User's Submitted Answer */}
              <div className={`p-5 rounded-lg ${
                currentAnswer.verified 
                  ? (currentAnswer.isCorrect ? 'bg-green-50' : 'bg-red-50') 
                  : 'bg-yellow-50'
              }`}>
                <h4 className="font-semibold mb-3 flex items-center justify-between">
                  <span className={
                    currentAnswer.verified 
                      ? (currentAnswer.isCorrect ? 'text-green-800' : 'text-red-800') 
                      : 'text-yellow-800'
                  }>
                    Réponse de {currentAnswer.user?.firstName} {currentAnswer.user?.lastName}
                  </span>
                  
                  {currentAnswer.verified && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                      currentAnswer.isCorrect 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentAnswer.isCorrect ? 'Correcte' : 'Incorrecte'}
                    </span>
                  )}
                </h4>
                
                <div className="mb-4">
                  <p className={`font-medium mb-1 ${
                    currentAnswer.verified 
                      ? (currentAnswer.isCorrect ? 'text-green-700' : 'text-red-700') 
                      : 'text-yellow-700'
                  }`}>
                    Réponse soumise:
                  </p>
                  <div className={`p-3 rounded border whitespace-pre-wrap ${
                    currentAnswer.verified 
                      ? (currentAnswer.isCorrect 
                          ? 'bg-white border-green-200 text-green-800' 
                          : 'bg-white border-red-200 text-red-800')
                      : 'bg-white border-yellow-200 text-yellow-800'
                  }`}>
                    {currentAnswer.answer}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  Soumise le {new Date(currentAnswer.submittedAt).toLocaleString()}
                </div>
                
                {/* Verification actions */}
                {!currentAnswer.verified && (
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => handleVerification(false)}
                      disabled={isVerifying}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        isVerifying ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                      }`}
                    >
                      {isVerifying ? 'Traitement...' : 'Réponse incorrecte'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerification(true)}
                      disabled={isVerifying}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        isVerifying ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                      }`}
                    >
                      {isVerifying ? 'Traitement...' : 'Réponse correcte'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Verification Result Message */}
            {currentAnswer.verified && (
              <div className={`mt-4 p-4 rounded-md ${
                currentAnswer.isCorrect ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {currentAnswer.isCorrect 
                      ? <CheckCircleIcon className="h-5 w-5 text-green-400" />
                      : <XCircleIcon className="h-5 w-5 text-red-400" />
                    }
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${currentAnswer.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                      {currentAnswer.isCorrect 
                        ? 'Cette réponse a été vérifiée et jugée correcte.' 
                        : 'Cette réponse a été vérifiée et jugée incorrecte.'}
                    </h3>
                    {currentAnswer.isCorrect && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>L'objet a été marqué comme authentifié et le propriétaire peut maintenant organiser sa récupération.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
