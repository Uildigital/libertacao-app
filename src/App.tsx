import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Sparkles, MessageCircle, ArrowRight, Loader2, Play, Wind, CheckCircle2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

function App() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('libertacao_user_id'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('libertacao_user_name'));
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [tempId, setTempId] = useState('');
  const [tempName, setTempName] = useState('');
  const [reflection, setReflection] = useState('');
  const [completing, setCompleting] = useState(false);

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
      
      if (journeyData) setJourney(journeyData);
      else setJourney(null);

      const { data: logsData } = await supabase
        .from('emotions_log')
        .select('*')
        .eq('session_id', userId)
        .order('created_at', { ascending: false });
      
      if (logsData) setLogs(logsData || []);
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  const handleIdentify = async (id: string, name: string) => {
    let cleanId = id.replace(/\D/g, '');
    if (cleanId.length === 11) cleanId = '55' + cleanId;
    const formattedId = `${cleanId}@s.whatsapp.net`;
    localStorage.setItem('libertacao_user_id', formattedId);
    localStorage.setItem('libertacao_user_name', name);
    
    await supabase.from('emotions_log').insert({
      session_id: formattedId,
      user_message: `CADASTRO: ${name} iniciou a jornada.`,
      emotion_tag: 'registration'
    });

    setUserId(formattedId);
    setUserName(name);
  };

  const SYMPTOMS_DB: any = {
    'headache': { pattern: 'Invalidação do Eu. Medo.', affirmation: 'Eu me amo e me aprovo. Eu me vejo com olhos de amor.' },
    'stomach': { pattern: 'Dificuldade em digerir novas ideias. Medo do novo.', affirmation: 'Eu digiro a vida com facilidade. Tudo o que acontece é para o meu bem.' },
    'back_pain': { pattern: 'Falta de apoio emocional. Sentindo-se sem suporte.', affirmation: 'A vida me apoia. Eu confio no processo da vida.' },
    'cancer': { pattern: 'Ressentimento profundo. Mágoa antiga comendo o corpo.', affirmation: 'Eu libero o passado com amor. Eu escolho preencher meu mundo com alegria.' },
    'heart': { pattern: 'Falta de alegria. Endurecimento do coração.', affirmation: 'Meu coração bate no ritmo do amor. Eu sou alegria.' },
    'knees': { pattern: 'Orgulho e teimosia. Incapacidade de se curvar.', affirmation: 'Eu sou flexível e fluido. Eu me curvo com amor.' }
  };

  const [symptom, setSymptom] = useState<string | null>(null);

  const startJourney = async (diagnostic: any) => {
    if (!userId) return;
    setLoading(true);
    
    const theme = diagnostic.area === 'health' ? 'Cura Somática' : 
                  diagnostic.area === 'money' ? 'Prosperidade Infinita' : 
                  diagnostic.area === 'relationships' ? 'Harmonia e Amor' : 'Autoestima';
    
    // Se escolheu sintoma, a afirmação vem da DB de Louise Hay
    const customAffirmation = diagnostic.symptom ? SYMPTOMS_DB[diagnostic.symptom]?.affirmation : `Eu me amo e me aceito.`;
    const pattern = diagnostic.symptom ? SYMPTOMS_DB[diagnostic.symptom]?.pattern : diagnostic.pattern;

    const { data } = await supabase
      .from('healing_journeys')
      .insert({
        session_id: userId,
        theme: theme,
        affirmation: customAffirmation,
        current_day: 1,
        max_days: 21,
        status: 'active'
      })
      .select()
      .single();

    if (data) {
      // GROWTH: Evento direcional para o Pixel/Ads
      (window as any).logHealingEvent('StartJourney', { 
        theme: theme, 
        area: diagnostic.area 
      });

      await supabase.from('emotions_log').insert({
        session_id: userId,
        user_message: `FOCO DE CURA: ${theme}. Padrão Detectado: ${pattern}. Queixa: ${diagnostic.notes}`,
        emotion_tag: 'somatic_diagnostic'
      });
      setJourney(data);
    }
    setLoading(false);
  };

  const completeExercise = async () => {
    if (!reflection.trim() || !journey) return;
    setCompleting(true);
    
    // 1. Salva a reflexão
    await supabase.from('emotions_log').insert({
      session_id: userId,
      user_message: reflection,
      emotion_tag: 'daily_reflection',
      ai_response: `Parabéns pela prática do dia ${journey.current_day}. Sua consciência está se expandindo.`
    });

    // 2. Avança o dia na jornada
    await supabase.from('healing_journeys')
      .update({ current_day: journey.current_day + 1 })
      .eq('id', journey.id);

    setReflection('');
    // Recarrega dados
    window.location.reload();
  };

  const logout = () => {
    localStorage.clear();
    setUserId(null);
    setUserName(null);
    setJourney(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Wind className="text-green-800 animate-pulse" size={40} /></div>;

  if (!userId) {
    return (
      <div className="min-h-screen p-8 flex flex-col justify-center items-center max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-12 text-center">
          <div className="inline-flex p-5 bg-white/80 backdrop-blur-xl rounded-full shadow-sm"><Heart className="text-rose-500" size={32} /></div>
          <div className="space-y-4">
            <h1 className="text-4xl font-serif text-slate-900">Portal de <span className="text-gradient">Libertação</span></h1>
            <p className="text-slate-500 italic">"Mude seus pensamentos, mude sua vida."</p>
          </div>
          <div className="bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-xl space-y-8 text-left border border-white/20">
            <div className="space-y-2">
              <label className="section-label">Nome</label>
              <input type="text" className="input-zen" value={tempName} onChange={(e) => setTempName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="section-label">WhatsApp</label>
              <input type="text" className="input-zen" value={tempId} onChange={(e) => setTempId(e.target.value)} />
            </div>
            <button onClick={() => handleIdentify(tempId, tempName)} disabled={!tempId || !tempName} className="btn-primary w-full py-6">Entrar no Exercício</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!journey) return <Onboarding onComplete={startJourney} profileName={userName!} onBack={logout} />;

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto pb-24 relative overflow-hidden">
      <header className="relative z-10 flex justify-between items-end mt-12 mb-10 pt-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="section-label mb-2">Exercício Diário</p>
          <h1 className="text-4xl font-serif text-slate-800">Dia {journey.current_day}</h1>
        </motion.div>
        <button onClick={logout} className="p-4 bg-white/40 backdrop-blur-xl rounded-full text-slate-400 border border-white/20"><Wind size={20} /></button>
      </header>

      {/* Progress */}
      <div className="h-1.5 bg-slate-200/30 rounded-full mb-12 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(journey.current_day/21)*100}%` }} className="h-full bg-green-800" />
      </div>

      {/* Today's Exercise Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen size={16} className="text-green-800" />
          <span className="section-label !text-green-800">Prática do Dia</span>
        </div>
        
        <div className="space-y-8">
          <div className="p-6 bg-green-50/50 rounded-3xl border border-green-100">
            <p className="text-[10px] font-bold uppercase text-green-700 mb-2">Afirmação de Poder</p>
            <p className="text-2xl font-serif italic text-green-900">"{journey.affirmation}"</p>
          </div>

          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-800">Instruções:</p>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold shadow-sm">1</span>
                Repita a afirmação acima 10 vezes em frente ao espelho.
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold shadow-sm">2</span>
                Feche os olhos e sinta a resistência do seu corpo diminuir.
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold shadow-sm">3</span>
                Escreva abaixo o que você sentiu ao fazer isso.
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Reflection Input */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-4">
        <label className="section-label px-2">Sua Reflexão</label>
        <textarea 
          placeholder="Como foi essa prática para você?"
          className="input-zen h-40 resize-none bg-white/60 blur-backdrop"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
        />
        <button 
          onClick={completeExercise}
          disabled={!reflection.trim() || completing}
          className="btn-primary w-full py-6 flex items-center justify-center gap-3"
        >
          {completing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> Concluir Exercício</>}
        </button>
      </motion.div>

      {/* History */}
      <section className="mt-20 pb-12">
        <h3 className="section-label mb-8">Reflexões Anteriores</h3>
        <div className="space-y-6">
          {logs.filter(l => l.emotion_tag === 'daily_reflection').map((log, i) => (
            <div key={i} className="p-6 bg-white/40 rounded-3xl border border-white/20">
              <p className="text-[9px] font-bold text-slate-400 mb-2">{new Date(log.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-slate-600 italic">"{log.user_message}"</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Onboarding({ onComplete, profileName, onBack }: { onComplete: (data: any) => void, profileName: string, onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [diagnostic, setDiagnostic] = useState({ area: '', pattern: '', symptom: '', notes: '' });

  const SYMPTOMS_LIST = [
    { id: 'headache', label: 'Dor de Cabeça' },
    { id: 'stomach', label: 'Estômago / Digestão' },
    { id: 'back_pain', label: 'Coluna / Costas' },
    { id: 'cancer', label: 'Processo Degenerativo' },
    { id: 'heart', label: 'Problemas Cardíacos' },
    { id: 'knees', label: 'Articulações / Joelhos' }
  ];

  const steps = [
    { title: "Área de Cura", subtitle: "Onde sua alma pede ajuda?", options: [{ id: 'health', label: 'Física (Corpo)', icon: Heart }, { id: 'money', label: 'Prosperidade', icon: Sparkles }, { id: 'relationships', label: 'Relacional', icon: MessageCircle }, { id: 'self', label: 'Autoestima', icon: Wind }], field: 'area' },
    { 
      title: "O Sintoma", 
      subtitle: "Qual parte do seu corpo está manifestando dor?", 
      options: SYMPTOMS_LIST, 
      field: 'symptom',
      condition: (d: any) => d.area === 'health' 
    },
    { 
      title: "Padrão Mental", 
      subtitle: "Que sentimento mais te descreve hoje?", 
      options: [{ id: 'criticismo', label: 'Criticismo', icon: Wind }, { id: 'culpa', label: 'Culpa', icon: Heart }, { id: 'ressentimento', label: 'Ressentimento', icon: MessageCircle }, { id: 'medo', label: 'Medo', icon: Sparkles }], 
      field: 'pattern',
      condition: (d: any) => d.area !== 'health'
    },
    { title: "Detalhamento", subtitle: "Conte-me o que você quer libertar...", field: 'notes' }
  ];

  const filteredSteps = steps.filter(s => !s.condition || s.condition(diagnostic));
  const currentStep = filteredSteps[step - 1];

  const handleNext = () => step < filteredSteps.length ? setStep(step + 1) : onComplete(diagnostic);

  return (
    <div className="min-h-screen p-8 flex flex-col justify-center max-w-lg mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div className="flex gap-2 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Fase {step} de {filteredSteps.length}</div>
        <button onClick={onBack} className="text-[10px] font-bold uppercase text-slate-300">Sair</button>
      </div>
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-10 border-t-4 border-green-800">
        <h2 className="text-4xl font-serif text-slate-900 mb-2">{currentStep.title}</h2>
        <p className="text-slate-500 mb-8 italic">"{currentStep.subtitle}"</p>
        
        {currentStep.options ? (
          <div className="grid gap-3">
            {currentStep.options.map((opt: any) => (
              <button 
                key={opt.id} 
                onClick={() => setDiagnostic({ ...diagnostic, [currentStep.field]: opt.id })} 
                className={`option-btn flex items-center justify-between p-6 ${diagnostic[currentStep.field as keyof typeof diagnostic] === opt.id ? 'selected !bg-green-800 !text-white' : 'bg-white/50 text-slate-600'}`}
              >
                <div className="flex items-center gap-4">
                  {opt.icon && <opt.icon size={18} />}
                  <span className="font-medium">{opt.label}</span>
                </div>
                {diagnostic[currentStep.field as keyof typeof diagnostic] === opt.id && <CheckCircle2 size={18} />}
              </button>
            ))}
          </div>
        ) : (
          <textarea className="input-zen h-44 resize-none bg-white/50 p-6" value={diagnostic.notes} onChange={(e) => setDiagnostic({ ...diagnostic, notes: e.target.value })} placeholder="Abra seu coração..." />
        )}
        <button onClick={handleNext} disabled={(currentStep.options && !diagnostic[currentStep.field as keyof typeof diagnostic])} className="btn-primary w-full mt-10">
          Confirmar Intentionalidade
        </button>
      </motion.div>
    </div>
  );
}

export default App;
