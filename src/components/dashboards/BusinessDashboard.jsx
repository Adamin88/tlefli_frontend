import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  DocumentPlusIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ArrowPathRoundedSquareIcon,
  CheckBadgeIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChartPieIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarIconSolid,
  DocumentMagnifyingGlassIcon as DocumentMagnifyingGlassIconSolid,
  DocumentPlusIcon as DocumentPlusIconSolid,
  ChartPieIcon as ChartPieIconSolid,
  BoltIcon as BoltIconSolid,
} from "@heroicons/react/24/solid";
import ItemCard from "../ItemCard";
import { useAuth } from "../../contexts/AuthContext";
import itemsService from "../../services/itemsService";
import { useNavigate, Link } from "react-router-dom";

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalLost: 0,
    totalFound: 0,
    totalReturned: 0,
    // Additional real metrics
    totalItems: 0,
    successRate: 0,
    avgResponseTime: 0,
    thisMonthItems: 0,
  });
  const [items, setItems] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      console.log("Current user:", user);
      try {
        setIsLoading(true);
        setError(null);

        // Make sure we have the user ID in a consistent format
        const userId = user.id || user._id;

        // Log the request details
        console.log("Fetching items for business user:", {
          userId: userId,
          status: selectedStatus,
        });

        // Use userId parameter to ensure we only get this user's items
        const response = await itemsService.getAllItems({
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          userId: userId, // Explicitly pass userId to ensure we only get this user's items
        });

        console.log("API Response:", response);

        if (response.success && response.data) {
          // Log the received items
          console.log("Received items:", response.data);

          // Set the items
          setItems(response.data);

          // Calculate current month stats for thisMonthItems only
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // Simplified helper function to get comprehensive stats
          const getDetailedStats = (month, year, allTime = false) => {
            let filteredItems;

            if (allTime) {
              filteredItems = response.data;
            } else {
              filteredItems = response.data.filter((item) => {
                // More accurate date parsing with fallbacks
                let itemDate;
                const dateStr =
                  item.createdAt ||
                  item.dateReported ||
                  item.updatedAt ||
                  item.date;

                if (dateStr) {
                  itemDate = new Date(dateStr);
                  // Validate the date
                  if (isNaN(itemDate.getTime())) {
                    console.warn(
                      "Invalid date found:",
                      dateStr,
                      "for item:",
                      item._id
                    );
                    return false;
                  }
                } else {
                  console.warn("No valid date found for item:", item._id);
                  return false;
                }

                return (
                  itemDate.getMonth() === month &&
                  itemDate.getFullYear() === year
                );
              });
            }

            // More accurate filtering with validation
            const lostItems = filteredItems.filter(
              (item) =>
                item.type === "lost" ||
                item.type === "Lost" ||
                item.itemType === "lost"
            );

            const foundItems = filteredItems.filter(
              (item) =>
                item.type === "found" ||
                item.type === "Found" ||
                item.itemType === "found"
            );

            const returnedItems = filteredItems.filter(
              (item) =>
                item.status === "returned" ||
                item.status === "Returned" ||
                item.status === "completed" ||
                item.status === "resolved"
            );

            const stats = {
              lost: lostItems.length,
              found: foundItems.length,
              returned: returnedItems.length,
              totalItems: filteredItems.length,
              // Additional accurate metrics
              pending: filteredItems.filter(
                (item) =>
                  item.status === "posted" ||
                  item.status === "pending" ||
                  item.status === "active"
              ).length,
              authenticating: filteredItems.filter(
                (item) =>
                  item.status === "authenticating" ||
                  item.status === "verification"
              ).length,
              authenticated: filteredItems.filter(
                (item) =>
                  item.status === "authenticated" || item.status === "verified"
              ).length,
              returning: filteredItems.filter(
                (item) =>
                  item.status === "returning" || item.status === "in_progress"
              ).length,
            };

            console.log(
              `Accurate stats for ${
                allTime ? "all time" : `${month + 1}/${year}`
              }:`,
              stats
            );

            return stats;
          };

          // Get all-time stats and current month for thisMonthItems
          const allTimeStats = getDetailedStats(null, null, true);
          const currentStats = getDetailedStats(currentMonth, currentYear);

          console.log("All time stats:", allTimeStats);
          console.log("Current month stats:", currentStats);

          // Ultra-accurate success rate calculation (found items / returned items)
          const calculateAccurateSuccessRate = () => {
            const totalFoundItems = allTimeStats.found;
            const returnedItems = allTimeStats.returned;

            console.log("Success rate calculation:", {
              totalFoundItems,
              returnedItems,
              calculation: `${returnedItems} / ${totalFoundItems}`,
            });

            if (totalFoundItems === 0) return 0;

            // More precise calculation: returned items / found items * 100
            const rate = (returnedItems / totalFoundItems) * 100;
            return Math.round(rate * 10) / 10; // Round to 1 decimal place
          };

          // Ultra-accurate average response time calculation
          const calculateAccurateAvgResponseTime = () => {
            const returnedItems = response.data.filter((item) => {
              const hasReturnedStatus =
                item.status === "returned" ||
                item.status === "Returned" ||
                item.status === "completed" ||
                item.status === "resolved";
              const hasValidDates =
                (item.createdAt || item.dateReported) &&
                (item.updatedAt || item.returnedAt || item.completedAt);

              return hasReturnedStatus && hasValidDates;
            });

            if (returnedItems.length === 0) return 0;

            const totalDays = returnedItems.reduce((sum, item) => {
              const startDate = new Date(item.createdAt || item.dateReported);
              const endDate = new Date(
                item.updatedAt || item.returnedAt || item.completedAt
              );

              // Validate dates
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn("Invalid dates for item:", item._id);
                return sum;
              }

              const diffTime = Math.abs(endDate - startDate);
              const diffDays = diffTime / (1000 * 60 * 60 * 24); // More precise calculation

              return sum + diffDays;
            }, 0);

            const avgDays = totalDays / returnedItems.length;
            return Math.round(avgDays * 10) / 10; // Round to 1 decimal place
          };

          // Final stats calculation
          const finalStats = {
            totalLost: allTimeStats.lost,
            totalFound: allTimeStats.found,
            totalReturned: allTimeStats.returned,
            // Additional metrics
            totalItems: allTimeStats.totalItems,
            successRate: calculateAccurateSuccessRate(),
            avgResponseTime: calculateAccurateAvgResponseTime(),
            thisMonthItems: currentStats.totalItems,
            // Additional status breakdown for accuracy
            pending: allTimeStats.pending,
            authenticating: allTimeStats.authenticating,
            authenticated: allTimeStats.authenticated,
            returning: allTimeStats.returning,
          };

          // Validation and logging
          console.log("Final ultra-accurate stats:", finalStats);

          // Validate stats before setting
          const isValidStats = Object.values(finalStats).every(
            (value) => typeof value === "number" || typeof value === "string"
          );

          if (!isValidStats) {
            console.error("Invalid stats detected:", finalStats);
          }

          setStats(finalStats);
        } else {
          console.error("Invalid response format:", response);
          setError("Failed to load items. Invalid response format.");
          setItems([]);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load items. Please try again later.");
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, selectedStatus]);

  const stats_cards = [
    {
      name: "Objets Perdus",
      value: stats.totalLost,
      icon: DocumentMagnifyingGlassIcon,
      iconSolid: DocumentMagnifyingGlassIconSolid,
      color: "text-amber-600",
      bgColor: "bg-gradient-to-br from-amber-50 to-yellow-100",
      iconBg: "bg-amber-500",
    },
    {
      name: "Objets Trouvés",
      value: stats.totalFound,
      icon: DocumentPlusIcon,
      iconSolid: DocumentPlusIconSolid,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-100",
      iconBg: "bg-emerald-500",
    },
    {
      name: "Objets Restitués",
      value: stats.totalReturned,
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
      iconBg: "bg-blue-500",
    },
    {
      name: "Taux de Réussite",
      value: `${stats.successRate}%`,
      icon: ChartPieIcon,
      iconSolid: ChartPieIconSolid,
      color: "text-teal-600",
      bgColor: "bg-gradient-to-br from-teal-50 to-cyan-100",
      iconBg: "bg-teal-500",
      description: "restitués / trouvés",
    },
    {
      name: "Temps de Réponse Moyen",
      value: `${stats.avgResponseTime}j`,
      icon: BoltIcon,
      iconSolid: BoltIconSolid,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-red-100",
      iconBg: "bg-orange-500",
      description: "pour restitution",
    },
  ];

  const statusConfig = [
    {
      value: "all",
      label: "Tous",
      icon: FunnelIcon,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      hoverColor: "hover:bg-gray-200",
    },
    {
      value: "posted",
      label: "Annonce déposée",
      icon: PaperAirplaneIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      hoverColor: "hover:bg-blue-200",
    },
    {
      value: "authenticating",
      label: "Authentification en cours",
      icon: MagnifyingGlassIcon,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      hoverColor: "hover:bg-amber-200",
    },
    {
      value: "authenticated",
      label: "Authentification validée",
      icon: ShieldCheckIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
      hoverColor: "hover:bg-green-200",
    },
    {
      value: "returning",
      label: "Restitution en cours",
      icon: ArrowPathRoundedSquareIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      hoverColor: "hover:bg-purple-200",
    },
    {
      value: "returned",
      label: "Objet restitué",
      icon: CheckBadgeIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      hoverColor: "hover:bg-emerald-200",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-3xl">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200 rounded-3xl">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tableau de Bord Business
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez vos objets perdus et trouvés efficacement
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-sm text-gray-500">
                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                {new Date().toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
          {stats_cards.map((stat) => (
            <div
              key={stat.name}
              className={`${stat.bgColor} overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div
                        className={`${stat.iconBg} rounded-full p-3 shadow-lg`}
                      >
                        <stat.iconSolid
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        {stat.name}
                      </p>
                      <div className="flex items-baseline mt-2">
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                      {stat.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {stat.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Real-time Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statistiques du Mois
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ce mois-ci</span>
                <span className="text-lg font-bold text-blue-600">
                  {stats.thisMonthItems} objets
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total général</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.totalItems} objets
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">
                    Taux de réussite
                  </span>
                  <span className="text-xs text-gray-400">
                    restitués ÷ trouvés
                  </span>
                </div>
                <span
                  className={`text-lg font-bold ${
                    stats.successRate >= 70
                      ? "text-green-600"
                      : stats.successRate >= 40
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {stats.successRate % 1 === 0
                    ? stats.successRate.toFixed(0)
                    : stats.successRate.toFixed(1)}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Croissance mensuelle
                </span>
                <span
                  className={`text-sm font-medium ${
                    stats.thisMonthItems > 0
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {stats.thisMonthItems > 0
                    ? `+${Math.round(
                        (stats.thisMonthItems /
                          Math.max(
                            stats.totalItems - stats.thisMonthItems,
                            1
                          )) *
                          100
                      )}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Temps moyen de traitement
                </span>
                <span className="text-lg font-bold text-orange-600">
                  {stats.avgResponseTime % 1 === 0
                    ? stats.avgResponseTime.toFixed(0)
                    : stats.avgResponseTime.toFixed(1)}{" "}
                  jours
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Objets trouvés en attente
                </span>
                <span className="text-lg font-bold text-amber-600">
                  {Math.max(0, stats.totalFound - stats.totalReturned)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">Efficacité</span>
                  <span className="text-xs text-gray-400">
                    restitution des trouvés
                  </span>
                </div>
                <span
                  className={`text-lg font-bold ${
                    stats.successRate >= 80
                      ? "text-green-600"
                      : stats.successRate >= 60
                      ? "text-yellow-600"
                      : stats.successRate >= 40
                      ? "text-orange-600"
                      : "text-red-600"
                  }`}
                >
                  {stats.successRate % 1 === 0
                    ? stats.successRate.toFixed(0)
                    : stats.successRate.toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Aperçu des Statuts
            </h3>
            <div className="space-y-3">
              {statusConfig.slice(1).map((status) => {
                // Ultra-accurate status counting with multiple possible values
                const count = items.filter((item) => {
                  const itemStatus = item.status?.toLowerCase() || "";
                  const statusValue = status.value.toLowerCase();

                  // Handle variations in status naming
                  switch (statusValue) {
                    case "posted":
                      return (
                        itemStatus === "posted" ||
                        itemStatus === "pending" ||
                        itemStatus === "active"
                      );
                    case "authenticating":
                      return (
                        itemStatus === "authenticating" ||
                        itemStatus === "verification" ||
                        itemStatus === "verifying"
                      );
                    case "authenticated":
                      return (
                        itemStatus === "authenticated" ||
                        itemStatus === "verified" ||
                        itemStatus === "approved"
                      );
                    case "returning":
                      return (
                        itemStatus === "returning" ||
                        itemStatus === "in_progress" ||
                        itemStatus === "processing"
                      );
                    case "returned":
                      return (
                        itemStatus === "returned" ||
                        itemStatus === "completed" ||
                        itemStatus === "resolved"
                      );
                    default:
                      return itemStatus === statusValue;
                  }
                }).length;

                // More accurate percentage calculation
                const percentage =
                  items.length > 0
                    ? Math.round((count / items.length) * 1000) / 10
                    : 0; // Round to 1 decimal place

                return (
                  <div
                    key={status.value}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <status.icon className={`h-4 w-4 mr-2 ${status.color}`} />
                      <span className="text-sm text-gray-600">
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {count}
                      </span>
                      <span className="text-xs text-gray-500">
                        (
                        {percentage % 1 === 0
                          ? percentage.toFixed(0)
                          : percentage.toFixed(1)}
                        %)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Status Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Filtrer par statut
            </h3>
            <span className="text-sm text-gray-500">
              {items.length} {items.length <= 1 ? "élément" : "éléments"} trouvé
              {items.length <= 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {statusConfig.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value)}
                className={`inline-flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  selectedStatus === status.value
                    ? `${status.bgColor} ${status.color} shadow-md ring-2 ring-offset-2 ring-current`
                    : `text-gray-600 bg-gray-50 hover:bg-gray-100 ${status.hoverColor}`
                }`}
              >
                <status.icon className="h-4 w-4 mr-2" />
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Items Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Vos objets{" "}
                {selectedStatus !== "all"
                  ? `(${
                      statusConfig.find((s) => s.value === selectedStatus)
                        ?.label
                    })`
                  : ""}
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate("/report?type=lost")}
                  className="inline-flex items-center px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors duration-200 shadow-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Objet Perdu
                </button>
                <button
                  onClick={() => navigate("/report?type=found")}
                  className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors duration-200 shadow-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Objet Trouvé
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600 mb-4"></div>
                <p className="text-gray-500 text-lg">
                  Chargement des données...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-red-500 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm"
                >
                  <ArrowPathRoundedSquareIcon className="h-5 w-5 mr-2" />
                  Réessayer
                </button>
              </div>
            ) : items && items.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => {
                  console.log("Rendering item:", item);
                  return (
                    <div
                      key={item._id}
                      className="transform hover:scale-105 transition-transform duration-200"
                    >
                      <ItemCard
                        item={{
                          ...item,
                          reportedBy: item.reportedBy || {},
                          contact: {
                            email: item.reportedBy?.email,
                            phone: item.reportedBy?.phone,
                          },
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Aucun objet trouvé
                  </h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    Commencez à gérer vos objets perdus et trouvés en ajoutant
                    votre premier élément.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/report"
                      className="inline-flex items-center px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Déclarer un objet
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
