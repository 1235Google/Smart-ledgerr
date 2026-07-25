import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, TrendingUp, Calendar, ArrowRight, Loader2, Sparkles, Plus, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate } from '../lib/utils';

interface GoalSuggestion {
  name: string;
  targetAmount: number;
  predictedDate: string;
  advice: string[];
}

interface SpecificGoalPlan {
  monthlySavings: number;
  predictedDate: string;
  advice: string[];
}

export default function Goals() {
  const { currentBalance, transactions, generalSettings } = useStore();
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const [customGoalName, setCustomGoalName] = useState('');
  const [customGoalAmount, setCustomGoalAmount] = useState('');
  const [customPlan, setCustomPlan] = useState<SpecificGoalPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only load suggestions if we have some transaction history and we haven't loaded yet
    if (transactions.length > 0 && suggestions.length === 0 && !isLoadingSuggestions) {
      loadSuggestions();
    }
  }, [transactions]);

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setError('');
    try {
      const res = await fetch('/api/generate-goal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBalance,
          transactions: transactions.slice(-100), // send last 100 tx
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429 || (errorData.error && errorData.error.includes('429'))) {
           throw new Error('AI rate limit exceeded (429). Please try again in a few moments.');
        }
        throw new Error(errorData.error || 'Failed to load goal suggestions');
      }

      const data = await res.json();
      setSuggestions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const planCustomGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoalName || !customGoalAmount) return;

    setIsPlanning(true);
    setCustomPlan(null);
    setError('');

    try {
      const res = await fetch('/api/generate-goal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBalance,
          transactions: transactions.slice(-100),
          targetGoalName: customGoalName,
          targetGoalAmount: Number(customGoalAmount),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429 || (errorData.error && errorData.error.includes('429'))) {
           throw new Error('AI rate limit exceeded (429). Please try again in a few moments.');
        }
        throw new Error(errorData.error || 'Failed to plan goal');
      }

      const data = await res.json();
      setCustomPlan(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not plan this goal');
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400">
            <Target size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Goal Planner</h1>
        </div>
        <p className="text-slate-400">Set targets and let AI predict your achievement date based on your habits.</p>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Custom Goal Planner */}
        <div className="space-y-6">
          <div className="bg-[#0a0b10] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Plus size={20} className="text-indigo-400" />
              Plan a Custom Goal
            </h2>
            
            <form onSubmit={planCustomGoal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-400">Goal Name</label>
                <input
                  type="text"
                  value={customGoalName}
                  onChange={(e) => setCustomGoalName(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl min-h-[48px] px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors text-sm"
                  placeholder="e.g. New Car, Dream Vacation"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-400">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={customGoalAmount}
                    onChange={(e) => setCustomGoalAmount(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl min-h-[48px] pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors text-sm"
                    placeholder="50000"
                    required
                    min="1"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPlanning || !customGoalName || !customGoalAmount}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold min-h-[48px] rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-600/30"
              >
                {isPlanning ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing Habits...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Predict Achievement
                  </>
                )}
              </button>
            </form>

            {customPlan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 pt-6 border-t border-white/5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Estimated Monthly Savings</p>
                    <p className="text-xl font-bold text-white mt-1">{formatCurrency(customPlan.monthlySavings)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Predicted Date</p>
                    <p className="text-xl font-bold text-indigo-400 mt-1 flex items-center justify-end gap-2">
                      <Calendar size={18} />
                      {formatDate(customPlan.predictedDate, generalSettings?.timezone)}
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mt-4">
                  <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-3">
                    <TrendingUp size={16} />
                    AI Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {customPlan.advice.map((adv, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-purple-400" />
              AI Suggested Goals
            </h2>
            <button 
              onClick={loadSuggestions} 
              disabled={isLoadingSuggestions}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
            >
              {isLoadingSuggestions ? <Loader2 size={14} className="animate-spin" /> : null}
              Refresh
            </button>
          </div>

          {isLoadingSuggestions && suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
              <Loader2 size={32} className="animate-spin text-purple-500/50" />
              <p className="text-sm">Analyzing your spending patterns...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((goal, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-[#0a0b10] border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">{goal.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">Target: {formatCurrency(goal.targetAmount)}</p>
                    </div>
                    <div className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(goal.predictedDate, generalSettings?.timezone)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {goal.advice.map((adv, i) => (
                      <div key={i} className="flex gap-2 text-sm text-slate-300 bg-white/5 p-2 rounded-lg">
                        <ArrowRight size={14} className="text-purple-400 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
             <div className="bg-[#0a0b10] border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-400 mb-4">
                <Target size={32} />
              </div>
              <p className="text-slate-300 font-medium">No suggestions yet</p>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">Add more transactions so AI can understand your spending habits better.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
