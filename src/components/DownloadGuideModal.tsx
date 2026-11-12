import React from 'react';
import { X, Download, FileAudio, FileCode, CheckCircle2, Smartphone, Monitor, Sparkles, FolderArchive } from 'lucide-react';
import { VoiceMode } from '../types';

interface DownloadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: VoiceMode;
}

export const DownloadGuideModal: React.FC<DownloadGuideModalProps> = ({
  isOpen,
  onClose,
  mode,
}) => {
  if (!isOpen) return null;

  const isGf = mode === 'girlfriend';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl ${isGf ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-bengali">ফাইল ডাউনলোড করার সহজ নিয়ম</h3>
              <p className="text-xs text-slate-400">অডিও ফাইল এবং প্রজেক্ট কোড ডাউনলোড গাইড</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
          {/* Method 1: Voice Audio Download */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
              <FileAudio className="w-4 h-4" />
              <span className="font-bengali">১. পূজার কণ্ঠের অডিও ফাইল (.WAV) ডাউনলোড:</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-bengali">
              অ্যাপের যেকোনো ভয়েস আপনি সরাসরি অডিও ফাইল হিসেবে ডাউনলোড করে ফোনে বা পিসিতে সেভ করতে পারেন:
            </p>
            <ul className="space-y-2 text-slate-300 font-bengali pl-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>ভয়েস স্টুডিও (TTS Studio):</strong> কথা লিখে বা যেকোনো প্রিসেটে ক্লিক করে <em>"ভয়েস শুনুন"</em> চাপলে সাথে সাথেই পাশে সবুজ <strong>"ডাউনলোড WAV"</strong> বাটন চলে আসবে।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>কথোপকথন (Chat):</strong> পূজার প্রতিটি উত্তরের নিচে <em>"ভয়েস শুনুন"</em>-এর ঠিক পাশেই <strong>"ডাউনলোড WAV"</strong> বাটন রয়েছে। ক্লিক করলেই ফাইল সাথে সাথে ডাউনলোড শুরু হবে।
                </span>
              </li>
            </ul>
          </div>

          {/* Method 2: Device Specific Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span>মোবাইল ফোনে:</span>
              </div>
              <p className="text-slate-400 font-bengali text-[11px] leading-relaxed">
                ডাউনলোড বাটনে ট্যাপ করলে আপনার ফোনের <strong>Downloads / Files</strong> ফোল্ডারে হাই-কোয়ালিটি 24kHz WAV অডিও ফাইল হিসেবে জমা হবে।
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>কম্পিউটারে:</span>
              </div>
              <p className="text-slate-400 font-bengali text-[11px] leading-relaxed">
                ব্রাউজারের ডাউনলোড বারে ক্লিক করে ফাইলটি ওপেন করতে পারবেন বা যেকোনো মিডিয়া প্লেয়ারে বাজাতে পারবেন।
              </p>
            </div>
          </div>

          {/* Method 3: Android Debug APK Direct Download */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <Smartphone className="w-4 h-4" />
                <span className="font-bengali">২. অ্যান্ড্রয়েড অ্যাপ (app-debug.apk) ডাউনলোড:</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Android APK
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed font-bengali">
              ফোনে ইনস্টল করার জন্য বিল্ড করা Debug APK ফাইলটি প্রজেক্টের রুট ডিরেক্টরিতে (<code>/app-debug.apk</code>) রয়েছে। নিচের বাটন থেকে সরাসরি ডাউনলোড করতে পারেন:
            </p>
            <a
              href="/app-debug.apk"
              download="app-debug.apk"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>app-debug.apk ডাউনলোড করুন</span>
            </a>
          </div>

          {/* Method 4: Entire Source Code / Project */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
              <FolderArchive className="w-4 h-4" />
              <span className="font-bengali">৩. সম্পূর্ণ অ্যাপের কোড ও ফাইল ডাউনলোড:</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-bengali">
              আপনি যদি পুরো প্রজেক্ট ফাইল (React, Tailwind, Express Server, Gemini AI) ডাউনলোড করতে চান:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-bengali pl-1 text-[11px]">
              <li>Google AI Studio স্ক্রিনের উপরের মেনু থেকে <strong>Export</strong> বা <strong>GitHub / Download</strong> অপশনটি ব্যবহার করুন।</li>
              <li>অথবা গিট রিপোজিটরি হিসেবে ক্লোন করে সম্পূর্ণ সোর্স কোড আপনার কম্পিউটারে রান করাতে পারেন।</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-xl text-xs font-semibold text-white shadow-md active:scale-95 transition ${
              isGf
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700'
            }`}
          >
            বুঝেছি, ধন্যবাদ!
          </button>
        </div>
      </div>
    </div>
  );
};
