import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { truncateKey } from '../utils/encryption';
import { User, Key, LogOut, Trash2, Copy, CheckCircle, Award } from 'lucide-react';

export default function Profile() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    publicKey: '',
  });
  const [progress, setProgress] = useState({
    recruitmentStages: false,
    interviewQA: false,
    dressGuide: false,
  });
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name,
            email: data.email,
            publicKey: data.publicKey,
          });
          setProgress(data.progress);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(userData.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      await deleteDoc(doc(db, 'users', user.uid));
      await user.delete();
      localStorage.removeItem('privateKey');
    }
  };

  const completedCount = Object.values(progress).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3EF] to-white pb-24">
      <div className="bg-[#D71920] text-white px-6 py-12 rounded-b-3xl shadow-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-red-100">Manage your account and settings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#D71920] p-4 rounded-full">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C]">
                {userData.name}
              </h2>
              <p className="text-gray-600">{userData.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Key className="w-5 h-5 text-[#C8A14B]" />
              <h3 className="text-lg font-bold text-[#2C2C2C]">
                Public Encryption Key
              </h3>
            </div>
            <div className="bg-[#F5F3EF] rounded-xl p-4 mb-3">
              <code className="text-sm text-[#2C2C2C] break-all">
                {truncateKey(userData.publicKey, 12)}
              </code>
            </div>
            <button
              onClick={handleCopyKey}
              className="flex items-center gap-2 bg-[#C8A14B] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#B8914B] transition"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Public Key
                </>
              )}
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Your public key is used for secure end-to-end encrypted messaging (coming soon)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-[#C8A14B]" />
            <h3 className="text-xl font-bold text-[#2C2C2C]">
              Learning Progress
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#2C2C2C]">Recruitment Stages</span>
              {progress.recruitmentStages ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#2C2C2C]">Interview Q&A</span>
              {progress.interviewQA ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#2C2C2C]">Dress & Conduct</span>
              {progress.dressGuide ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2C2C2C]">
                Total Completed
              </span>
              <span className="text-[#C8A14B] font-bold text-lg">
                {completedCount} / 3
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#C8A14B] to-[#D4AF37] rounded-2xl shadow-lg p-6 text-white mb-6">
          <h3 className="text-xl font-bold mb-2">
            Upgrade to Step Program
          </h3>
          <p className="text-sm mb-4">
            Get AI-powered CV analysis, mock interviews, personalized coaching, and advanced preparation materials
          </p>
          <div className="inline-block bg-white text-[#C8A14B] px-6 py-2 rounded-xl font-semibold text-sm">
            Coming Soon
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-200 text-[#2C2C2C] py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          ) : (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-red-600 font-semibold mb-3 text-center">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-200 text-[#2C2C2C] py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
