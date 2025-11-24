import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Bell, ChevronDown, User, Settings, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import SystemAnnouncementBanner from '../SystemAnnouncementBanner';

interface DropdownItem {
  label: string;
  path: string;
  roles?: string[];
}

interface NavItem {
  label: string;
  items?: DropdownItem[];
  path?: string;
}

export default function TopNavbar() {
  const { currentUser, logout } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  if (!currentUser) return null;

  const isGovernor = currentUser.role === 'governor';
  const isModerator = currentUser.role === 'moderator';
  const isCoach = currentUser.role === 'coach';
  const isSeller = currentUser.role === 'seller' || currentUser.role === 'student';

  const navigationItems: NavItem[] = [
    {
      label: 'Marketplace',
      items: [
        { label: 'Browse Products', path: '/marketplace' },
        { label: 'My Orders', path: '/my-orders' },
        ...(isSeller ? [
          { label: 'Seller Dashboard', path: '/seller-dashboard' },
          { label: 'My Products', path: '/my-products' },
          { label: 'My Earnings', path: '/seller-billing' },
        ] : [])
      ]
    },
    ...(isGovernor || isModerator ? [{
      label: 'Control Nexus',
      items: [
        { label: 'Governor Dashboard', path: '/governor-control-nexus', roles: ['governor'] },
        { label: 'Analytics', path: '/analytics-dashboard', roles: ['governor'] },
        { label: 'Feature Flags', path: '/feature-flags', roles: ['governor'] },
        { label: 'Audit Logs', path: '/audit-logs', roles: ['governor'] },
        { label: 'Moderator Dashboard', path: '/moderator', roles: ['moderator', 'governor'] },
      ].filter(item => !item.roles || item.roles.includes(currentUser.role))
    }] : []),
    {
      label: 'Dashboard',
      items: [
        { label: 'Main Dashboard', path: '/dashboard' },
        ...(isCoach || isGovernor ? [
          { label: 'Coach Dashboard', path: '/coach' },
          { label: 'Students', path: '/students' },
          { label: 'Attendance', path: '/attendance' },
        ] : []),
        { label: 'My Progress', path: '/my-progress' },
      ]
    },
    {
      label: 'AI Trainer',
      items: [
        { label: 'AI Training', path: '/ai-trainer' },
        { label: 'Open Day Simulator', path: '/open-day-simulator' },
        { label: 'Leaderboard', path: '/leaderboard' },
      ]
    },
    {
      label: 'Community',
      items: [
        { label: 'Community Feed', path: '/community-feed' },
        { label: 'Chat', path: '/chat' },
      ]
    },
    {
      label: 'Emirates',
      items: [
        { label: 'Courses', path: '/courses' },
        { label: 'Open Days', path: '/open-days' },
        { label: 'Recruiters', path: '/recruiters' },
      ]
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center flex-shrink-0">
                <img
                  src="/Crews (2).png"
                  alt="The Crew Academy"
                  className="h-12 w-auto object-contain"
                />
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item) => (
                  <div
                    key={item.label}
                    className="relative"
                    ref={(el) => (dropdownRefs.current[item.label] = el)}
                  >
                    {item.items ? (
                      <>
                        <button
                          onClick={() => toggleDropdown(item.label)}
                          onMouseEnter={() => setOpenDropdown(item.label)}
                          className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            openDropdown === item.label
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              openDropdown === item.label ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {openDropdown === item.label && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[110]"
                              onMouseLeave={() => setOpenDropdown(null)}
                            >
                              {item.items.map((subItem) => (
                                <Link
                                  key={subItem.path}
                                  to={subItem.path}
                                  onClick={() => setOpenDropdown(null)}
                                  className={`block px-4 py-2 text-sm transition-colors ${
                                    location.pathname === subItem.path
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {subItem.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        to={item.path!}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          location.pathname === item.path
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[110]"
                    >
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                        <p className="text-xs text-gray-600">{currentUser.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.label}>
                    {item.items ? (
                      <div>
                        <button
                          onClick={() => toggleDropdown(item.label)}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          {item.label}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              openDropdown === item.label ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {openDropdown === item.label && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="ml-4 mt-2 space-y-1 overflow-hidden"
                            >
                              {item.items.map((subItem) => (
                                <Link
                                  key={subItem.path}
                                  to={subItem.path}
                                  onClick={() => {
                                    setShowMobileMenu(false);
                                    setOpenDropdown(null);
                                  }}
                                  className={`block px-4 py-2 text-sm rounded-lg ${
                                    location.pathname === subItem.path
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {subItem.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        to={item.path!}
                        onClick={() => setShowMobileMenu(false)}
                        className={`block px-4 py-2 text-sm font-medium rounded-lg ${
                          location.pathname === item.path
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SystemAnnouncementBanner />
      </div>
    </>
  );
}
