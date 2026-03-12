import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Check,
  AlertCircle } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
export function SymptomCheckerScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');
  const symptomsList = [
  'Headache',
  'Fever',
  'Cough',
  'Fatigue',
  'Nausea',
  'Chest Pain',
  'Back Pain',
  'Dizziness',
  'Shortness of Breath',
  'Sore Throat'];

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };
  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);else
    navigate(-1);
  };
  const getSeverityLabel = (val: number) => {
    if (val <= 3) return 'Mild';
    if (val <= 7) return 'Moderate';
    return 'Severe';
  };
  const getSeverityColor = (val: number) => {
    if (val <= 3) return 'text-success';
    if (val <= 7) return 'text-warning';
    return 'text-danger';
  };
  return (
    <ScreenContainer title="Symptom Checker" showBack={false}>
      <div className="flex flex-col h-full">
        {/* Header with Progress */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100">

              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <span className="font-bold text-text-primary">
              Step {step} of 5
            </span>
            <div className="w-10" /> {/* Spacer */}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${step / 5 * 100}%`
              }} />

          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
          {step === 1 &&
          <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-2">
                What are your symptoms?
              </h2>
              <p className="text-text-secondary mb-6">
                Select all that apply to you.
              </p>

              <div className="flex flex-wrap gap-3">
                {symptomsList.map((symptom) =>
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedSymptoms.includes(symptom) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-text-secondary border-gray-200 hover:border-gray-300'}`}>

                    {symptom}
                  </button>
              )}
              </div>
            </div>
          }

          {step === 2 &&
          <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-2">
                How long have you had them?
              </h2>
              <p className="text-text-secondary mb-6">
                Select the duration of your symptoms.
              </p>

              <div className="space-y-3">
                {['Today', '2-3 Days', '1 Week', 'More than a week'].map(
                (opt) =>
                <button
                  key={opt}
                  onClick={() => setDuration(opt)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${duration === opt ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white text-text-primary hover:border-gray-300'}`}>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">{opt}</span>
                        {duration === opt &&
                    <div className="w-4 h-4 rounded-full bg-primary" />
                    }
                      </div>
                    </button>

              )}
              </div>
            </div>
          }

          {step === 3 &&
          <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-2">
                How severe is it?
              </h2>
              <p className="text-text-secondary mb-8">
                Rate the severity of your symptoms.
              </p>

              <div className="mb-8 text-center">
                <span
                className={`text-3xl font-bold ${getSeverityColor(severity)}`}>

                  {getSeverityLabel(severity)}
                </span>
                <p className="text-sm text-text-secondary mt-1">
                  Scale: {severity}/10
                </p>
              </div>

              <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary mb-8" />


              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Additional Notes
                </label>
                <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your symptoms in more detail..."
                className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary resize-none" />

              </div>
            </div>
          }

          {step === 4 &&
          <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Upload Reports
              </h2>
              <p className="text-text-secondary mb-6">
                Attach any relevant medical reports (optional).
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <FileText size={32} className="text-primary" />
                </div>
                <h3 className="font-medium text-text-primary mb-1">
                  Tap to upload reports
                </h3>
                <p className="text-xs text-text-secondary">
                  PDF, JPG, PNG up to 5MB
                </p>
              </div>
            </div>
          }

          {step === 5 &&
          <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={40} className="text-success" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Analysis Complete
                </h2>
                <p className="text-text-secondary">
                  Based on your symptoms, we recommend:
                </p>
              </div>

              <Card className="mb-6 border-primary/20 bg-blue-50/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-text-primary">
                      General Physician
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Recommended Specialist
                    </p>
                  </div>
                  <Badge variant="success">95% Match</Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Symptoms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((s) =>
                  <span
                    key={s}
                    className="px-2 py-1 bg-white rounded text-xs font-medium text-text-primary border border-gray-100">

                        {s}
                      </span>
                  )}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <AlertCircle size={16} className="text-warning mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    This is an AI-generated recommendation. Please consult a
                    doctor for accurate diagnosis.
                  </p>
                </div>
              </Card>
            </div>
          }
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          {step < 5 ?
          <div className="flex gap-3">
              {step === 4 &&
            <Button variant="ghost" onClick={handleNext} className="flex-1">
                  Skip
                </Button>
            }
              <Button
              fullWidth
              onClick={handleNext}
              disabled={step === 1 && selectedSymptoms.length === 0}
              className={step === 4 ? 'flex-[2]' : ''}>

                {step === 4 ? 'Finish' : 'Next'}
              </Button>
            </div> :

          <div className="space-y-3">
              <Button fullWidth onClick={() => navigate('/book-appointment')}>
                Book Appointment
              </Button>
              <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate('/patient-dashboard')}>

                Back to Dashboard
              </Button>
            </div>
          }
        </div>
      </div>
    </ScreenContainer>);

}