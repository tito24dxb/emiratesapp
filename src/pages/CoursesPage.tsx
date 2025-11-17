import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllMainModules, MainModule } from '../services/mainModuleService';
import { getAllCourses, Course } from '../services/courseService';
import { useApp } from '../context/AppContext';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [mainModules, setMainModules] = useState<MainModule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'mentor' || currentUser.role === 'governor')) {
      navigate('/coach-dashboard');
      return;
    }
    fetchData();
  }, [currentUser, navigate]);

  const fetchData = async () => {
    try {
      console.log('CoursesPage: Fetching main modules and courses...');
      const [modulesData, coursesData] = await Promise.all([
        getAllMainModules(),
        getAllCourses()
      ]);
      console.log('CoursesPage: Main modules fetched:', modulesData.length);
      console.log('CoursesPage: Courses fetched:', coursesData.length);
      setMainModules(modulesData);
      setCourses(coursesData.filter(course => course.visible !== false));
    } catch (error) {
      console.error('CoursesPage: Error fetching data:', error);
      setMainModules([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
          Training Modules & Courses
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Master the skills needed to become a successful cabin crew member
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D71920] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading content...</p>
          </div>
        </div>
      ) : (
        <>
          {mainModules.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Modules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mainModules.map((module) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
                    onClick={() => navigate(`/main-modules/${module.id}`)}
                  >
                    <img
                      src={module.coverImage}
                      alt={module.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{module.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{module.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {courses.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    <div className="relative">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      {course.video_url && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h3>
                      {course.subtitle && (
                        <p className="text-sm text-gray-500 mb-2">{course.subtitle}</p>
                      )}
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{course.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{course.duration}</span>
                        <span className="capitalize">{course.level}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {mainModules.length === 0 && courses.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Content Available</h3>
              <p className="text-gray-600">Training modules and courses will be available soon.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
