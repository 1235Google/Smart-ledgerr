import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, RefreshCcw, Activity, Lightbulb, Zap, Bell, BarChart3, FileText, PiggyBank, ArrowRight, TrendingDown, WifiOff } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage } from '../services/ai';
import { useNavigate } from 'react-router-dom';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', parts: {text: string, isError?: boolean}[]}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Thinking...');
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { startingBalance, transactions } = useStore();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && lastFailedMessage && !isLoading) {
      handleRetry();
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      document.body.style.overflow = window.innerWidth < 768 ? 'hidden' : 'unset';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [messages, isOpen]);

  const attemptSendMessage = async (textToSend: string, currentMessages: typeof messages) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setLoadingMessage('SmartLedger AI is thinking...');
    setLastFailedMessage(null);

    const received = transactions.filter(t => t.type === 'received').reduce((acc, t) => acc + t.amount, 0);
    const sent = transactions.filter(t => t.type === 'sent').reduce((acc, t) => acc + t.amount, 0);
    const currentBalance = startingBalance + received - sent;

    const userData = {
      startingBalance,
      currentBalance,
      transactions
    };

    let attempts = 0;
    const maxAttempts = 4; // 1 initial + 3 retries
    const apiHistory = currentMessages.slice(0, -1); // Previous messages without the current one

    while (attempts < maxAttempts) {
      try {
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) abortControllerRef.current.abort();
        }, 15000); // 15 seconds timeout

        const data = await sendChatMessage(textToSend, userData, apiHistory, abortControllerRef.current.signal);
        clearTimeout(timeoutId);

        setMessages([...currentMessages, { role: 'model', parts: [{ text: data.text }] }]);
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      } catch (error: any) {
        const status = error.status || 500;
        
        // Log error internally without exposing to UI
        console.log(`[SmartLedger AI Log] Attempt ${attempts + 1}/${maxAttempts} failed. Status: ${status}. Error: ${error.message}`);

        if (attempts < maxAttempts - 1) {
          attempts++;
          setLoadingMessage(`SmartLedger AI is thinking...`);
          const delay = Math.pow(2, attempts - 1) * 1000; // 1s, 2s, 4s
          await new Promise(res => setTimeout(res, delay));
          continue;
        }

        // Final failure
        let userMessage = "We couldn't reach SmartLedger AI right now.\n\nPlease try again in a moment.";
        if (status === 408 || error.message?.includes('timed out')) {
          userMessage = "SmartLedger AI is taking longer than expected.\n\nPlease try again in a moment.";
        }

        setMessages([...currentMessages, { role: 'model', parts: [{ text: userMessage, isError: true }] }]);
        setLastFailedMessage(textToSend);
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const newMessages: typeof messages = [...messages, { role: 'user', parts: [{ text: textToSend }] }];
    setMessages(newMessages);
    if (!textOverride) setInput('');
    
    await attemptSendMessage(textToSend, newMessages);
  };

  const handleRetry = async () => {
    if (!lastFailedMessage || isLoading) return;
    
    // Remove the last error message from the UI before retrying
    const newMessages = messages.filter(m => !(m.role === 'model' && m.parts[0]?.isError));
    setMessages(newMessages);
    
    await attemptSendMessage(lastFailedMessage, newMessages);
  };

  const suggestedQuestions = [
    "Who owes me the most money?",
    "Show today's transactions.",
    "Predict next month's income.",
    "Generate this month's report.",
    "Which customers are frequently late?",
    "Compare this month with last month."
  ];

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-3 rounded-full shadow-lg shadow-indigo-500/30 transition-all font-medium border border-white/10"
          >
            <Sparkles size={20} />
            <span className="hidden sm:inline">Smart AI Assistant</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[60] md:w-[380px] md:h-[600px] md:max-h-[85vh] w-full h-[100dvh] bg-[#0a0b10]/95 md:bg-neutral-900/95 backdrop-blur-2xl md:border md:border-white/10 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Assistant</h3>
                  <p className="text-xs text-indigo-400">Powered by xAI Grok</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMessages([])}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  title="Clear Chat"
                >
                  <MessageSquare size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col space-y-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">SmartLedger AI</h3>
                      <p className="text-sm text-slate-400">Good afternoon, Souvik Dash.</p>
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-white/10" />
                  
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Activity size={16} className="text-blue-400" />
                      </div>
                      <span className="font-semibold text-slate-200">Business Health</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400">94</span>
                      <span className="text-sm text-slate-400"> / 100</span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/10" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <Lightbulb size={16} />
                      Today's Insight
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                      <TrendingDown size={20} className="text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-200/90 leading-relaxed">
                        Pending payments dropped by 18% compared to last month.
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/10" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                      <Zap size={16} />
                      Quick Actions
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { navigate('/pending'); setIsOpen(false); }} className="flex flex-col gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 text-left transition-colors group">
                        <Bell size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-300">Send Reminder</span>
                      </button>
                      <button onClick={() => { navigate('/analytics'); setIsOpen(false); }} className="flex flex-col gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 text-left transition-colors group">
                        <BarChart3 size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-300">View Analytics</span>
                      </button>
                      <button onClick={() => handleSendMessage(undefined, "Generate this month's report.")} className="flex flex-col gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 text-left transition-colors group">
                        <FileText size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-300">Generate Report</span>
                      </button>
                      <button onClick={() => { navigate('/gullak'); setIsOpen(false); }} className="flex flex-col gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 text-left transition-colors group">
                        <PiggyBank size={18} className="text-pink-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-300">Open Gullak</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/10" />

                  <div className="flex flex-col gap-2 w-full pt-1">
                    <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1"><MessageSquare size={12}/> Ask anything... Examples:</p>
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(undefined, q)}
                        className="text-xs py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 text-left transition-colors flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-3 max-w-[90%] md:max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                        msg.role === 'user' ? "bg-indigo-600" : (msg.parts[0]?.isError ? "bg-red-900/50 border border-red-500/50" : "bg-neutral-800 border border-white/10")
                      )}>
                        {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className={msg.parts[0]?.isError ? "text-red-400" : "text-indigo-400"} />}
                      </div>
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-sm flex flex-col gap-2",
                        msg.role === 'user' 
                          ? "bg-indigo-600 text-white rounded-tr-sm" 
                          : (msg.parts[0]?.isError ? "bg-red-500/10 text-red-200 border border-red-500/20 rounded-tl-sm" : "bg-white/10 text-slate-200 rounded-tl-sm")
                      )}>
                        {msg.role === 'user' ? (
                          msg.parts[0].text
                        ) : (
                          <div className={cn("markdown-body prose prose-sm", msg.parts[0]?.isError ? "prose-red" : "prose-invert")}>
                            <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                          </div>
                        )}
                        {msg.parts[0]?.isError && lastFailedMessage && i === messages.length - 1 && (
                          <button
                            onClick={handleRetry}
                            disabled={isLoading}
                            className="flex items-center gap-2 self-start mt-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-xs font-semibold"
                          >
                            <RefreshCcw size={12} />
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={14} className="text-indigo-400" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white/10 text-slate-200 rounded-tl-sm flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 pt-1 pb-1">
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                        </div>
                        {loadingMessage !== 'SmartLedger AI is thinking...' && (
                          <span className="text-xs text-slate-400">{loadingMessage}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/40 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {!isOnline && (
                <div className="mb-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                  <WifiOff size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">No internet connection.</p>
                    <p className="text-xs text-amber-200/90 mt-1">Reconnect to continue.</p>
                  </div>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 min-h-[48px]"
                  disabled={isLoading || !isOnline}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !isOnline}
                  className="absolute right-2 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
