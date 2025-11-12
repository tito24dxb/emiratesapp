import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const questions = [
  {
    question: 'Why do you want to work for Emirates?',
    answer: `Emirates values genuine passion for aviation and cultural diversity. A strong answer should include:

• Admiration for Emirates' global reputation and five-star service
• Excitement about living in Dubai and experiencing diverse cultures
• Alignment with Emirates' values of excellence and hospitality
• Specific examples of why Emirates stands out (fleet, destinations, service standards)
• Personal connection to aviation or travel

Example: "Emirates represents the pinnacle of aviation excellence. I'm inspired by your commitment to exceptional service and cultural diversity. Living in Dubai while serving passengers from around the world aligns perfectly with my passion for cultural exchange and hospitality."`,
  },
  {
    question: 'Describe a time you handled a difficult customer',
    answer: `Emirates values calm professionalism and problem-solving. Structure your answer using STAR method:

Situation: Describe the context briefly
Task: Explain your responsibility
Action: Detail the steps you took
Result: Share the positive outcome

Key points to emphasize:
• Active listening and empathy
• Staying calm under pressure
• Creative problem-solving
• Turning a negative into a positive
• Following protocols while being flexible

Example: "At my retail job, a customer was upset about a delayed order for their anniversary. I listened empathetically, apologized sincerely, expedited a replacement, and included a complimentary upgrade. They left satisfied and later returned as a loyal customer."`,
  },
  {
    question: 'How would you deal with a disruptive passenger onboard?',
    answer: `This tests your conflict resolution and safety awareness:

• Remain calm and professional
• Assess the situation and any safety risks
• Approach with empathy and respect
• Use de-escalation techniques
• Follow Emirates' procedures
• Involve senior crew or captain if needed
• Document the incident appropriately

Example: "I would approach calmly, speak respectfully, and try to understand their concern. I'd use active listening and offer solutions within policy. If they remained disruptive, I'd follow Emirates' protocols, involving senior crew and documenting everything. Safety and professionalism are my priorities."`,
  },
  {
    question: 'What does excellent customer service mean to you?',
    answer: `Emirates is known for exceptional service. Highlight:

• Anticipating needs before being asked
• Personalized attention and genuine care
• Going above and beyond expectations
• Creating memorable experiences
• Cultural sensitivity and respect
• Consistency and attention to detail
• Positive attitude even under pressure

Example: "Excellent service means anticipating guests' needs, treating everyone with genuine warmth, and creating memorable moments. It's about personalization—remembering preferences, cultural sensitivity, and exceeding expectations consistently. At Emirates, it means embodying five-star hospitality at 40,000 feet."`,
  },
  {
    question: 'Tell me about yourself',
    answer: `This is your chance to make a strong first impression:

Structure your answer:
• Brief personal background
• Relevant professional experience
• Why you're interested in cabin crew
• What makes you a great fit

Keep it concise (2-3 minutes) and relevant. Focus on:
• Customer service achievements
• Cultural experiences
• Language skills
• Teamwork abilities
• Personal qualities that match the role

Example: "I'm [name], with 5 years in hospitality where I developed strong customer service skills. I've always been passionate about aviation and cultures—I speak 3 languages and have traveled to 20 countries. Emirates combines my love for service, travel, and cultural exchange, and I'm excited to represent your brand's excellence."`,
  },
  {
    question: 'How do you handle working irregular hours?',
    answer: `Cabin crew life requires flexibility. Address:

• Understanding of the role's demands
• Previous experience with shift work
• Personal strategies for maintaining wellbeing
• Positive attitude toward flexibility
• Ability to adapt and stay energized

Example: "I understand cabin crew involves irregular schedules and time zones. In my current role, I work varied shifts and have developed strong routines for rest and nutrition. I'm naturally flexible, energized by variety, and prioritize self-care. The dynamic nature of the role excites me."`,
  },
  {
    question: 'Describe a time you worked in a team',
    answer: `Emirates values collaboration. Use STAR method:

• Choose an example with diverse team members
• Highlight your specific contribution
• Show how you supported others
• Demonstrate communication skills
• Emphasize the collective success

Example: "During a hotel event, our team of 8 managed 200 guests. I coordinated with the kitchen, supported a struggling colleague, and adapted when plans changed. By communicating clearly and staying flexible, we delivered a flawless event. The client praised our seamless teamwork."`,
  },
  {
    question: 'What are your strengths and weaknesses?',
    answer: `Be honest but strategic:

Strengths - Choose 2-3 relevant to cabin crew:
• Communication and interpersonal skills
• Cultural awareness and adaptability
• Problem-solving under pressure
• Attention to detail
• Genuine warmth and service mindset

Weakness - Choose something genuine but not critical:
• Pick something you're actively improving
• Show self-awareness and growth mindset
• Don't say "I'm a perfectionist"

Example Strength: "I'm highly adaptable and culturally sensitive, which helps me connect with diverse people and handle unexpected situations calmly."

Example Weakness: "I sometimes focus too much on details, but I've learned to balance thoroughness with efficiency by setting time limits and prioritizing tasks."`,
  },
  {
    question: 'How would you handle a medical emergency onboard?',
    answer: `This tests your crisis management:

• Stay calm and assess the situation quickly
• Follow safety protocols and training
• Call for medical professionals onboard
• Coordinate with crew and captain
• Provide basic first aid if trained
• Document thoroughly
• Show confidence but acknowledge training limits

Example: "I'd remain calm, immediately alert senior crew, and make a PA asking for medical professionals. I'd follow Emirates' emergency procedures, assist the qualified person, coordinate with the captain, and provide comfort to the passenger. Safety and following protocol are paramount."`,
  },
  {
    question: 'Why should we hire you over other candidates?',
    answer: `Differentiate yourself genuinely:

• Combine your unique experiences
• Highlight specific skills matching Emirates' needs
• Show genuine passion and cultural fit
• Demonstrate understanding of the role
• Be confident but not arrogant

Example: "I bring 5 years of customer service excellence, fluency in 3 languages, and genuine passion for Emirates' multicultural environment. I've consistently exceeded service targets, adapt quickly to challenges, and embody the warmth and professionalism Emirates represents. I'm not just seeking a job—I'm committed to representing your brand's excellence globally."`,
  },
];

export default function InterviewQA() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCompleted(userDoc.data().progress.interviewQA);
        }
      }
    };
    fetchProgress();
  }, []);

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        'progress.interviewQA': true,
      });
      setCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3EF] to-white pb-24">
      <div className="bg-[#C8A14B] text-white px-6 py-12 rounded-b-3xl shadow-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Interview Q&A</h1>
          <p className="text-yellow-100">
            Practice with real Emirates interview questions
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        <div className="space-y-4 mb-6">
          {questions.map((item, index) => (
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
                <h3 className="text-lg font-bold text-[#2C2C2C] pr-4">
                  {item.question}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-[#C8A14B] transition-transform flex-shrink-0 ${
                    expandedIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedIndex === index && (
                <div className="px-6 pb-6">
                  <div className="bg-[#F5F3EF] rounded-xl p-4 whitespace-pre-line text-[#2C2C2C] leading-relaxed">
                    {item.answer}
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

        <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">
            ✨ Try AI CV Analyzer
          </h3>
          <p className="text-sm mb-4">
            Get instant feedback on your CV, practice interviews with AI, and receive personalized improvement suggestions
          </p>
          <div className="inline-block bg-white text-[#D71920] px-6 py-2 rounded-xl font-semibold text-sm">
            Coming Soon in Step Program
          </div>
        </div>
      </div>
    </div>
  );
}
