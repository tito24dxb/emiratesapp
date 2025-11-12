export interface SimulationQuestion {
  id: string;
  type: 'multiple-choice' | 'open-text';
  question: string;
  description?: string;
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  correctFeedback: string;
  incorrectFeedback?: string;
}

export interface SimulationStage {
  id: number;
  title: string;
  description: string;
  icon: string;
  questions: SimulationQuestion[];
}

export const openDayStages: SimulationStage[] = [
  {
    id: 1,
    title: 'Grooming & Presentation',
    description: 'First impressions matter. Show you understand Emirates professional standards.',
    icon: '✨',
    questions: [
      {
        id: 'grooming-1',
        type: 'multiple-choice',
        question: 'You are attending the Open Day. What should your grooming look like?',
        options: [
          {
            id: 'A',
            text: 'Light natural makeup, hair neatly tied back, professional attire',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'Heavy perfume, casual smart clothes, loose hair',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'Bright nail polish, jeans and sneakers, bold makeup',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Perfect! Emirates values professionalism and elegance. Natural makeup and neat presentation show you understand their standards.',
        incorrectFeedback: 'Remember, Emirates expects professional, subtle grooming. Natural makeup and conservative styling are key.',
      },
      {
        id: 'grooming-2',
        type: 'multiple-choice',
        question: 'What is the appropriate dress code for male candidates at an Emirates Open Day?',
        options: [
          {
            id: 'A',
            text: 'Dark suit, white shirt, conservative tie, polished dress shoes',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'Smart jeans, polo shirt, casual loafers',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'Business casual with no tie, sports jacket',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Excellent! A formal dark suit shows respect and professionalism.',
        incorrectFeedback: 'Emirates expects formal business attire. A dark suit with tie is essential.',
      },
    ],
  },
  {
    id: 2,
    title: 'Group Interaction',
    description: 'Demonstrate your teamwork and communication skills.',
    icon: '👥',
    questions: [
      {
        id: 'group-1',
        type: 'multiple-choice',
        question: "You're placed in a team to build a paper tower. One member disagrees loudly with the group's approach. What do you do?",
        options: [
          {
            id: 'A',
            text: 'Stay calm, listen to their concerns, and help mediate politely',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'Ignore them and continue working on your own idea',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'Argue back to prove your point is better',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Excellent teamwork mindset! Emirates values conflict resolution and inclusive communication.',
        incorrectFeedback: 'Cabin crew must handle conflicts diplomatically. Active listening and mediation are crucial skills.',
      },
      {
        id: 'group-2',
        type: 'multiple-choice',
        question: 'During a group discussion, you notice a quiet member hasn\'t contributed. What do you do?',
        options: [
          {
            id: 'A',
            text: 'Politely ask for their opinion and encourage their input',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'Focus on the active members to save time',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'Take over the discussion to move things forward',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Great leadership! Including everyone shows emotional intelligence and team awareness.',
        incorrectFeedback: 'Emirates looks for candidates who ensure everyone feels valued and heard.',
      },
    ],
  },
  {
    id: 3,
    title: 'English Communication',
    description: 'Test your B2-level English proficiency.',
    icon: '📖',
    questions: [
      {
        id: 'english-1',
        type: 'multiple-choice',
        question: 'Choose the correct form: The passengers ___ waiting for boarding.',
        options: [
          {
            id: 'A',
            text: 'is',
            isCorrect: false,
          },
          {
            id: 'B',
            text: 'are',
            isCorrect: true,
          },
          {
            id: 'C',
            text: 'was',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Correct! "Are" agrees with the plural subject "passengers".',
        incorrectFeedback: 'The subject "passengers" is plural, requiring "are".',
      },
      {
        id: 'english-2',
        type: 'multiple-choice',
        question: 'Select the most professional response: A passenger asks, "Could you help me with my luggage?"',
        options: [
          {
            id: 'A',
            text: 'Of course, I\'d be happy to assist you.',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'Yeah, sure, no problem.',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'Okay, give me a second.',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Perfect! Professional, polite, and warm - exactly Emirates style.',
        incorrectFeedback: 'Use formal language with passengers. "I\'d be happy to assist" is more professional.',
      },
      {
        id: 'english-3',
        type: 'multiple-choice',
        question: 'Which word best completes this sentence? "We apologize for the ___ delay."',
        options: [
          {
            id: 'A',
            text: 'unexpected',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'unexpecting',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'not expected',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Excellent vocabulary! "Unexpected" is the proper adjective form.',
        incorrectFeedback: '"Unexpected" is the correct form when describing a delay.',
      },
    ],
  },
  {
    id: 4,
    title: 'Customer Service Scenario',
    description: 'Show how you handle real cabin crew situations.',
    icon: '✈️',
    questions: [
      {
        id: 'service-1',
        type: 'multiple-choice',
        question: 'A passenger complains that their seat doesn\'t recline. What\'s your response?',
        options: [
          {
            id: 'A',
            text: 'Apologize sincerely, check the mechanism, and offer to find an alternative seat',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'Tell them to wait until after takeoff to check',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'Explain that some seats don\'t recline and move on',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Perfect response! You showed empathy, took action, and offered solutions.',
        incorrectFeedback: 'Always address concerns immediately with empathy and proactive solutions.',
      },
      {
        id: 'service-2',
        type: 'multiple-choice',
        question: 'A passenger is anxious about turbulence. How do you respond?',
        options: [
          {
            id: 'A',
            text: 'Reassure them calmly, explain it\'s normal, and offer to check on them regularly',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'Tell them turbulence is completely safe and walk away',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'Suggest they take a sleeping pill to relax',
            isCorrect: false,
          },
        ],
        correctFeedback: 'Excellent! You provided reassurance, information, and ongoing support.',
        incorrectFeedback: 'Anxious passengers need empathy, reassurance, and continued attention.',
      },
    ],
  },
  {
    id: 5,
    title: 'Final Personal Question',
    description: 'Share what makes you the perfect Emirates candidate.',
    icon: '🌟',
    questions: [
      {
        id: 'personal-1',
        type: 'open-text',
        question: 'Tell us what makes you a perfect candidate for Emirates cabin crew.',
        description: 'Write 3-5 sentences highlighting your key strengths, relevant experience, and why Emirates specifically.',
        correctFeedback: 'Thank you for sharing! Strong candidates highlight: teamwork, adaptability, customer service excellence, cultural awareness, and genuine passion for Emirates brand.',
      },
    ],
  },
];

export function calculateScore(answers: Record<string, string>): {
  score: number;
  total: number;
  percentage: number;
} {
  let correct = 0;
  let total = 0;

  openDayStages.forEach((stage) => {
    stage.questions.forEach((question) => {
      if (question.type === 'multiple-choice') {
        total++;
        const userAnswer = answers[question.id];
        const correctOption = question.options?.find((opt) => opt.isCorrect);
        if (userAnswer === correctOption?.id) {
          correct++;
        }
      }
    });
  });

  return {
    score: correct,
    total,
    percentage: Math.round((correct / total) * 100),
  };
}

export function getPerformanceFeedback(percentage: number): {
  title: string;
  message: string;
  recommendations: string[];
} {
  if (percentage >= 90) {
    return {
      title: 'Outstanding Performance!',
      message: 'You\'re well-prepared for the Emirates Open Day. Your understanding of professional standards and customer service is excellent.',
      recommendations: [
        'Practice your personal story and motivations',
        'Research Emirates\' latest routes and services',
        'Prepare questions to ask the recruiters',
      ],
    };
  } else if (percentage >= 75) {
    return {
      title: 'Good Performance!',
      message: 'You have a solid foundation. With a bit more preparation, you\'ll be ready to shine at your Open Day.',
      recommendations: [
        'Review Emirates grooming standards in detail',
        'Practice English communication daily',
        'Study customer service scenarios',
      ],
    };
  } else if (percentage >= 60) {
    return {
      title: 'Fair Performance',
      message: 'You\'re on the right track, but there\'s room for improvement. Focus on the key areas highlighted below.',
      recommendations: [
        'Study Emirates brand values and expectations',
        'Improve your English proficiency to B2 level',
        'Practice teamwork and conflict resolution scenarios',
      ],
    };
  } else {
    return {
      title: 'Needs Improvement',
      message: 'Don\'t worry! This simulation shows you what to focus on. With dedicated preparation, you can improve significantly.',
      recommendations: [
        'Take an English course to reach B2 level',
        'Research Emirates thoroughly (website, videos, forums)',
        'Practice with mock interviews and group exercises',
        'Consider working with the AI Trainer for personalized guidance',
      ],
    };
  }
}
