import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import AuthBackground from '@/components/auth/AuthBackground';
import LoginForm from '@/components/auth/LoginForm';
import ProfileSelection from '@/components/auth/ProfileSelection';
import CodeInput from '@/components/auth/CodeInput';
import SchoolSelection from '@/components/auth/SchoolSelection';
import RegistrationForm from '@/components/auth/RegistrationForm';
import SuccessScreen from '@/components/auth/SuccessScreen';
import ForgotPassword from '@/components/auth/ForgotPassword';
import ResetCodeInput from '@/components/auth/ResetCodeInput';
import NewPassword from '@/components/auth/NewPassword';
import PasswordResetSuccess from '@/components/auth/PasswordResetSuccess';
import SupportForm from '@/components/auth/SupportForm';

type Step =
  | 'login'
  | 'profile'
  | 'code'
  | 'schools'
  | 'register'
  | 'success'
  | 'forgot'
  | 'reset-code'
  | 'new-password'
  | 'reset-success'
  | 'support';

const Index = () => {
  const [step, setStep] = useState<Step>('login');
  const [profile, setProfile] = useState<'student' | 'teacher'>('student');
  const [primaryCode, setPrimaryCode] = useState('1234');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');

  const goToLogin = useCallback(() => setStep('login'), []);

  const handleProfileSelect = (p: 'student' | 'teacher') => {
    setProfile(p);
    setStep('code');
  };

  const handleCodeSubmit = (code: string) => {
    setPrimaryCode(code);
    if (profile === 'teacher') {
      setStep('schools');
    } else {
      setStep('register');
    }
  };

  const handleSchoolsSubmit = (schools: string[]) => {
    setSelectedSchools(schools);
    setStep('register');
  };

  const handleCodeSent = (identifier: string) => {
    setResetIdentifier(identifier);
    setStep('reset-code');
  };

  const handleTokenVerified = (token: string) => {
    setResetToken(token);
    setStep('new-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <AuthBackground />

      <div className="glass-card w-full max-w-[420px] md:max-w-[400px] p-8 relative z-10">
        <AnimatePresence mode="wait">
          {step === 'login' && (
            <LoginForm
              key="login"
              onSignUp={() => setStep('profile')}
              onForgotPassword={() => setStep('forgot')}
              onSupport={() => setStep('support')}
            />
          )}
          {step === 'profile' && (
            <ProfileSelection key="profile" onSelect={handleProfileSelect} onLogin={goToLogin} />
          )}
          {step === 'code' && (
            <CodeInput
              key="code"
              profile={profile}
              onBack={() => setStep('profile')}
              onSubmit={handleCodeSubmit}
            />
          )}
          {step === 'schools' && (
            <SchoolSelection
              key="schools"
              primaryCode={primaryCode}
              onBack={() => setStep('code')}
              onNext={handleSchoolsSubmit}
            />
          )}
          {step === 'register' && (
            <RegistrationForm
              key="register"
              profile={profile}
              primaryCode={primaryCode}
              schoolCodes={selectedSchools}
              onBack={() => (profile === 'teacher' ? setStep('schools') : setStep('code'))}
              onSubmit={() => setStep('success')}
            />
          )}
          {step === 'success' && (
            <SuccessScreen key="success" onGoToLogin={goToLogin} />
          )}

          {/* Forgot password flow */}
          {step === 'forgot' && (
            <ForgotPassword
              key="forgot"
              onBack={goToLogin}
              onCodeSent={handleCodeSent}
              onSupport={() => setStep('support')}
            />
          )}
          {step === 'reset-code' && (
            <ResetCodeInput
              key="reset-code"
              email={resetIdentifier}
              onBack={() => setStep('forgot')}
              onVerified={handleTokenVerified}
            />
          )}
          {step === 'new-password' && (
            <NewPassword
              key="new-password"
              identifier={resetIdentifier}
              token={resetToken}
              onSuccess={() => setStep('reset-success')}
            />
          )}
          {step === 'reset-success' && (
            <PasswordResetSuccess key="reset-success" onGoToLogin={goToLogin} />
          )}

          {/* Support flow */}
          {step === 'support' && (
            <SupportForm key="support" onBack={goToLogin} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
