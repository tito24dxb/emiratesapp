import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageCircle, Users, TrendingUp, Award, GraduationCap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockCourses } from '../data/mockData';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (currentUser.role === 'student') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
            Welcome back, {currentUser.name.split(' ')[0]}!
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Continue your journey to Emirates excellence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Courses Enrolled</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-[#000000]"
          >
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Overall Progress</p>
            <p className="text-3xl md:text-4xl font-bold">0%</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#000000] to-[#2C2C2C] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <Award className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Certificates Earned</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <EmptyState
            icon={BookOpen}
            title="No Courses Yet"
            description="You haven't enrolled in any courses yet. Explore our free lessons or browse courses to get started on your Emirates cabin crew journey."
            action={{
              label: 'Explore Free Lessons',
              onClick: () => navigate('/courses'),
            }}
            secondaryAction={{
              label: 'View All Courses',
              onClick: () => navigate('/courses'),
            }}
          />
        </motion.div>
      </motion.div>
    );
  }

  if (currentUser.role === 'mentor') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
            Mentor Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Manage your students and educational content
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <Users className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Active Students</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-[#000000]"
          >
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Courses Created</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#000000] to-[#2C2C2C] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Messages</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <EmptyState
            icon={GraduationCap}
            title="Start Creating Content"
            description="No uploads yet. Start by adding your first course or resource to help your students succeed in their Emirates cabin crew journey."
            action={{
              label: 'Upload Content',
              onClick: () => navigate('/coach-dashboard'),
            }}
            secondaryAction={{
              label: 'View Students',
              onClick: () => navigate('/students'),
            }}
          />
        </motion.div>
      </motion.div>
    );
  }

  if (currentUser.role === 'governor') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
            Governor Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            System overview and management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <Users className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Total Users</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-[#000000]"
          >
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Total Courses</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#000000] to-[#2C2C2C] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Active Sessions</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Support Requests</p>
            <p className="text-3xl md:text-4xl font-bold">0</p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <EmptyState
            icon={BarChart3}
            title="No Analytics Data Yet"
            description="Once mentors and students begin interacting with the platform, comprehensive metrics and analytics will appear here to help you monitor system performance."
            action={{
              label: 'Manage Users',
              onClick: () => navigate('/users'),
            }}
            secondaryAction={{
              label: 'System Settings',
              onClick: () => navigate('/maintenance'),
            }}
          />
        </motion.div>
      </motion.div>
    );
  }

  return null;
}
