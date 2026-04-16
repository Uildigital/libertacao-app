import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Sparkles, MessageCircle, ArrowRight, Loader2, Play, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

function App() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('libertacao_user_id'));
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [tempId, setTempId] = useState('');

  const whatsappUrl = userId ? `https://wa.me/${userId.split('@')[0]}?text=Olá! Estou pronto para minha prática de hoje.` : '';

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      const { data: journeyData } = await supabase
        .from('healing_journeys')
        .select('*')
        .eq('session_id', userId)
        .eq('status', 'active')
        .single();
      
      if (journeyData) {
        setJourney(journeyData);
      } else {
        setJourney(null);
      }

      const { data: logsData } = await supabase
        .from('emotions_log')
        .select('*')
        .eq('session_id', userId)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (logsData) setLogs(logsData || []);
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  const handleIdentify = (id: string) => {
    const formattedId = id.includes('@') ? id : `${id.replace(/\D/g, '')}@s.whatsapp.net`;
    localStorage.setItem('libertacao_user_id', formattedId);
    setUserId(formattedId);
  };

  const startJourney = async (diagnostic: any) => {
    if (!userId) return;
    setLoading(true);
    const theme = diagnostic.area === 'health' ? 'Cura do Corpo' : 
                  diagnostic.area === 'money' ? 'Prosperidade Infinita' : 
                  diagnostic.area === 'relationships' ? 'Harmonia e Amor' : 'Propósito de Vida';
    
    const affirmation = `Eu libero o padrão de ${diagnostic.pattern} e abro meu coração para a ${theme.toLowerCase()}.`;

    const { data } = await supabase
      .from('healing_journeys')
      .insert({
        session_id: userId,
        theme: theme,
        affirmation: affirmation,
        current_day: 1,
        max_days: 21,
        status: 'active'
      })
      .select()
      .single();

    if (data) {
      await supabase.from('emotions_log').insert({
        session_id: userId,
        user_message: `Diagnóstico Inicial: Área: ${diagnostic.area}, Padrão: ${diagnostic.pattern}. Nota: ${diagnostic.notes}`,
        emotion_tag: 'initial_diagnostic'
      });
      setJourney(data);
    }
    setLoading(false);
  };

  const resetJourney = async () => {
    if (!userId || !confirm("Deseja realmente reiniciar sua jornada? Os dados atuais serão arquivados.")) return;
    setLoading(true);
    await supabase
      .from('healing_journeys')
      .update({ status: 'completed' })
      .eq('session_id', userId)
      .eq('status', 'active');
    
    setJourney(null);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('libertacao_user_id');
    setUserId(null);
    setJourney(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Sparkles className="text-green-700 animate-pulse" size={48} />
    </div>
  );

  if (!userId) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col justify-center items-center max-w-lg mx-auto">
        <Wind className="text-green-800 mb-8 animate-pulse" size={64} />
        <h2 className="text-4xl font-serif text-slate-800 mb-4 text-center">Boas-vindas ao Espaço</h2>
        <p className="text-slate-500 mb-12 text-center">Digite seu WhatsApp para acessar sua jornada de cura.</p>
        <div className="w-full space-y-4">
          <input 
            type="text"
            placeholder="Ex: 5581999999999"
            className="input-zen text-center"
            value={tempId}
            onChange={(e) => setTempId(e.target.value)}
          />
          <button 
            onClick={() => handleIdentify(tempId)}
            disabled={!tempId}
            className="w-full py-5 rounded-2xl bg-green-900 text-white font-bold shadow-xl hover:bg-green-800 transition-all active:scale-95 disabled:opacity-30"
          >
            Acessar Meu Espaço
          </button>
        </div>
      </div>
    );
  }

  if (!journey) {
    return <Onboarding onComplete={startJourney} profileName="você" onBack={logout} />;
  }

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto pb-20 relative overflow-hidden">
      {/* Background Floating Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -30, 0], 
              rotate: [0, 10, 0],
              opacity: [0.05, 0.15, 0.05] 
            }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-green-200 rounded-full blur-[100px]"
            style={{ 
              width: 200 + i * 50, 
              height: 200 + i * 50, 
              left: `${(i * 30) % 100}%`, 
              top: `${(i * 20) % 100}%` 
            }}
          />
        ))}
      </div>

      <header className="relative z-10 text-center mt-12 mb-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-3 py-1 rounded-full bg-green-100 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-green-800"
        >
          Sua Mentoria Louise Hay
        </motion.div>
        
        {/* User Identity & Actions */}
        <div className="flex justify-center flex-wrap gap-2 mb-6">
          <div className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-700 text-white shadow-lg">
            {userId?.split('@')[0]}
          </div>
          <button
            onClick={resetJourney}
            className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border-none cursor-pointer hover:bg-amber-100"
            title="Reiniciar Jornada"
          >
            Recomeçar
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-400 border-none cursor-pointer hover:bg-slate-200"
          >
            Sair
          </button>
        </div>

        <h1 className="text-6xl font-serif text-slate-800 leading-tight tracking-tight px-4">
          {journey?.theme || 'Caminho de Luz'}
        </h1>
      </header>

      {/* Progress Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-10 mb-8 text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-slate-100"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="364.4"
                initial={{ strokeDashoffset: 364.4 }}
                animate={{ strokeDashoffset: 364.4 - (364.4 * (journey?.current_day || 0)) / 21 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-green-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-serif text-slate-800">{journey?.current_day || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dia</span>
            </div>
          </div>
        </div>
        <div className="text-sm font-medium text-slate-600">Jornada de Transformação</div>
        <div className="text-[10px] tracking-widest text-slate-400 uppercase mt-1">21 Dias de Libertação</div>
      </motion.div>

      {/* Affirmation Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="relative z-10 mb-8"
      >
        <div className="affirmation-card p-12 rounded-[48px] relative overflow-hidden group">
          <Wind className="absolute -right-12 -bottom-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000" size={200} />
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-amber-400" size={24} />
            <span className="text-xs font-bold tracking-widest opacity-60 uppercase">Afirmação de Poder</span>
          </div>
          <p className="text-3xl font-serif italic leading-snug mb-10">
            "{journey?.affirmation || 'Estou em paz com o processo da vida.'}"
          </p>
          <button 
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="w-full flex items-center justify-center gap-3 bg-white text-green-950 px-8 py-5 rounded-2xl font-bold hover:bg-green-50 transition-all shadow-xl active:scale-[0.98] border-none cursor-pointer"
          >
            Sintonizar no WhatsApp <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>

      {/* Mentor's Insight (NEW) */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 mb-12 px-2"
      >
        <div className="flex items-center gap-2 mb-6">
          <Wind className="text-green-600" size={18} />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Sua Mentora Louise Diz</h3>
        </div>
        <div className="glass-panel p-8 border-l-4 border-l-green-600">
          <p className="text-slate-700 leading-relaxed italic">
            {diagnosticInsight(journey?.theme)}
          </p>
        </div>
      </motion.section>

      {/* Healing Moments */}
      <section className="relative z-10 px-2 pb-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="text-rose-400" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Momentos de Cura</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{logs.length} registros</span>
        </div>
        
        <div className="space-y-6">
          {logs.length > 0 ? logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-slate-300 uppercase letter-spacing-1">
                  {new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="w-2 h-2 rounded-full bg-green-400 opacity-50" />
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Você</p>
                    <p className="text-slate-600 italic">"{log.user_message}"</p>
                  </div>
                </div>

                {log.ai_response && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50/50 p-4 rounded-2xl border border-green-100"
                  >
                    <p className="text-green-800 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                      <Wind size={10} /> Mentora
                    </p>
                    <p className="text-green-900 text-sm leading-relaxed">
                      {log.ai_response}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-10 opacity-30 italic">Nenhum registro ainda...</div>
          )}
        </div>
      </section>
    </div>
  );
}

function Onboarding({ onComplete, profileName, onBack }: { onComplete: (data: any) => void, profileName: string, onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [diagnostic, setDiagnostic] = useState({
    area: '',
    pattern: '',
    notes: ''
  });

  const steps = [
    {
      title: `Bem-vindo.`,
      subtitle: "Vamos começar sua jornada de 21 dias. Qual área da sua vida mais precisa de atenção e cura agora?",
      options: [
        { id: 'health', label: 'Saúde e Vitalidade', icon: Heart },
        { id: 'money', label: 'Prosperidade e Carreira', icon: Sparkles },
        { id: 'relationships', label: 'Amor e Relacionamentos', icon: MessageCircle },
        { id: 'self', label: 'Autoestima e Paz Interior', icon: Wind }
      ],
      field: 'area'
    },
    {
      title: "Identificando o Padrão",
      subtitle: "Louise Hay ensina que 4 padrões causam a maioria dos nossos bloqueios. Qual você sente mais presente?",
      options: [
        { id: 'criticismo', label: 'Criticismo (Julgar a si ou aos outros)', icon: Wind },
        { id: 'culpa', label: 'Culpa (Sentir-se errado ou insuficiente)', icon: Heart },
        { id: 'ressentimento', label: 'Ressentimento (Mágoas do passado)', icon: MessageCircle },
        { id: 'medo', label: 'Medo (Ansiedade com o futuro)', icon: Sparkles }
      ],
      field: 'pattern'
    },
    {
      title: "Espaço de Desabafo",
      subtitle: "Se você pudesse liberar uma única dor ou queixa hoje, o que seria? Escreva brevemente.",
      field: 'notes'
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
    else onComplete(diagnostic);
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center max-w-lg mx-auto overflow-hidden">
      <div className="mb-12 flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`progress-dot ${step >= i ? 'active' : ''}`} />
          ))}
        </div>
        {step === 1 && (
          <button onClick={onBack} className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 border-none bg-none cursor-pointer">
            Voltar
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="step-container"
        >
          <h2 className="text-4xl font-serif text-slate-800 mb-2">{currentStep.title}</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">{currentStep.subtitle}</p>

          {currentStep.options ? (
            <div className="grid gap-3">
              {currentStep.options.map((opt: any) => (
                <button
                  key={opt.id}
                  onClick={() => setDiagnostic({ ...diagnostic, [currentStep.field]: opt.id })}
                  className={`option-btn flex items-center gap-4 ${diagnostic[currentStep.field as keyof typeof diagnostic] === opt.id ? 'selected' : ''}`}
                >
                  <opt.icon size={20} className={diagnostic[currentStep.field as keyof typeof diagnostic] === opt.id ? 'text-green-700' : 'text-slate-300'} />
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="input-zen h-40 resize-none"
              placeholder="Escreva aqui com o coração..."
              value={diagnostic.notes}
              onChange={(e) => setDiagnostic({ ...diagnostic, notes: e.target.value })}
            />
          )}

          <button
            disabled={step < 3 && !diagnostic[currentStep.field as keyof typeof diagnostic]}
            onClick={handleNext}
            className="mt-8 w-full py-5 rounded-2xl bg-green-900 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-green-800 transition-colors shadow-lg"
          >
            {step === 3 ? 'Iniciar Minha Jornada' : 'Continuar'}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function diagnosticInsight(theme: string) {
  const insights: any = {
    'Cura do Corpo': '"Eu ouço com amor as mensagens do meu corpo. Meu corpo está sempre trabalhando para a saúde perfeita."',
    'Prosperidade Infinita': '"Meu rendimento está constantemente aumentando. Eu passo de um sucesso para outro maior ainda."',
    'Harmonia e Amor': '"O amor acontece! Eu agora me liberto do desejo de controlar as pessoas em minha vida."',
    'Propósito de Vida': '"Eu estou no lugar certo, na hora certa, fazendo a coisa certa. Minha vida é uma alegria."'
  };
  return insights[theme] || '"Tudo está bem no meu mundo. De tudo isso, apenas o bem virá. Estou em segurança."';
}

export default App;
