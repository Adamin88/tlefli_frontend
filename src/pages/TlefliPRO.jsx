import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  TruckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  CurrencyEuroIcon,
  HomeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import TlefliProBg from '../assets/TlefliProBg.webp';

const sections = [
  { id: 'hero', name: 'Accueil', icon: HomeIcon },
  { id: 'benefits', name: 'Avantages', icon: CheckCircleIcon },
  { id: 'business-types', name: 'Solutions', icon: BuildingOfficeIcon },
  { id: 'features', name: 'Fonctionnalités', icon: ChartBarIcon },
  { id: 'contact', name: 'Contact', icon: PhoneIcon },
];

const benefits = [
  {
    title: "Réduction des Coûts",
    description: "Optimisez vos ressources et réduisez les coûts de gestion jusqu'à 60%",
    icon: CurrencyEuroIcon,
    stat: "-60%",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  {
    title: "Satisfaction Client",
    description: "Améliorez l'expérience client avec un système efficace et rapide",
    icon: UserGroupIcon,
    stat: "98%",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Gain de Temps",
    description: "Automatisez les tâches répétitives et gagnez en productivité",
    icon: ClockIcon,
    stat: "4h/jour",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  }
];

const businessTypes = [
  {
    name: 'Centres Commerciaux',
    icon: ShoppingBagIcon,
    description: 'Solution centralisée pour la gestion multi-commerces et grands espaces commerciaux'
  },
  {
    name: 'Établissements d\'Enseignement',
    icon: AcademicCapIcon,
    description: 'Adapté aux écoles, universités et campus pour une gestion efficace des objets perdus'
  },
  {
    name: 'Hôtels et Restaurants',
    icon: BuildingOfficeIcon,
    description: 'Gestion professionnelle pour l\'hôtellerie et la restauration'
  },
  {
    name: 'Transport Public',
    icon: TruckIcon,
    description: 'Solution dédiée aux réseaux de transport et stations'
  },
  {
    name: 'Centres Sportifs',
    icon: UserGroupIcon,
    description: 'Pour les salles de sport, stades et complexes sportifs'
  },
  {
    name: 'Aéroports',
    icon: BuildingOfficeIcon,
    description: 'Gestion des objets trouvés pour les aéroports et zones de transit'
  },
  {
    name: 'Événementiel',
    icon: TruckIcon,
    description: 'Adapté aux salles de spectacle, festivals et événements'
  },
  {
    name: 'Parcs d\'Attractions',
    icon: BuildingOfficeIcon,
    description: 'Solution pour les parcs de loisirs et attractions touristiques'
  }
];

const features = [
  {
    name: 'Gestion Centralisée',
    description: 'Plateforme tout-en-un pour gérer l\'ensemble de vos objets perdus. Interface intuitive permettant de cataloguer, suivre et restituer les objets efficacement.',
    icon: ChartBarIcon,
    details: [
      'Dashboard personnalisable',
      'Suivi en temps réel',
      'Historique complet',
      'Statistiques détaillées'
    ]
  },
  {
    name: 'Sécurité Avancée',
    description: 'Protection maximale des données avec un système de sécurité multicouche. Conformité RGPD et cryptage de bout en bout pour toutes les informations sensibles.',
    icon: ShieldCheckIcon,
    details: [
      'Authentification forte',
      'Cryptage des données',
      'Contrôle d\'accès',
      'Audit de sécurité'
    ]
  },
  {
    name: 'Communication Automatisée',
    description: 'Système de notification intelligent pour informer automatiquement les propriétaires potentiels. Réduction significative du temps de traitement des réclamations.',
    icon: UserGroupIcon,
    details: [
      'Notifications automatiques',
      'Modèles personnalisables',
      'Suivi des communications',
      'Multi-canal (email, SMS)'
    ]
  },
  {
    name: 'Intelligence Artificielle',
    description: 'Algorithmes avancés pour la reconnaissance et le matching des objets. Amélioration continue du taux de restitution grâce au machine learning.',
    icon: DocumentChartBarIcon,
    details: [
      'Reconnaissance d\'objets',
      'Matching automatique',
      'Prédictions statistiques',
      'Apprentissage continu'
    ]
  }
];

function TlefliPRO() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section) => {
        if (
          section.offsetTop <= scrollPosition &&
          section.offsetTop + section.offsetHeight > scrollPosition
        ) {
          setActiveSection(section.id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <HomeIcon className="h-6 w-6 text-zinc-900 group-hover:text-orange-500 transition-colors duration-200" />
              <span className="font-semibold text-zinc-900 group-hover:text-orange-500 transition-colors duration-200">Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="hero" 
        className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden"
        style={{
          backgroundImage: `url(${TlefliProBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
        
        {/* Content Container */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Main Content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left space-y-8"
            >
              {/* Tags */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm font-medium backdrop-blur-sm">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Solution Pro
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium backdrop-blur-sm">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Gestion Intelligente
                </span>
              </div>

              {/* Main Title */}
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-5xl lg:text-7xl text-white/80 leading-tight font-light"
                >
                  TLEFLI{' '}
                  <span className="relative">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 shadow-lg shadow-yellow-600 rounded-lg font-extralight px-1">
                      Pro
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-200/20 blur-xl transform -rotate-2"></span>
                  </span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-6 text-xl lg:text-2xl text-gray-100 leading-relaxed"
                >
                  Transformez la gestion de vos objets perdus en{' '}
                  <span className="text-yellow-300">expérience client exceptionnelle</span>
                </motion.p>
              </div>

              {/* Features List */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="grid grid-cols-2 gap-4 py-6"
              >
                {[
                  { icon: ClockIcon, text: "Gain de temps" },
                  { icon: ShieldCheckIcon, text: "Sécurité maximale" },
                  { icon: UserGroupIcon, text: "Support 24/7" },
                  { icon: ChartBarIcon, text: "Analytics avancés" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <feature.icon className="h-5 w-5 text-yellow-400" />
                    <span className="text-gray-300 text-sm">{feature.text}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 pt-6"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-semibold shadow-lg shadow-yellow-500/25 hover:scale-105 transform transition-all duration-200"
                >
                  Commencer maintenant
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white/10 text-white font-semibold border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
                >
                  Contactez-nous
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Column - Stats/Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    stat: "-60%",
                    label: "Réduction des coût",
                    
                    icon: CurrencyEuroIcon
                  },
                  {
                    stat: "98%",
                    label: "Satisfaction client",
                    
                    icon: UserGroupIcon
                  },
                  {
                    stat: "24/7",
                    label: "Support client",
                    
                    icon: PhoneIcon
                  },
                  {
                    stat: "+45%",
                    label: "Productivité",
                  
                    icon: ChartBarIcon
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    className="group p-6 rounded-2xl shadow-md shadow-yellow-600 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                  >
                    <item.icon className="h-8 w-8 text-yellow-400 mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">{item.stat}</div>
                    <div className="text-sm font-medium text-yellow-300 mb-1">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-zinc-50 to-white">
        <div className="absolute inset-x-0 h-96 blur-3xl -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-zinc-500/10 to-orange-500/10 transform rotate-12"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-4"
            >
              Pourquoi Choisir <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Tlefli Pro</span> ?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg leading-8 text-zinc-600"
            >
              Une solution complète qui transforme la gestion des objets perdus en avantage stratégique
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-white/50 rounded-3xl blur-xl group-hover:bg-orange-500/5 transition-colors duration-300" />
                <div className="relative h-full bg-white/80 backdrop-blur-sm ring-1 ring-zinc-200 rounded-2xl p-8 hover:ring-orange-500/20 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-lg bg-orange-500/10 p-3 ring-1 ring-orange-500/20 w-fit">
                      <benefit.icon className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="font-semibold text-xl text-zinc-900">{benefit.stat}</div>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">{benefit.title}</h3>
                  <p className="text-zinc-600">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section id="business-types" className="relative py-24 bg-gradient-to-b from-zinc-50 via-white to-zinc-50">
        <div className="absolute inset-x-0 h-96 blur-3xl -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-zinc-500/10 to-orange-500/10 transform -rotate-12"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold tracking-tight text-zinc-900 mb-4"
            >
              Solutions <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Sectorielles</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg leading-8 text-zinc-600"
            >
              Une approche adaptée à votre secteur d'activité
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {businessTypes.map((type, index) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-white/50 rounded-2xl blur-lg group-hover:bg-orange-500/5 transition-colors duration-300" />
                <div className="relative h-full bg-white/80 backdrop-blur-sm ring-1 ring-zinc-200 rounded-xl p-6 hover:ring-orange-500/20 transition-all duration-300">
                  <div className="rounded-lg bg-orange-500/10 p-3 ring-1 ring-orange-500/20 w-fit mb-4">
                    <type.icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">{type.name}</h3>
                  <p className="text-zinc-600 text-sm">{type.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 bg-gradient-to-b from-white via-zinc-50 to-white">
        <div className="absolute inset-x-0 h-96 blur-3xl -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-zinc-500/10 to-orange-500/10 transform rotate-12"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold tracking-tight text-zinc-900 mb-4"
            >
              Fonctionnalités <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Professionnelles</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg leading-8 text-zinc-600"
            >
              Des outils puissants pour une gestion optimale de vos objets perdus
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-white/50 rounded-3xl blur-xl group-hover:bg-orange-500/5 transition-colors duration-300" />
                <div className="relative bg-white/80 backdrop-blur-sm ring-1 ring-zinc-200 rounded-2xl p-8 hover:ring-orange-500/20 transition-all duration-300">
                  <div className="rounded-lg bg-orange-500/10 p-3 ring-1 ring-orange-500/20 w-fit mb-6">
                    <feature.icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3">{feature.name}</h3>
                  <p className="text-zinc-600 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-x-3">
                        <CheckCircleIcon className="h-5 w-5 flex-none text-orange-500" />
                        <span className="text-sm text-zinc-600">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-24 bg-gradient-to-b from-zinc-50 via-white to-zinc-50">
        <div className="absolute inset-x-0 h-96 blur-3xl -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-zinc-500/10 to-orange-500/10 transform -rotate-12"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:pr-8"
            >
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-6">
                Contactez <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Nous</span>
              </h2>
              <p className="text-lg text-zinc-600 mb-8">
                Notre équipe est à votre disposition pour répondre à vos questions et vous accompagner dans la mise en place de votre solution.
              </p>
              <dl className="space-y-6 text-base text-zinc-600">
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <span className="sr-only">Téléphone</span>
                    <PhoneIcon className="h-6 w-6 text-orange-500" />
                  </dt>
                  <dd><a href="tel:+212 6 61 24 64 27" className="hover:text-orange-500 transition-colors">+212 6 61 24 64 27</a></dd>
                </div>
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <span className="sr-only">Email</span>
                    <EnvelopeIcon className="h-6 w-6 text-orange-500" />
                  </dt>
                  <dd><a href="mailto:contact@tlefli.ma" className="hover:text-orange-500 transition-colors">contact@tlefli.ma</a></dd>
                </div>
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <span className="sr-only">Horaires</span>
                    <ClockIcon className="h-6 w-6 text-orange-500" />
                  </dt>
                  <dd>Lun-Ven: 9h-18h</dd>
                </div>
              </dl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-white/50 rounded-3xl blur-xl" />
              <div className="relative bg-white/80 backdrop-blur-sm ring-1 ring-zinc-200 rounded-2xl p-8">
                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-900 mb-2">Nom</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="block w-full rounded-lg border-0 bg-white text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-orange-500 sm:text-sm sm:leading-6 px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-900 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="block w-full rounded-lg border-0 bg-white text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-orange-500 sm:text-sm sm:leading-6 px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-zinc-900 mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="block w-full rounded-lg border-0 bg-white text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-orange-500 sm:text-sm sm:leading-6 px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-orange-500 hover:to-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 transition-all duration-200"
                    >
                      Envoyer
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex justify-center space-x-6 text-sm">
              <Link to="/privacy" className="text-zinc-600 hover:text-orange-500 transition-colors">
                Confidentialité
              </Link>
              <Link to="/terms" className="text-zinc-600 hover:text-orange-500 transition-colors">
                Conditions
              </Link>
              <Link to="/legal" className="text-zinc-600 hover:text-orange-500 transition-colors">
                Mentions légales
              </Link>
            </div>
            <div className="mt-4 md:mt-0 text-center">
              <p className="text-sm text-zinc-600">
                &copy; {new Date().getFullYear()} Tlefli. Tous droits réservés
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default TlefliPRO;
