import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Shield, Sparkles, Brain, BookOpen, MessageCircle, Check, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Comprehensive Courses',
      description: 'Access structured courses covering everything from grooming standards to customer service excellence'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Training',
      description: 'Get personalized feedback on your CV, practice interviews, and improve your English skills with AI'
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Open Day Simulator',
      description: 'Practice real assessment scenarios in our immersive Open Day simulation environment'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Expert Mentorship',
      description: 'Connect with experienced cabin crew and get guidance from industry professionals'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Access to basic courses',
        'Community chat',
        'Course progress tracking',
        'Mobile-friendly interface'
      ],
      cta: 'Get Started',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      features: [
        'Everything in Free',
        'AI Trainer access',
        'CV optimization & ATS converter',
        'Open Day Simulator',
        'Priority support',
        'Advanced courses'
      ],
      cta: 'Start Pro Trial',
      highlighted: true
    },
    {
      name: 'VIP',
      price: '$79',
      period: 'per month',
      features: [
        'Everything in Pro',
        '1-on-1 mentor sessions',
        'Personalized career roadmap',
        'Direct recruiter connections',
        'Lifetime course access',
        'VIP community access'
      ],
      cta: 'Go VIP',
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <img src="/logo.png" alt="The Crew Academy" className="h-16 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-gray-700 font-bold hover:text-[#D71920] transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D71920]/10 via-transparent to-[#CBA135]/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6">
              Your Journey to
              <span className="block bg-gradient-to-r from-[#D71920] to-[#CBA135] bg-clip-text text-transparent">
                Cabin Crew Excellence
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-10">
              Master the skills, ace the interviews, and land your dream job with The Crew Academy
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold text-lg hover:shadow-2xl transform hover:-translate-y-1 transition flex items-center gap-2"
              >
                Start Free Today
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:border-[#D71920] hover:text-[#D71920] transition"
              >
                Login
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive training platform designed for aspiring cabin crew
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade anytime. No credit card required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.highlighted
                    ? 'ring-4 ring-[#D71920] transform scale-105'
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 mx-auto mb-6 text-[#CBA135]" />
            <h2 className="text-4xl font-bold mb-6">Your Data is Safe With Us</h2>
            <p className="text-lg text-gray-300 mb-8">
              We take security seriously. Your personal information, CV, and training data are encrypted and stored securely. We never share your data with third parties without your explicit consent.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <Check className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="font-bold">256-bit Encryption</p>
              </div>
              <div>
                <Check className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="font-bold">GDPR Compliant</p>
              </div>
              <div>
                <Check className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="font-bold">Secure Cloud Storage</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="/logo.png" alt="The Crew Academy" className="h-12 w-auto" />
            </div>
            <div className="text-center md:text-right text-gray-400">
              <p>&copy; 2024 The Crew Academy. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
