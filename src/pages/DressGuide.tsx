import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const sections = [
  {
    title: 'Grooming Standards',
    items: [
      'Hair should be neatly styled and well-maintained',
      'For women: Hair tied back in a neat bun or elegant updo',
      'For men: Short, professional haircut with no facial hair',
      'Minimal, natural-looking makeup for women',
      'Clean, well-manicured nails (neutral colors only)',
      'No visible tattoos or body piercings (except single earrings for women)',
      'Fresh, subtle fragrance (avoid overpowering scents)',
    ],
  },
  {
    title: 'Interview Attire',
    items: [
      'Women: Knee-length skirt suit or tailored dress in dark colors',
      'Men: Dark suit with white or light blue shirt and conservative tie',
      'Closed-toe, polished shoes with moderate heels (women) or dress shoes (men)',
      'Minimal jewelry (watch, simple earrings, wedding ring)',
      'Professional briefcase or portfolio',
      'Ensure clothes are clean, pressed, and fit properly',
      'Avoid bold patterns, bright colors, or casual fabrics',
    ],
  },
  {
    title: 'Professional Posture & Etiquette',
    items: [
      'Stand tall with shoulders back and head held high',
      'Maintain eye contact during conversations',
      'Offer a firm, confident handshake',
      'Smile genuinely and warmly',
      'Use appropriate hand gestures (not excessive)',
      'Sit upright with hands in lap or on armrests',
      'Avoid crossing arms (appears defensive)',
      'Listen actively and nod to show engagement',
      'Speak clearly and at a moderate pace',
      'Show respect and courtesy to everyone you meet',
    ],
  },
  {
    title: 'Common Mistakes to Avoid',
    items: [
      '❌ Arriving late or unprepared',
      '❌ Wearing casual clothing or sneakers',
      '❌ Heavy makeup or strong perfume',
      '❌ Visible tattoos or excessive piercings',
      '❌ Chewing gum during the interview',
      '❌ Using your phone in waiting areas',
      '❌ Speaking negatively about previous employers',
      '❌ Slouching or appearing disinterested',
      '❌ Interrupting the interviewer',
      '❌ Being overly familiar or casual',
      '❌ Forgetting required documents',
    ],
  },
];

export default function DressGuide() {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCompleted(userDoc.data().progress.dressGuide);
        }
      }
    };
    fetchProgress();
  }, []);

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        'progress.dressGuide': true,
      });
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3EF] to-white pb-24">
      <div className="bg-[#2C2C2C] text-white px-6 py-12 rounded-b-3xl shadow-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Dress & Conduct</h1>
          <p className="text-gray-300">
            Master grooming standards and professional etiquette
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        <div className="bg-gradient-to-r from-[#C8A14B] to-[#D4AF37] rounded-2xl shadow-lg p-6 text-white mb-6">
          <h3 className="text-xl font-bold mb-2">First Impressions Matter</h3>
          <p className="text-sm">
            Emirates cabin crew represent a luxury brand. Your appearance and conduct reflect the company's standards of excellence.
          </p>
        </div>

        <div className="space-y-6 mb-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold text-[#2C2C2C] mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex items-start gap-3 text-[#2C2C2C]"
                  >
                    {item.startsWith('❌') ? (
                      <span className="text-xl flex-shrink-0">❌</span>
                    ) : (
                      <div className="w-2 h-2 bg-[#C8A14B] rounded-full mt-2 flex-shrink-0" />
                    )}
                    <span className="leading-relaxed">{item.replace('❌ ', '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-[#F5F3EF] rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">
            Reach Test Requirement
          </h3>
          <p className="text-[#2C2C2C] leading-relaxed">
            You must be able to reach 212cm on tiptoes to access overhead compartments safely. Practice this before your assessment day. Stand naturally, reach up with both arms, and ensure you can comfortably touch the 212cm mark.
          </p>
        </div>

        {!completed && (
          <button
            onClick={handleComplete}
            className="w-full bg-[#C8A14B] text-white py-4 rounded-2xl font-semibold hover:bg-[#B8914B] transition shadow-lg mb-6 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Mark as Complete
          </button>
        )}

        <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">
            ✨ Get Your Personalized Grooming Report
          </h3>
          <p className="text-sm mb-4">
            Upload your photo for AI-powered analysis of your interview appearance with personalized improvement suggestions
          </p>
          <div className="inline-block bg-white text-[#D71920] px-6 py-2 rounded-xl font-semibold text-sm">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
