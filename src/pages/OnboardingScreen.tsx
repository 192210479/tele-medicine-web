import React, { useState, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, FileText, Bell, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
const onboardingSteps = [
{
  id: 1,
  icon: Video,
  iconBg: 'bg-blue-100',
  iconColor: 'text-primary',
  title: 'Consult Doctors Anytime',
  description:
  'Connect with certified doctors from home through secure video consultations.'
},
{
  id: 2,
  icon: FileText,
  iconBg: 'bg-teal-100',
  iconColor: 'text-secondary',
  title: 'Digital Prescriptions & Records',
  description:
  'Receive prescriptions instantly and store all your medical reports safely.'
},
{
  id: 3,
  icon: Bell,
  iconBg: 'bg-green-100',
  iconColor: 'text-success',
  title: 'Smart Health Management',
  description:
  'Get medication reminders, follow-ups, and manage your health easily.'
}];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/get-started');
    }
  };
  const handleSkip = () => {
    navigate('/get-started');
  };
  const step = onboardingSteps[currentStep];
  const IconComponent = step.icon;
  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-4xl mx-auto px-6 flex flex-col h-full">
        {/* Skip Button */}
        <div className="flex justify-end w-full mb-8">
          {currentStep < onboardingSteps.length - 1 &&
          <button
            onClick={handleSkip}
            className="text-base font-medium text-gray-400 hover:text-gray-600 transition-colors">
            
              Skip
            </button>
          }
        </div>

        {/* Illustration Area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Animated Icon Container */}
          <div className="relative mb-16">
            {/* Background circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-64 h-64 rounded-full ${step.iconBg} opacity-30 animate-pulse`} />
              
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-48 h-48 rounded-full ${step.iconBg} opacity-50`} />
              
            </div>

            {/* Main icon */}
            <div
              className={`relative w-36 h-36 rounded-3xl ${step.iconBg} flex items-center justify-center shadow-lg`}>
              
              <IconComponent size={72} className={step.iconColor} />
            </div>

            {/* Decorative dots */}
            <div className="absolute -top-6 -right-6 w-6 h-6 rounded-full bg-primary opacity-60" />
            <div className="absolute -bottom-4 -left-8 w-4 h-4 rounded-full bg-secondary opacity-60" />
            <div className="absolute top-1/2 -right-10 w-3 h-3 rounded-full bg-warning opacity-60" />
          </div>

          {/* Content */}
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {step.title}
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="w-full max-w-md mx-auto mt-12">
          {/* Progress Dots */}
          <div className="flex justify-center gap-3 mb-8">
            {onboardingSteps.map((_, index) =>
            <div
              key={index}
              className={`h-2.5 rounded-full transition-all duration-300 ${index === currentStep ? 'w-10 bg-primary' : index < currentStep ? 'w-2.5 bg-primary/50' : 'w-2.5 bg-gray-200'}`} />

            )}
          </div>

          {/* Action Button */}
          <Button
            fullWidth
            onClick={handleNext}
            icon={
            currentStep === onboardingSteps.length - 1 ? undefined :
            <ArrowRight size={20} />

            }>
            
            {currentStep === onboardingSteps.length - 1 ?
            'Get Started' :
            'Next'}
          </Button>
        </div>
      </div>
    </div>);

}
