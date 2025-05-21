import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import itemsService from '../services/itemsService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  LinkIcon, 
  ArrowPathIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

function MatchesList({ 
  itemId, 
  isTwinned = false, 
  twinnedItemId = null,
  onMatchedItemStatusUpdate, 
  onStatusUpdate,
  onTwinItems
}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingTwin, setProcessingTwin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchMatches();
  }, [itemId]);

  const fetchMatches = async () => {
    if (!itemId) {
      setError("L'ID de l'objet est manquant");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await itemsService.getItemMatches(itemId);
      
      if (response.success) {
        setMatches(response.data || []);
      } else {
        setError(response.error || "Erreur lors du chargement des correspondances");
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError("Erreur lors du chargement des correspondances");
    } finally {
      setLoading(false);
    }
  };

  const handleTwinItems = async (matchItemId) => {
    if (!itemId || !matchItemId) {
      toast.error("Information manquante pour l'association des objets");
      return;
    }

    setProcessingTwin(true);
    try {
      if (typeof onTwinItems === 'function') {
        const result = await onTwinItems(matchItemId);
        
        if (result && result.success) {
          toast.success("Les objets ont été associés avec succès");
          await fetchMatches();
        } else {
          toast.error(result.error || "Erreur lors de l'association des objets");
        }
      }
    } catch (err) {
      console.error('Error twinning items:', err);
      toast.error("Une erreur est survenue lors de l'association des objets");
    } finally {
      setProcessingTwin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <ArrowPathIcon className="animate-spin h-6 w-6 text-yellow-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (isTwinned && twinnedItemId) {
    return (
      <div className="bg-green-50 p-4 rounded-md border border-green-200">
        <div className="flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Objets associés</h3>
            <p className="text-sm text-green-700 mt-1">
              Cet objet a été associé avec succès à un autre objet.
            </p>
            <Link
              to={`/items/${twinnedItemId}`}
              className="inline-flex items-center mt-2 text-sm text-green-600 hover:text-green-800"
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              Voir l'objet associé
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600">
        Aucune correspondance trouvée pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div key={match._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex-1">
              <Link 
                to={`/items/${match._id}`}
                className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {match.title}
              </Link>
              <div className="mt-1 text-sm text-gray-500">
                {match.type === 'lost' ? 'Perdu le ' : 'Trouvé le '}
                {new Date(match.date).toLocaleDateString()}
                {match.location && match.location.address && (
                  <> à {match.location.address}</>
                )}
              </div>
            </div>

            {user && (
              <div className="flex">
                <button
                  onClick={() => handleTwinItems(match._id)}
                  disabled={processingTwin || isTwinned}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {processingTwin ? 'Association...' : 'Associer'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MatchesList;