import { User, Role } from '../context/AppContext';

export const demoUsers: Array<User & { password: string }> = [
  {
    uid: 'gov-001',
    email: 'governor@crewsacademy.com',
    password: 'test123',
    name: 'Governor Account',
    role: 'governor',
    plan: 'vip',
    country: 'United Arab Emirates',
    bio: '',
    photoURL: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'gov-002',
    email: 'crisdoraodxb@gmail.com',
    password: 'Messi24@',
    name: 'Cristian Rolando Dorao',
    role: 'governor',
    plan: 'vip',
    country: 'United Arab Emirates',
    bio: '',
    photoURL: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'mentor-001',
    email: 'mentor@crewsacademy.com',
    password: 'test123',
    name: 'Mentor Account',
    role: 'mentor',
    plan: 'pro',
    country: 'United Arab Emirates',
    bio: '',
    photoURL: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'student-001',
    email: 'student@crewsacademy.com',
    password: 'test123',
    name: 'Student Account',
    role: 'student',
    plan: 'free',
    country: 'United Arab Emirates',
    bio: '',
    photoURL: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'pro-001',
    email: 'pro@crewsacademy.com',
    password: 'test123',
    name: 'Pro Student',
    role: 'student',
    plan: 'pro',
    country: 'United Arab Emirates',
    bio: '',
    photoURL: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    uid: 'vip-001',
    email: 'vip@crewsacademy.com',
    password: 'test123',
    name: 'VIP Student',
    role: 'student',
    plan: 'vip',
    country: 'United Arab Emirates',
    bio: '',
    photoURL: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
];

export const mockUsers: User[] = [];

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  description: string;
  duration: string;
  progress?: number;
}

export const mockCourses: Course[] = [];

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

export const mockConversations: Conversation[] = [];
