import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useT } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingGuide({ isOpen, onClose }: Props) {
  const { t } = useT();
  const [step, setStep] = useState(0);

  const steps = [
    { title: t('onboardingStep1'), desc: t('onboardingStep1Desc'), icon: '🎯' },
    { title: t('onboardingStep2'), desc: t('onboardingStep2Desc'), icon: '🎵' },
    { title: t('onboardingStep3'), desc: t('onboardingStep3Desc'), icon: '🚀' },
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    localStorage.setItem('swm_onboarding_done', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={finish}
        >
          <motion.div
            className="max-w-md w-full mx-4 p-8 rounded-3xl bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-white/40">
                {t('onboarding')} — {step + 1}/{steps.length}
              </span>
              <button onClick={finish} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-5xl mb-4">{current.icon}</div>
            <h2 className="text-2xl font-bold mb-3">{current.title}</h2>
            <p className="text-white/70 mb-8 leading-relaxed">{current.desc}</p>

            <div className="flex justify-between items-center">
              <button
                onClick={finish}
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                {t('skip')}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-full bg-white/[0.1] border border-white/10 hover:bg-white/20 transition-all text-sm font-medium"
              >
                {step < steps.length - 1 ? t('next') : t('gotIt')}
              </button>
            </div>

            <div className="flex justify-center space-x-2 mt-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'bg-white scale-110' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
