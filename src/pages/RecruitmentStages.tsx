import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const stages = [
  {
    title: 'Open Day',
    content: `The Open Day is your first opportunity to make an impression. Here's what to expect:

• Bring all required documents (passport, CV, recent photo)
• Dress professionally in business attire
• Arrive early and be prepared to wait
• Fill out application forms accurately
• Demonstrate positive body language and a warm smile
• Network with other candidates professionally
• Show enthusiasm for Emirates and aviation

Tips: Research Emirates thoroughly, practice your introduction, and be genuine. The recruiters are looking for confident, professional individuals who align with Emirates' values.`,
  },
  {
    title: 'Assessment Day',
    content: `Assessment Day tests your teamwork, communication, and problem-solving skills:

• Group activities with 6-8 candidates
• English proficiency assessment
• Reach test (212cm) and professional appearance check
• Team challenges requiring collaboration
• Individual presentations or role-plays
• Observation of social interaction during breaks

Success Strategy: Be an active but not dominating team member. Listen to others, contribute ideas clearly, maintain eye contact, and show cultural awareness. Emirates values team players who can handle diverse situations calmly.`,
  },
  {
    title: 'Final Interview',
    content: `The Final Interview is a one-on-one assessment with senior recruiters:

• 20-30 minute structured interview
• Questions about your background, motivations, and customer service experience
• Scenario-based questions testing problem-solving
• Assessment of grooming standards and presentation
• Questions about relocation and Emirates lifestyle

Key Points: Show genuine passion for aviation and Emirates. Demonstrate cultural sensitivity, flexibility, and commitment. Be honest but strategic. Highlight customer service achievements and ability to handle challenging situations with grace.`,
  },
  {
    title: 'Post-Selection Medicals',
    content: `After receiving a conditional offer, you'll undergo medical assessments:

• Comprehensive health screening
• Vision and hearing tests
• Blood tests and vaccinations
• Fitness assessment
• Psychological evaluation

Requirements: Meet Emirates' health standards, have corrected vision (glasses/contacts okay), be physically fit, and have no conditions that prevent safe flying. The medical is thorough but standard for aviation roles.`,
  },
];

export default function RecruitmentStages() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCompleted(userDoc.data().progress.recruitmentStages);
        }
      }
    };
    fetchProgress();
  }, []);

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        'progress.recruitmentStages': true,
      });
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3EF] to-white pb-24">
      <div className="bg-[#D71920] text-white px-6 py-12 rounded-b-3xl shadow-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Recruitment Stages</h1>
          <p className="text-red-100">
            Master every step of the Emirates selection process
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        <div className="space-y-4 mb-6">
          {stages.map((stage, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transition hover:shadow-xl"
            >
              <button
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <h3 className="text-xl font-bold text-[#2C2C2C]">
                  {stage.title}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-[#D71920] transition-transform ${
                    expandedIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedIndex === index && (
                <div className="px-6 pb-6">
                  <div className="bg-[#F5F3EF] rounded-xl p-4 whitespace-pre-line text-[#2C2C2C] leading-relaxed">
                    {stage.content}
                  </div>
                </div>
              )}
            </div>
          ))}
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

        <div className="bg-gradient-to-r from-[#C8A14B] to-[#D4AF37] rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">
            Ready for the next level?
          </h3>
          <p className="text-sm mb-4">
            Upgrade to Step Program for personalized coaching, mock interviews with AI feedback, and advanced preparation materials
          </p>
          <div className="inline-block bg-white text-[#C8A14B] px-6 py-2 rounded-xl font-semibold text-sm">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
