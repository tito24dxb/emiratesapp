import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCourses, Course } from '../data/mockData';
import { BookOpen, MessageCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="mb-6 md:mb-8 px-4 md:px-0">
        <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
          Available Courses
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Explore our comprehensive training library
        </p>
      </div>

      {mockCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Courses Available Yet"
          description="No courses have been published yet. Check back soon, or if you're a mentor, be the first to create and share your training content!"
          action={{
            label: 'Contact Support',
            onClick: () => navigate('/support'),
          }}
          secondaryAction={{
            label: 'Browse Resources',
            onClick: () => alert('Resource library coming soon!'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
          {mockCourses.map((course, index) => (
            <div key={course.id} className="bg-white rounded-xl shadow-lg">
              <p className="p-4 text-gray-600">Course: {course.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
