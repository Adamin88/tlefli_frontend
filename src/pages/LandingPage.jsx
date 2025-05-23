import React, { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  BuildingOfficeIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  TruckIcon,
  ArrowRightIcon,
  SparklesIcon,
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  Bars3Icon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  BellAlertIcon,
  CheckCircleIcon,
  BoltIcon,
  ShieldCheckIcon,
  UsersIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import Hero from '../components/Hero';

const features = [
  {
    title: 'Recherche Intelligente',
    description: 'Retrouvez facilement vos objets perdus grâce à notre système de recherche avancé',
    icon: MagnifyingGlassIcon,
    bgColor: 'bg-blue-100',
    color: 'text-blue-600',
  },
  {
    title: 'Notifications Instantanées',
    description: 'Recevez des alertes en temps réel sur l\'état de vos objets',
    icon: BellAlertIcon,
    bgColor: 'bg-green-100',
    color: 'text-green-600',
  },
  {
    title: 'Processus Sécurisé',
    description: 'Système de vérification robuste pour garantir la sécurité de vos objets',
    icon: ShieldCheckIcon,
    bgColor: 'bg-yellow-100',
    color: 'text-yellow-600',
  }
];

const howItWorks = [
  {
    title: 'Créez votre compte',
    description: 'Inscrivez-vous gratuitement en quelques minutes',
    icon: UserCircleIcon,
    color: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  {
    title: 'Déclarez votre objet',
    description: 'Décrivez l\'objet perdu ou trouvé avec des photos',
    icon: ClipboardDocumentCheckIcon,
    color: 'bg-green-100',
    textColor: 'text-green-600',
  },
  {
    title: 'Correspondance Automatique',
    description: 'Notre système recherche les correspondances',
    icon: SparklesIcon,
    color: 'bg-yellow-100',
    textColor: 'text-yellow-600',
  },
  {
    title: 'Récupération Sécurisée',
    description: 'Processus de vérification pour une restitution en toute sécurité',
    icon: CheckCircleIcon,
    color: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
];

const sections = [
  { id: 'hero', name: 'Accueil', icon: HomeIcon },
  { id: 'how-it-works', name: 'Comment ça marche', icon: SparklesIcon },
  { id: 'features', name: 'Fonctionnalités', icon: BoltIcon },
  { id: 'solutions', name: 'Solutions', icon: ShieldCheckIcon },
  { id: 'testimonials', name: 'Partenaires', icon: UsersIcon },
  { id: 'contact', name: 'Contact', icon: EnvelopeIcon },
];

const navigationSections = [
  { id: 'hero', name: 'Accueil', icon: HomeIcon },
  { id: 'how-it-works', name: 'Comment ça marche', icon: SparklesIcon },
  { id: 'features', name: 'Fonctionnalités', icon: BoltIcon },
  { id: 'solutions', name: 'Solutions', icon: ShieldCheckIcon },
  { id: 'testimonials', name: 'Partenaires', icon: UsersIcon },
  { id: 'contact', name: 'Contact', icon: EnvelopeIcon },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const businessItem = {
  hidden: { opacity: 0, x: 100 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

function Header({ isScrolled, activeSection, scrollToSection }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, logout, isAuthenticated, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = React.useState(false);
  
  // Only refresh auth on mount and set flag when checked
  React.useEffect(() => {
    console.log('Header mounted, refreshing auth state');
    const checkAuth = async () => {
      try {
        await refreshAuth();
        console.log('Auth refresh completed');
      } catch (error) {
        console.error('Error refreshing auth:', error);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [refreshAuth]);

  // Log auth state changes for debugging
  React.useEffect(() => {
    if (isAuthenticated) {
      console.log("Header auth state: authenticated as", user?.email || user?.firstName || 'user');
    } else if (authChecked) {
      console.log("Header auth state: not authenticated");
    }
  }, [isAuthenticated, user, authChecked]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // Stay on landing page after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const UserMenu = ({ mobile = false }) => (
    <Menu as="div" className="relative">
      <Menu.Button className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold ${mobile ? 'w-full' : 'rounded-xl hover:bg-gray-100'}`}>
        <div className="relative">
          <UserCircleIcon className="h-6 w-6 text-gray-600" />
          {isAuthenticated && user && (
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
          )}
        </div>
        <span className="text-gray-700">
          {isAuthenticated && user ? (user.firstName || user.email?.split('@')[0] || 'Profil') : 'Connexion'}
        </span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {isAuthenticated && user ? (
            <>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/dashboard"
                    className={`${active ? 'bg-gray-50' : ''} flex items-center px-4 py-2 text-sm text-gray-700`}
                  >
                    <UserIcon className="mr-3 h-5 w-5" />
                    Dashboard
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`${active ? 'bg-gray-50' : ''} flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                    Déconnexion
                  </button>
                )}
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/login"
                    className={`${active ? 'bg-gray-50' : ''} flex items-center px-4 py-2 text-sm text-gray-700`}
                  >
                    <UserIcon className="mr-3 h-5 w-5" />
                    Connexion
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/register"
                    className={`${active ? 'bg-gray-50' : ''} flex items-center px-4 py-2 text-sm text-gray-700`}
                  >
                    <UserIcon className="mr-3 h-5 w-5" />
                    Inscription
                  </Link>
                )}
              </Menu.Item>
            </>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 backdrop-blur-sm transition-all duration-500 ${isScrolled ? 'bg-white shadow-lg shadow-gray-200' : 'bg-white'}`}
    >
      <nav className="flex items-center justify-between w-full px-2" aria-label="Global">
        {/* Logo */}
        <div className="flex-none">
          <Link to="/" className="-m-1.5">
            <img src="/TlefliLogo.webp" alt="Tlefli" className="h-10 w-auto" />
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="flex lg:hidden ml-auto">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-1">
          {navigationSections.map((section) => (
            <a
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                group relative flex items-center gap-x-1 text-1xl leading-6 transition-all duration-200 hover:cursor-pointer px-2
                ${activeSection === section.id
                  ? 'text-yellow-600'
                  : 'text-stone-900 hover:text-yellow-600'
                }
              `}
            >
              
              {section.name}
              {activeSection === section.id && (
                <span className="absolute -bottom-2 left-0 h-0.5 w-full bg-yellow-600" />
              )}
            </a>
          ))}
        </div>

        <div className="flex-none flex items-center gap-x-4">
          {/* TLEFLI PRO link */}
          <Link
            to="/pro"
            className="hidden lg:flex items-center  rounded-xl px-4 py-2 font-semibold text-black transition-all duration-200 hover:bg-gray-100"
          >
            <BuildingOfficeIcon className="h-5 w-5" />
            <span>TLEFLI <span className="text-yellow-600 bg-yellow-50 rounded-lg">Pro</span></span>
          </Link>
          
          {/* Auth button - either user menu or simple login link */}
          <div className="hidden lg:block">
            {isAuthenticated && user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <UserCircleIcon className="h-6 w-6 text-gray-600" />
                <span>Connexion</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      <div 
        className={`lg:hidden absolute top-full left-0 right-0 bg-white shadow-md transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-screen opacity-100 border-b border-gray-200' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {navigationSections.map((section) => (
            <a
              key={section.id}
              onClick={() => {
                scrollToSection(section.id);
                setMobileMenuOpen(false);
              }}
              className={`
                flex items-center gap-x-2 py-2 px-3 rounded-lg text-base font-medium cursor-pointer
                ${activeSection === section.id
                  ? 'bg-gray-50 text-yellow-600'
                  : 'text-gray-900 hover:bg-gray-50 hover:text-yellow-600'
                }
              `}
            >
              <section.icon className={`h-5 w-5 ${activeSection === section.id ? 'text-yellow-600' : 'text-gray-400'}`} />
              {section.name}
            </a>
          ))}
          
          <div className="pt-2 border-t border-gray-200 mt-2">
            {/* TLEFLI PRO link */}
            <Link
              to="/pro"
              className="flex items-center gap-x-2 py-2 px-3 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              <span>TLEFLI<span className="text-yellow-600 bg-yellow-50 rounded-lg px-1">Pro</span></span>
            </Link>
            
            {/* Auth links */}
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-x-2 py-2 px-3 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-x-2 py-2 px-3 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-50 text-left"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400" />
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-x-2 py-2 px-3 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserIcon className="h-5 w-5 text-gray-400" />
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 0);

      const sections = document.querySelectorAll('section[id]');
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      let current = '';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 100;
        const sectionBottom = sectionTop + section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          current = section.getAttribute('id');
        }
      });

      if (window.scrollY < window.innerHeight / 2) {
        current = 'hero';
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        const lastSection = Array.from(sections).pop();
        if (lastSection) {
          current = lastSection.getAttribute('id');
        }
      }

      if (current && current !== activeSection) {
        setActiveSection(current);
      }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  const awards = [
    {
      id: 1,
      title: "Prix de la Meilleure Startup",
      image: "../awards/Best_startup.jpg"
    },
    {
      id: 2,
      title: "Prix Techpreneurs",
      image: "../awards/Youth_Corner.jpg"
    },
    {
      id: 3,
      title: "National Youth Speak Forum Award",
      image: "../awards/Youth_speak.jpg"
    }
  ];

  return (
    <div className="bg-slate-50">
      <Header isScrolled={isScrolled} activeSection={activeSection} scrollToSection={scrollToSection} />

      <div className="pt-0">
        <section id="hero">
          <Hero />
        </section>

        <section id="how-it-works" className="relative bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Comment ça marche
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Un processus simple et efficace pour gérer vos objets perdus et trouvés
              </p>
            </motion.div>

            <div className="mx-auto mt-16 max-w-7xl">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {howItWorks.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg border border-gray-100"
                  >
                    <div className={`mb-6 rounded-xl p-3 ${item.color}`}>
                      <item.icon className={`h-8 w-8 ${item.textColor}`} aria-hidden="true" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-white rounded-full border border-gray-100 w-8 h-8 flex items-center justify-center text-sm font-semibold text-yellow-600">
                      {index + 1}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-16 text-center"
              >
                <p className="text-gray-600 mb-6">
                  Commencez à gérer vos objets perdus et trouvés de manière professionnelle
                </p>
                
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  Commencer maintenant
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
          {/* Animated background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.yellow.100),white)]" style={{ opacity: '0.15' }} />
            <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-gradient-to-r from-yellow-900/10 to-yellow-500/10 opacity-30 shadow-xl shadow-yellow-600/10 ring-1 ring-yellow-50/5 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-500/30 rounded-full"
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                    scale: 0
                  }}
                  animate={{
                    x: [null, Math.random() * 100 + '%'],
                    y: [null, Math.random() * 100 + '%'],
                    scale: [0, 1.5, 0]
                  }}
                  transition={{
                    duration: Math.random() * 5 + 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <span className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-xl bg-gradient-to-r from-yellow-500/20 to-yellow-400/5 opacity-50 blur-xl transition duration-1000 group-hover:opacity-75 sm:block"></span>
                <div className="relative">
                  <h2 className="inline-flex items-center space-x-2 text-base font-semibold leading-7 text-yellow-600">
                    <SparklesIcon className="h-5 w-5 animate-pulse" />
                    <span>Fonctionnalités Avancées</span>
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Une Solution Complète pour la Gestion des Objets Perdus
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Découvrez nos fonctionnalités avancées conçues pour optimiser la gestion des objets perdus et trouvés
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="mx-auto mt-16 max-w-7xl">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group relative"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                      {/* Icon */}
                      <div className="relative">
                        <div className={`inline-flex rounded-xl p-3 ${feature.bgColor} ${feature.color}`}>
                          <feature.icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="mt-6 relative">
                        <h3 className="text-xl font-semibold leading-7 text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-base leading-7 text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="relative bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Une Solution Pour Tous</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Que vous soyez un particulier ou une entreprise, TLEFLI s'adapte à vos besoins
              </p>
            </motion.div>

            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:mt-20 lg:grid-cols-2">
              {/* Individual Users */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500">
                    <UserIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">Pour les Particuliers</h3>
                </div>
                <p className="mt-4 text-gray-600">
                  Retrouvez facilement vos objets perdus ou signalez un objet trouvé
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-center gap-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-yellow-500" />
                    <span>Déclaration simple et rapide</span>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-yellow-500" />
                    <span>Notifications en temps réel</span>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-yellow-500" />
                    <span>Service gratuit</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    to="/register"
                    className="inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-400"
                  >
                    Créer un compte gratuit
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              {/* Business Users */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">Pour les Entreprises</h3>
                </div>
                <p className="mt-4 text-gray-600">
                  Gérez professionnellement les objets perdus de vos clients
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-center gap-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                    <span>Tableau de bord professionnel</span>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                    <span>Gestion multi-sites</span>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                    <span>Support dédié</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    to="/pro"
                    className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
                  >
                    Découvrir Tlelfi Pro
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.yellow.100),white)]" />
          <div className="mx-auto max-w-2xl lg:max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ils nous font confiance
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Reconnus par l'industrie et soutenus par des partenaires de confiance
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-16 space-y-20 lg:mt-20"
            >
              {/* Partners Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* First Empty Card for Logo */}
                <div className="relative rounded-2xl bg-white p-8 shadow-lg sm:p-12 flex items-center justify-center group hover:shadow-xl transition-all duration-300">
                  <div className="text-center">
                    <div className="w-64 h-64 bg-gray-100 rounded-lg mx-auto flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-300">
                      <img src="sand-technologies.png" alt="Logo 1" className="w-64 h-64 object-contain" />
                    </div>
                  </div>
                </div>

                {/* Second Empty Card for Logo */}
                <div className="relative rounded-2xl bg-white p-8 shadow-lg sm:p-12 flex items-center justify-center group hover:shadow-xl transition-all duration-300">
                  <div className="text-center">
                    <div className="w-64 h-64 rounded-lg mx-auto flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-300">
                      <img src="ALXLogo.jpg" alt="Logo 1" className="w-64 h-64 object-contain" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Awards Section */}
              <div className="mt-20">
                <h3 className="text-2xl font-semibold text-gray-900 text-center mb-12">
                  TLEFLI Awards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
                  {awards.map((award) => (
                    <motion.div
                      key={award.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: award.id * 0.1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <img
                        src={award.image}
                        alt={award.title}
                        className="w-64 h-64 rounded-lg shadow-lg shadow-yellow-600 hover:scale-105 transition-transform duration-300"
                      />
                      <h4 className="text-md font-semibold text-gray-900 text-center">{award.title}</h4>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="contact" className="relative isolate bg-white mx-10 mt-5 shadow-2xl shadow-gray-400 rounded-2xl">
          <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
            <div className="relative px-6 pb-20 pt-24 sm:pt-32 lg:static lg:px-8 lg:py-48">
              <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">Contactez-Nous</h2>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Prêt à transformer votre gestion des objets perdus ? Contactez-nous aujourd'hui et découvrez comment notre plateforme peut rationaliser vos opérations.
                  </p>
                  <dl className="mt-10 space-y-4 text-base leading-7 text-gray-600">
                    <div className="flex gap-x-4">
                      <dt className="flex-none">
                        <span className="sr-only">Email</span>
                        <EnvelopeIcon className="h-7 w-6 text-yellow-600" aria-hidden="true" />
                      </dt>
                      <dd>
                        <a className="hover:text-yellow-600" href="mailto:contact@lostitem.com">
                          contact@tlefli.com
                        </a>
                      </dd>
                    </div>
                    <div className="flex gap-x-4">
                      <dt className="flex-none">
                        <span className="sr-only">Téléphone</span>
                        <PhoneIcon className="h-7 w-6 text-yellow-600" aria-hidden="true" />
                      </dt>
                      <dd>
                        <a className="hover:text-yellow-600" href="tel:+212 6 61 24 64 27">
                        +212 6 61 24 64 27
                        </a>
                      </dd>
                    </div>
                  </dl>
                </motion.div>
              </div>
            </div>

            <motion.form
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="px-6 pb-24 pt-20 sm:pb-32 lg:px-8 lg:py-48"
            >
              <div className="mx-auto max-w-xl lg:mr-0 lg:max-w-lg">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-semibold leading-6 text-gray-900">
                      Nom
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        autoComplete="given-name"
                        className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-900">
                      Email
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        autoComplete="email"
                        className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900">
                      Message
                    </label>
                    <div className="mt-2.5">
                      <textarea
                        name="message"
                        id="message"
                        rows={4}
                        className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="rounded-md bg-yellow-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 transition-all duration-200"
                  >
                    Envoyer le message
                  </motion.button>
                </div>
              </div>
            </motion.form>
          </div>
        </section>
      </div>
      {/* Footer */}
      <footer className="bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:mt-20 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <img
                  className="h-8 w-auto"
                  src="/TlefliLogo.webp"
                  alt="TLEFLI"
                />
              </div>
              <p className="text-sm leading-6 text-gray-600">
                La solution innovante pour retrouver vos objets perdus.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.597 0-2.917-.01-3.96-.058-.976-.045-1.505-.207-1.858-.344-.467-.182-.8-.398-1.15-.748-.35-.35-.566-.683-.748-1.15-.137-.353-.3-.882-.344-1.857-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.398.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344 1.064.049 1.791.218 2.427.465.636.247 1.363.416 2.427.465 1.067.048 1.407.06 4.123.06h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.467-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.047-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-gray-900">Solutions</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link to="/pro" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        TLEFLI PRO
                      </Link>
                    </li>
                    <li>
                      <Link to="/particuliers" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Particuliers
                      </Link>
                    </li>
                    <li>
                      <Link to="/entreprises" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Entreprises
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-gray-900">Support</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link to="/contact" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Contact
                      </Link>
                    </li>
                    <li>
                      <Link to="/faq" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        FAQ
                      </Link>
                    </li>
                    <li>
                      <Link to="/guide" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Guide d'utilisation
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-gray-900">Entreprise</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link to="/about" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        À propos
                      </Link>
                    </li>
                    <li>
                      <Link to="/blog" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link to="/careers" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Carrières
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-gray-900">Légal</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link to="/privacy" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Confidentialité
                      </Link>
                    </li>
                    <li>
                      <Link to="/terms" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Conditions
                      </Link>
                    </li>
                    <li>
                      <Link to="/legal" className="text-sm leading-6 text-gray-600 hover:text-yellow-600">
                        Mentions légales
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24">
            <p className="text-xs leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} TLEFLI. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
