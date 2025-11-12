import { Plane, CheckCircle, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import { openDayStages, calculateScore, getPerformanceFeedback } from '../data/openDaySimulation';
import { useNavigate } from 'react-router-dom';

type SimulationState = 'welcome' | 'in-progress' | 'results';

export default function OpenDaySimulatorPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const isPro = currentUser?.plan === 'pro' || currentUser?.plan === 'vip';
  const isVip = currentUser?.plan === 'vip';

  const [simulationState, setSimulationState] = useState<SimulationState>('welcome');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const currentStage = openDayStages[currentStageIndex];
  const currentQuestion = currentStage?.questions[currentQuestionIndex];
  const totalStages = openDayStages.length;
  const progress = ((currentStageIndex + 1) / totalStages) * 100;

  const startSimulation = () => {
    setSimulationState('in-progress');
    setCurrentStageIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer('');
    setShowFeedback(false);
  };

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer && currentQuestion.type === 'multiple-choice') return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }));

    if (currentQuestion.type === 'multiple-choice') {
      const selectedOption = currentQuestion.options?.find((opt) => opt.id === selectedAnswer);
      const isCorrect = selectedOption?.isCorrect || false;

      setFeedbackMessage(
        isCorrect ? currentQuestion.correctFeedback : currentQuestion.incorrectFeedback || ''
      );
      setShowFeedback(true);
    } else {
      setFeedbackMessage(currentQuestion.correctFeedback);
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer('');

    if (currentQuestionIndex < currentStage.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentStageIndex < totalStages - 1) {
      setCurrentStageIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      setSimulationState('results');
    }
  };

  const renderWelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-gray-200">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-full flex items-center justify-center mx-auto mb-6">
            <Plane className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#000000] mb-3">Simulated Open Day Experience</h1>
          <p className="text-lg text-gray-600">
            Prepare for every stage of your Emirates Cabin Crew recruitment
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-[#000000] mb-4">What to Expect:</h2>
          <div className="space-y-3">
            {openDayStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="text-2xl">{stage.icon}</div>
                <div>
                  <h3 className="font-bold text-[#000000]">{stage.title}</h3>
                  <p className="text-sm text-gray-700">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> This simulation takes approximately 10-15 minutes. You'll receive
            instant feedback after each stage and a detailed performance report at the end.
          </p>
        </div>

        <button
          onClick={startSimulation}
          className="w-full px-8 py-4 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition flex items-center justify-center gap-3"
        >
          <Plane className="w-6 h-6" />
          Start Simulation
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );

  const renderSimulation = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-[#000000]">
              {currentStage.icon} {currentStage.title}
            </h2>
            <p className="text-gray-600">{currentStage.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Stage {currentStageIndex + 1} of {totalStages}</div>
            <div className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {currentStage.questions.length}
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-[#D71921] to-[#FFD700]"
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showFeedback ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h3 className="text-xl font-bold text-[#000000] mb-4">{currentQuestion.question}</h3>
            {currentQuestion.description && (
              <p className="text-sm text-gray-600 mb-6">{currentQuestion.description}</p>
            )}

            {currentQuestion.type === 'multiple-choice' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition ${
                      selectedAnswer === option.id
                        ? 'border-[#D71921] bg-red-50'
                        : 'border-gray-200 hover:border-[#D71921] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedAnswer === option.id
                            ? 'border-[#D71921] bg-[#D71921]'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedAnswer === option.id && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-[#000000]">{option.id})</span>{' '}
                        <span className="text-gray-700">{option.text}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'open-text' && (
              <textarea
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Write your answer here..."
                className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition resize-none"
              />
            )}

            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Submit Answer
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-2xl shadow-lg p-8"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#000000] mb-2">Feedback</h3>
                <p className="text-gray-800">{feedbackMessage}</p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {currentStageIndex === totalStages - 1 && currentQuestionIndex === currentStage.questions.length - 1
                ? 'See Results'
                : 'Next Question'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderResults = () => {
    const scoreData = calculateScore(answers);
    const feedback = getPerformanceFeedback(scoreData.percentage);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-[#000000]" />
            </div>
            <h1 className="text-3xl font-bold text-[#000000] mb-2">{feedback.title}</h1>
            <p className="text-lg text-gray-600">{feedback.message}</p>
          </div>

          <div className="bg-gradient-to-r from-[#D71921] to-[#B91518] rounded-2xl p-8 text-white mb-8">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{scoreData.percentage}%</div>
              <div className="text-xl">
                {scoreData.score} out of {scoreData.total} correct
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-[#000000] mb-4">Recommendations for Improvement:</h3>
            <ul className="space-y-3">
              {feedback.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {isVip && (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#000000]" />
                </div>
                <h3 className="text-lg font-bold text-amber-900">VIP Exclusive: Deep Review</h3>
              </div>
              <p className="text-sm text-amber-800 mb-4">
                Discuss your results with your AI Trainer for personalized improvement strategies.
              </p>
              <button
                onClick={() => navigate('/ai-trainer')}
                className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-[#000000] rounded-lg font-bold hover:shadow-lg transition"
              >
                Talk to AI Trainer
              </button>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={startSimulation}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Retry Simulation
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Return to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!isPro) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-full flex items-center justify-center mx-auto mb-6">
            <Plane className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#000000] mb-4">Open Day Simulator</h1>
          <p className="text-lg text-gray-700 mb-6">
            Exclusive for Pro and VIP members. Upgrade to practice your Open Day simulation and get
            instant feedback on your performance.
          </p>
          <button
            onClick={() => navigate('/upgrade')}
            className="px-8 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            Upgrade Now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      {simulationState === 'welcome' && renderWelcomeScreen()}
      {simulationState === 'in-progress' && renderSimulation()}
      {simulationState === 'results' && renderResults()}
    </div>
  );
}
