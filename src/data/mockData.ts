import { User, Role } from '../context/AppContext';

export const demoUsers: Array<User & { password: string }> = [
  {
    uid: 'gov-001',
    email: 'governor@emirates.com',
    password: 'Governor123',
    name: 'Sarah Al-Mansouri',
    role: 'governor',
    country: 'United Arab Emirates',
    bio: 'Head of Emirates Academy operations and quality assurance.',
    photoURL: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'mentor-001',
    email: 'coach@emirates.com',
    password: 'Coach123',
    name: 'James Chen',
    role: 'mentor',
    country: 'Singapore',
    bio: 'Senior cabin crew trainer with 10 years of experience.',
    photoURL: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'student-001',
    email: 'student@emirates.com',
    password: 'Student123',
    name: 'Maria Rodriguez',
    role: 'student',
    country: 'Spain',
    bio: 'Aspiring cabin crew member preparing for Emirates recruitment.',
    photoURL: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
];

export const mockUsers: User[] = [
  ...demoUsers,
  {
    uid: 'student-002',
    email: 'ahmed.ali@gmail.com',
    name: 'Ahmed Ali',
    role: 'student',
    country: 'Egypt',
    bio: 'Aviation enthusiast from Cairo.',
    photoURL: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'student-003',
    email: 'sophie.martin@gmail.com',
    name: 'Sophie Martin',
    role: 'student',
    country: 'France',
    bio: 'Multilingual student with passion for hospitality.',
    photoURL: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'mentor-002',
    email: 'lisa.johnson@emirates.com',
    name: 'Lisa Johnson',
    role: 'mentor',
    country: 'United Kingdom',
    bio: 'Specialized in grooming and professional standards.',
    photoURL: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'student-004',
    email: 'yuki.tanaka@gmail.com',
    name: 'Yuki Tanaka',
    role: 'student',
    country: 'Japan',
    bio: 'Service excellence enthusiast from Tokyo.',
    photoURL: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
];

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  description: string;
  duration: string;
  progress?: number;
}

export const mockCourses: Course[] = [
  {
    id: 'course-001',
    title: 'Welcome to Crew\'s Academy',
    instructor: 'Sarah Al-Mansouri',
    thumbnail: 'https://images.pexels.com/photos/1098982/pexels-photo-1098982.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Introduction to Emirates recruitment journey and understanding Open Day and Assessment Day dynamics.',
    duration: '45min',
    progress: 0,
  },
  {
    id: 'course-002',
    title: 'Dress Code & Grooming',
    instructor: 'Lisa Johnson',
    thumbnail: 'https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Emirates grooming standards including hairstyle, makeup, nails, fragrance, and uniform etiquette.',
    duration: '1h 15min',
    progress: 0,
  },
  {
    id: 'course-003',
    title: 'Open Day Strategy',
    instructor: 'James Chen',
    thumbnail: 'https://images.pexels.com/photos/3184611/pexels-photo-3184611.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'What to expect on Open Day, how to approach recruiters, and stand out without overselling.',
    duration: '1h 30min',
    progress: 0,
  },
  {
    id: 'course-004',
    title: 'Assessment Day Process',
    instructor: 'Sarah Al-Mansouri',
    thumbnail: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Group activities breakdown, common tasks, elimination logic, and success tips.',
    duration: '2h 00min',
    progress: 0,
  },
  {
    id: 'course-005',
    title: 'English Proficiency & Communication',
    instructor: 'James Chen',
    thumbnail: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Tone, confidence, and body language practice with common communication mistakes and corrections.',
    duration: '1h 45min',
    progress: 0,
  },
  {
    id: 'course-006',
    title: 'Final Interview Tips',
    instructor: 'Lisa Johnson',
    thumbnail: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Example questions, model answers, and psychological patterns recruiters look for.',
    duration: '2h 15min',
    progress: 0,
  },
];

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  encrypted: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantPhoto: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

export const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    participantId: 'mentor-001',
    participantName: 'James Chen',
    participantPhoto: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
    lastMessage: 'Great progress on your interview preparation!',
    timestamp: '2 hours ago',
    unread: 2,
    messages: [
      {
        id: 'msg-001',
        senderId: 'mentor-001',
        senderName: 'James Chen',
        text: 'Hi Maria! How is your preparation going?',
        timestamp: '10:30 AM',
        encrypted: true,
      },
      {
        id: 'msg-002',
        senderId: 'student-001',
        senderName: 'Maria Rodriguez',
        text: 'Hello! I just completed the service excellence module.',
        timestamp: '10:45 AM',
        encrypted: true,
      },
      {
        id: 'msg-003',
        senderId: 'mentor-001',
        senderName: 'James Chen',
        text: 'Great progress on your interview preparation!',
        timestamp: '11:00 AM',
        encrypted: true,
      },
    ],
  },
  {
    id: 'conv-002',
    participantId: 'student-002',
    participantName: 'Ahmed Ali',
    participantPhoto: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200',
    lastMessage: 'Thank you for the feedback!',
    timestamp: '1 day ago',
    unread: 0,
    messages: [
      {
        id: 'msg-004',
        senderId: 'student-002',
        senderName: 'Ahmed Ali',
        text: 'Can you review my CV?',
        timestamp: 'Yesterday 3:00 PM',
        encrypted: true,
      },
      {
        id: 'msg-005',
        senderId: 'mentor-001',
        senderName: 'James Chen',
        text: 'Of course! Please upload it to the platform.',
        timestamp: 'Yesterday 3:15 PM',
        encrypted: true,
      },
      {
        id: 'msg-006',
        senderId: 'student-002',
        senderName: 'Ahmed Ali',
        text: 'Thank you for the feedback!',
        timestamp: 'Yesterday 4:30 PM',
        encrypted: true,
      },
    ],
  },
];
