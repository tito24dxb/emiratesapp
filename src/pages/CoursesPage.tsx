import { useState } from 'react';
import { mockCourses, Course } from '../data/mockData';
import { Play, Clock, BookOpen, X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <div className="min-h-screen">
      <div className="mb-6 md:mb-8 px-4 md:px-0">
        <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
          Layer 1: Free Source
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Complete foundational training for Emirates cabin crew recruitment
        </p>
      </div>

      <div className="mb-6 md:mb-8 px-4 md:px-0">
        <div className="bg-gradient-to-r from-[#D71921] to-[#B91518] rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FFD700] rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 md:w-8 md:h-8 text-[#000000]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-bold mb-1">
                Welcome to Crew's Academy
              </h3>
              <p className="text-xs md:text-sm text-red-100">
                Access all 6 foundational courses completely free. Build your knowledge step by step.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
        {mockCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => setSelectedCourse(course)}
            className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
          >
            <div className="relative h-40 md:h-48 overflow-hidden">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute top-3 right-3 bg-[#FFD700] text-[#000000] px-2 py-1 rounded-full text-xs font-bold">
                FREE
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-bold text-base md:text-lg mb-1 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-white/90 text-xs md:text-sm">
                  by {course.instructor}
                </p>
              </div>
            </div>

            <div className="p-4 md:p-5">
              <p className="text-gray-600 text-xs md:text-sm mb-4 line-clamp-2 leading-relaxed">
                {course.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs md:text-sm font-medium">{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs md:text-sm font-medium">6-8 Lessons</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCourse(course);
                }}
                className="w-full bg-gradient-to-r from-[#D71921] to-[#B91518] hover:from-[#B91518] hover:to-[#D71921] text-white py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-sm md:text-base shadow-md hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all duration-300"
              >
                Start Lesson
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 md:mt-12 px-4 md:px-0">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border-t-4 border-[#FFD700]">
          <h3 className="text-lg md:text-xl font-bold text-[#000000] mb-3">
            📚 What You'll Master in Layer 1
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm md:text-base">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-gray-700">Complete recruitment process understanding</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-gray-700">Professional grooming standards</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-gray-700">Open Day confidence strategies</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-gray-700">Assessment Day success tactics</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-gray-700">English communication mastery</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-gray-700">Final interview preparation</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="relative h-48 md:h-64 bg-gray-900">
                <img
                  src={selectedCourse.thumbnail}
                  alt={selectedCourse.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourse(null);
                  }}
                  className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition shadow-lg z-10"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Video player coming soon! This will launch the course content.');
                    }}
                    className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
                  >
                    <Play className="w-6 h-6 md:w-8 md:h-8 text-[#D71921] ml-1" />
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="mb-4">
                  <span className="inline-block bg-[#FFD700] text-[#000000] px-3 py-1 rounded-full text-xs font-bold mb-3">
                    FREE COURSE
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#000000] mb-2">
                    {selectedCourse.title}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600">
                    Instructed by {selectedCourse.instructor}
                  </p>
                </div>

                <div className="bg-[#EADBC8]/30 rounded-xl p-4 md:p-6 mb-6">
                  <p className="text-sm md:text-base text-[#000000] leading-relaxed">
                    {selectedCourse.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FFD700]" />
                    <span className="text-gray-600 font-medium">{selectedCourse.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#FFD700]" />
                    <span className="text-gray-600 font-medium">6-8 Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#FFD700]" />
                    <span className="text-gray-600 font-medium">Certificate</span>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-gradient-to-r from-[#D71921]/10 to-[#FFD700]/10 rounded-xl border border-[#D71921]/20">
                  <h4 className="font-bold text-[#000000] mb-2 text-sm md:text-base">
                    What You'll Learn:
                  </h4>
                  <ul className="space-y-2 text-xs md:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-[#D71921] font-bold">✓</span>
                      <span>Step-by-step guidance through the recruitment process</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#D71921] font-bold">✓</span>
                      <span>Professional tips from experienced Emirates trainers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#D71921] font-bold">✓</span>
                      <span>Real-world examples and practical exercises</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#D71921] font-bold">✓</span>
                      <span>Confidence-building techniques for success</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Starting ${selectedCourse.title}!\n\nCourse content and video lessons will be available soon.`);
                  }}
                  className="w-full bg-gradient-to-r from-[#D71921] to-[#B91518] hover:from-[#B91518] hover:to-[#D71921] text-white py-3 md:py-4 rounded-xl font-bold text-sm md:text-base shadow-lg hover:shadow-xl hover:shadow-[#FFD700]/30 transition-all duration-300"
                >
                  Start Learning Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
