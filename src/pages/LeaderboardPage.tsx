import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, ChevronDown, ChevronUp, Shield, AlertTriangle, Mail, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLeaderboard, UserPoints } from '../services/rewardsService';
import BadgeDisplay from '../components/BadgeDisplay';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserWithDetails extends UserPoints {
  userName: string;
  email: string;
  role: string;
  photoURL?: string;
  achievements?: string[];
  bio?: string;
  joinedAt?: any;
}

interface GroupedUsers {
  admins: UserWithDetails[];
  supportAgents: UserWithDetails[];
  mentors: UserWithDetails[];
  students: UserWithDetails[];
}

export default function LeaderboardPage() {
  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers>({
    admins: [],
    supportAgents: [],
    mentors: [],
    students: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('students');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const leaderboardData = await getLeaderboard(500);

      const usersWithDetails: UserWithDetails[] = await Promise.all(
        usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          const pointsData = leaderboardData.find(p => p.user_id === userDoc.id);

          return {
            user_id: userDoc.id,
            userName: userData.name || userData.displayName || 'Unknown User',
            email: userData.email || '',
            role: userData.role || 'student',
            photoURL: userData.photoURL || userData.profilePicture || '',
            achievements: userData.achievements || [],
            bio: userData.bio || '',
            joinedAt: userData.createdAt,
            total_points: pointsData?.total_points || 0,
            current_rank: pointsData?.current_rank || 'Bronze',
            daily_login_streak: pointsData?.daily_login_streak || 0,
            verified_crew: pointsData?.verified_crew || false,
          };
        })
      );

      const grouped: GroupedUsers = {
        admins: [],
        supportAgents: [],
        mentors: [],
        students: []
      };

      usersWithDetails.forEach(user => {
        const role = user.role.toLowerCase();
        if (role === 'governor' || role === 'admin') {
          grouped.admins.push(user);
        } else if (role === 'support' || role === 'support-agent') {
          grouped.supportAgents.push(user);
        } else if (role === 'mentor' || role === 'coach') {
          grouped.mentors.push(user);
        } else {
          grouped.students.push(user);
        }
      });

      grouped.admins.sort((a, b) => b.total_points - a.total_points);
      grouped.supportAgents.sort((a, b) => b.total_points - a.total_points);
      grouped.mentors.sort((a, b) => b.total_points - a.total_points);
      grouped.students.sort((a, b) => b.total_points - a.total_points);

      setGroupedUsers(grouped);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-500 font-bold">#{index + 1}</span>;
  };

  const getRankBackground = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300';
    if (index === 1) return 'glass-card border-gray-300';
    if (index === 2) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300';
    return 'glass-card border-white/40';
  };

  const getRoleEmail = (email: string, role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'student') {
      return email;
    }
    const emailParts = email.split('@');
    return `${emailParts[0]}@thecrewacademy.co`;
  };

  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'governor' || roleLower === 'admin') {
      return <Shield className="w-5 h-5 text-[#D71920]" />;
    }
    if (roleLower === 'support' || roleLower === 'support-agent') {
      return <Mail className="w-5 h-5 text-blue-600" />;
    }
    if (roleLower === 'mentor' || roleLower === 'coach') {
      return <Star className="w-5 h-5 text-purple-600" />;
    }
    return null;
  };

  const toggleUserCard = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const renderUserList = (users: UserWithDetails[], sectionName: string, title: string) => {
    const isExpanded = expandedSection === sectionName;

    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(sectionName)}
          className="w-full glass-card rounded-xl p-4 flex items-center justify-between hover:bg-white/60 transition"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <span className="px-3 py-1 bg-[#D71920] text-white rounded-full text-sm font-bold">
              {users.length}
            </span>
          </div>
          {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-600" /> : <ChevronDown className="w-6 h-6 text-gray-600" />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mt-3"
            >
              {users.map((user, index) => (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className={`${getRankBackground(index)} border-2 rounded-xl p-4 shadow-md hover:shadow-lg transition cursor-pointer`}
                    onClick={() => toggleUserCard(user.user_id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                        {getRankIcon(index)}
                      </div>

                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#D71920] to-[#B91518]">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                            {user.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-gray-800">
                            {user.userName}
                          </h3>
                          {getRoleIcon(user.role)}
                          <BadgeDisplay
                            rank={user.current_rank}
                            size="sm"
                            verifiedCrew={user.verified_crew}
                          />
                        </div>
                        {user.daily_login_streak > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            🔥 {user.daily_login_streak} day streak
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-[#D71920]">
                          {user.total_points.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">points</p>
                      </div>

                      <div className="flex-shrink-0">
                        {expandedUserId === user.user_id ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedUserId === user.user_id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t-2 border-white/40"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#D71920]" />
                                Contact
                              </h4>
                              <p className="text-sm text-gray-700 font-mono">
                                {getRoleEmail(user.email, user.role)}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 capitalize">
                                Role: {user.role}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-[#D71920]" />
                                Achievements
                              </h4>
                              {user.achievements && user.achievements.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {user.achievements.map((achievement, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full"
                                    >
                                      {achievement}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600">No achievements yet</p>
                              )}
                            </div>

                            {user.bio && (
                              <div className="md:col-span-2">
                                <h4 className="font-bold text-gray-900 mb-2">Bio</h4>
                                <p className="text-sm text-gray-700">{user.bio}</p>
                              </div>
                            )}

                            <div className="md:col-span-2">
                              <div className="glass-card rounded-lg p-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                  <div>
                                    <p className="text-2xl font-bold text-[#D71920]">
                                      {user.total_points.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-600">Total Points</p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-purple-600">
                                      {user.current_rank}
                                    </p>
                                    <p className="text-xs text-gray-600">Rank</p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-orange-600">
                                      {user.daily_login_streak}
                                    </p>
                                    <p className="text-xs text-gray-600">Day Streak</p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-green-600">
                                      {user.verified_crew ? 'YES' : 'NO'}
                                    </p>
                                    <p className="text-xs text-gray-600">Verified</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl p-8 mb-6 border-2 border-white/40">
          <div className="flex items-center gap-4 mb-6">
            <TrendingUp className="w-12 h-12 text-[#D71920]" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-700 mt-1">Academy Members Ranked by Performance</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 bg-red-50 border-2 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Security Notice</p>
                <p className="text-xs text-red-800 mt-1">
                  Unauthorized external communication will result in a strike (warning).
                  <span className="font-bold"> 3 strikes lead to permanent ban.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4 font-semibold">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedUsers.admins.length > 0 && renderUserList(groupedUsers.admins, 'admins', '👑 Admins (Governors)')}
            {groupedUsers.supportAgents.length > 0 && renderUserList(groupedUsers.supportAgents, 'support', '💬 Support Agents')}
            {groupedUsers.mentors.length > 0 && renderUserList(groupedUsers.mentors, 'mentors', '⭐ Mentors')}
            {renderUserList(groupedUsers.students, 'students', '🎓 Students')}
          </div>
        )}
      </div>
    </div>
  );
}
