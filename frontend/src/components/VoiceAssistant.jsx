import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, X, Bot, User, CornerDownLeft } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const SPEECH_LANG_MAP = {
  en: 'en-US',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
};

const VoiceAssistant = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'OASIS Operational Intelligence online. Ask me about dock loads, inventory breaches, dispatches, or workforce recommendations.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Setup Web Speech API Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = SPEECH_LANG_MAP[language] || 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // cancel prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = SPEECH_LANG_MAP[language] || 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS playback error:', err);
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by this browser. You can still type queries below!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = SPEECH_LANG_MAP[language] || 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Could not start recognition:', e);
      }
    }
  };

  const handleSendMessage = async (queryToSend) => {
    const text = queryToSend || inputText;
    if (!text || !text.trim()) return;

    const userMessage = { role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/query/', {
        query: text.trim(),
        language: language,
      });

      const aiReply = res.data.response || 'Operational query processed.';
      const assistantMessage = {
        role: 'assistant',
        text: aiReply,
        source: res.data.source,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speakText(aiReply);
    } catch (err) {
      const errorMsg = 'Telemetry engine error. Please check system logs.';
      setMessages((prev) => [...prev, { role: 'assistant', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="glass-card bg-stone-950/95 border border-stone-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-800 bg-stone-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-500 to-[#78350F] flex items-center justify-center text-stone-950 shadow-glow-amber">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-stone-950 rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                {t('voice.assistantTitle')}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  {language.toUpperCase()}
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">Server-Side Multilingual NLU</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? 'Mute Speech Synthesis' : 'Enable Speech Synthesis'}
              className={`p-2 rounded-xl transition-colors ${
                ttsEnabled ? 'text-yellow-400 hover:bg-yellow-900/30' : 'text-stone-500 hover:bg-stone-800'
              }`}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  m.role === 'user'
                    ? 'bg-yellow-500 text-stone-950 font-bold'
                    : 'bg-stone-800 text-yellow-400 border border-stone-700'
                }`}
              >
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-yellow-500 text-stone-950 font-semibold rounded-tr-none shadow-md'
                    : 'bg-stone-900 border border-stone-800 text-stone-200 rounded-tl-none shadow-md'
                }`}
              >
                <p>{m.text}</p>
                {m.source && (
                  <div className="text-[10px] text-stone-400 mt-1 font-mono">
                    Mode: {m.source}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Audio Speaking Animation */}
          {isSpeaking && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-yellow-950/20 border border-yellow-500/30 text-yellow-400 text-xs">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span>{t('voice.speaking')}</span>
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-1 bg-yellow-400 rounded-full audio-bar" />
                <div className="w-1 bg-yellow-400 rounded-full audio-bar" />
                <div className="w-1 bg-yellow-400 rounded-full audio-bar" />
                <div className="w-1 bg-yellow-400 rounded-full audio-bar" />
              </div>
            </div>
          )}

          {/* Listening Pulsing Banner */}
          {isListening && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs animate-pulse">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-400 animate-ping" />
                <span>{t('voice.listening')}</span>
              </div>
              <button
                onClick={toggleListening}
                className="text-[10px] text-rose-400 hover:underline font-bold"
              >
                Stop
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-stone-400 p-2">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span>{t('voice.processing')}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-stone-800/80 bg-stone-950/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {t('voice.samplePrompts')?.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 whitespace-nowrap text-[10px] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-stone-800 bg-stone-900 flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 shadow-glow-amber animate-pulse'
                : 'bg-stone-800 text-yellow-400 border-stone-700 hover:border-yellow-500/50'
            }`}
            title="Speak into Microphone"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t('voice.typeFallback')}
            className="flex-1 bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:border-yellow-500 outline-none"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="p-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 transition-colors disabled:opacity-40 shadow-glow-amber"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
