import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AICVAnalyzerPlaceholderProps {
  hasAccess: boolean;
}

const mockCVReport = {
  score: 82,
  suggestions: [
    "Add more detail to your hospitality achievements with specific metrics",
    "Show measurable teamwork impact and leadership examples", 
    "Emphasize customer empathy and calmness under pressure",
    "Include international experience or cultural awareness examples",
    "Highlight language skills and communication abilities"
  ],
  strengths: [
    "Strong educational background in hospitality",
    "Relevant work experience in customer service",
    "Professional presentation and clear formatting",
    "Good use of action verbs and achievements"
  ]
};

export default function AICVAnalyzerPlaceholder({ hasAccess }: AICVAnalyzerPlaceholderProps) {
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleUpload = () => {
    if (!hasAccess) return;
    
    setUploaded(true);
    setAnalyzing(true);
    
    setTimeout(() => {
      setAnalyzing(false);
      setShowResults(true);
    }, 3000);
  };

  if (!hasAccess) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <div className="bg-gray-200 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Upload className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-bold text-gray-400 mb-2">AI CV Analyzer</h4>
        <p className="text-gray-500 mb-4">
          Upload your CV for instant Emirates-specific analysis and improvement suggestions
        </p>
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 mb-4">
          <p className="text-gray-400">Drag & drop your CV here or click to browse</p>
        </div>
        <div className="bg-[#C8A14B] text-white px-6 py-2 rounded-xl font-semibold opacity-50">
          Upgrade to Activate
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!uploaded && (
        <div className="bg-[#F5F3EF] rounded-xl p-8 text-center">
          <div className="bg-[#C8A14B] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-bold text-[#2C2C2C] mb-2">AI CV Analyzer</h4>
          <p className="text-gray-600 mb-4">
            Upload your CV for instant Emirates-specific analysis and improvement suggestions
          </p>
          <button
            onClick={handleUpload}
            className="bg-white border-2 border-dashed border-[#C8A14B] rounded-xl p-6 mb-4 hover:bg-[#F5F3EF] transition w-full"
          >
            <p className="text-[#C8A14B] font-semibold">Drag & drop your CV here or click to browse</p>
            <p className="text-sm text-gray-500 mt-1">Supports PDF, DOC, DOCX</p>
          </button>
        </div>
      )}

      {analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="bg-[#C8A14B] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <h4 className="text-lg font-bold text-[#2C2C2C] mb-2">Analyzing Your CV...</h4>
          <p className="text-gray-600">
            Our AI is reviewing your CV against Emirates recruitment standards
          </p>
          <div className="mt-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3 }}
              className="bg-[#C8A14B] h-2 rounded-full"
            />
          </div>
        </motion.div>
      )}

      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-[#C8A14B] to-[#D4AF37] p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#2C2C2C]">CV Analysis Complete</h4>
                <p className="text-gray-600">Emirates Recruitment Compatibility</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#F5F3EF] to-[#F8F6F2] rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#2C2C2C] font-semibold">Overall Score</span>
                <span className="text-4xl font-bold text-[#C8A14B]">{mockCVReport.score}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-4 shadow-inner">
                <div
                  className="bg-gradient-to-r from-[#C8A14B] to-[#D4AF37] h-4 rounded-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${mockCVReport.score}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Excellent foundation! With targeted improvements, you can reach 95%+
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-bold text-[#2C2C2C] mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Improvement Areas
                </h5>
                <ul className="space-y-2">
                  {mockCVReport.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="font-bold text-[#2C2C2C] mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Current Strengths
                </h5>
                <ul className="space-y-2">
                  {mockCVReport.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl p-4 mb-6 text-white">
              <h5 className="font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Enhancement Available
              </h5>
              <p className="text-red-100 text-sm mb-3">
                Get a personalized, Emirates-optimized version of your CV with targeted improvements
              </p>
              <button className="bg-white text-[#D71920] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition">
                Generate Enhanced CV (Coming Soon)
              </button>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-[#C8A14B] text-white py-3 rounded-xl font-semibold hover:bg-[#B8914B] transition shadow-lg">
                Download Report
              </button>
              <button className="flex-1 bg-gray-100 text-[#2C2C2C] py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
                Save Report
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}