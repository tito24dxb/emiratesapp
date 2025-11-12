import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import PlanBadge from '../PlanBadge';

export default function Navbar() {
  const { currentUser, logout } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) return null;

  return (
    <nav className="bg-gradient-to-r from-[#D71921] to-[#B91518] text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FFD700] rounded-lg flex items-center justify-center font-bold text-sm md:text-lg text-[#000000]">
              CA
            </div>
            <h1 className="text-base md:text-xl font-bold">Crew's Academy</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block">
              <PlanBadge plan={currentUser.plan} size="sm" />
            </div>

            <button
              onClick={() => alert('No new notifications')}
              className="relative p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-[#FFD700] rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1 md:gap-3 hover:bg-white/10 rounded-lg px-2 md:px-3 py-1.5 md:py-2 transition"
              >
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-white"
                />
                <div className="text-left hidden md:block">
                  <div className="text-sm font-bold">{currentUser.name}</div>
                  <div className="text-xs text-red-100 capitalize">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 text-[#1C1C1C]"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#EADBC8] transition"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        alert('Settings page coming soon!');
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#EADBC8] transition w-full text-left"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        navigate('/login');
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition w-full text-left text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
