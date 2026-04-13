import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

// ── Types ────────────────────────────────────────────────────
interface TriageResult {
  conditions: string[];
  specialization: string;
  priority: 'low' | 'medium' | 'high';
  disclaimer: string;
}

// ── Helpers ──────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  low: { label: 'Low Priority', color: 'success', badge: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium Priority', color: 'warning', badge: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High Priority', color: 'danger', badge: 'bg-red-100 text-red-700' },
} as const;

const getSeverityLabel = (val: number) => val <= 3 ? 'Mild' : val <= 7 ? 'Moderate' : 'Severe';
const getSeverityColor = (val: number) =>
  val <= 3 ? 'text-success' : val <= 7 ? 'text-warning' : 'text-danger';

const SYMPTOMS_LIST = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
  'Chest Pain', 'Back Pain', 'Dizziness', 'Shortness of Breath', 'Sore Throat',
  'Vomiting', 'Joint Pain', 'Rash', 'Stomach Pain', 'Loss of Appetite',
];

const DURATION_OPTIONS = ['Today', '2–3 Days', '1 Week', 'More than a week'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

// ── Component ────────────────────────────────────────────────
export function SymptomCheckerScreen() {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;

  // Form state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [duration, setDuration] = useState('');
  const [step2Notes, setStep2Notes] = useState('');
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  // AI result state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [apiError, setApiError] = useState('');
  
  const [recommendedDoctors, setRecommendedDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // ── Symptom toggle ──────────────────────────────────────────
  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  // ── Navigation ──────────────────────────────────────────────
  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
    else navigate(-1);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      // Step 4 → Step 5: trigger AI call
      runSymptomTriage();
    }
  };

  // ── AI call ─────────────────────────────────────────────────
  const runSymptomTriage = async () => {
    setStep(TOTAL_STEPS); // move to results step immediately (show loader)
    setLoading(true);
    setApiError('');
    setResult(null);

    // Build the symptoms string for the backend
    const symptomsText = [
      selectedSymptoms.join(', '),
      customSymptom.trim() ? `Other symptoms: ${customSymptom.trim()}` : '',
      duration ? `Duration: ${duration}` : '',
      step2Notes.trim() ? `Duration context: ${step2Notes.trim()}` : '',
      `Severity: ${getSeverityLabel(severity)} (${severity}/10)`,
      notes.trim() ? `Notes: ${notes.trim()}` : '',
    ].filter(Boolean).join('. ');

    try {
      const res = await fetch('/ai/symptom-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomsText,
          age: age || null,
          gender: gender || null,
          past_conditions: [],
          current_medications: [],
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('AI engine returned an unexpected format. AI Service Unavailable.');
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Triage failed to analyze symptoms.');
      }

      setResult(data as TriageResult);
      
      // Fetch recommended doctors
      setLoadingDoctors(true);
      try {
        const docRes = await fetch('/ai/recommend-doctor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            specialization: data.specialization,
            priority: data.priority
          }),
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          setRecommendedDoctors(docData);
        }
      } catch (err) {
        console.error('Failed to fetch recommended doctors', err);
      } finally {
        setLoadingDoctors(false);
      }
      
    } catch (err: any) {
      let errorMsg = err.message || 'Could not reach AI service. Please try again.';
      if (errorMsg.toLowerCase().includes('json')) {
        errorMsg = 'AI engine returned an unexpected format. Service temporarily unavailable.';
      }
      setApiError(errorMsg);
      // Show fallback so user isn't stuck
      setResult({
        conditions: ['Unable to analyse — please describe symptoms to a doctor'],
        specialization: 'General Physician',
        priority: 'low',
        disclaimer: 'AI service unavailable. This is not a medical diagnosis.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Book appointment with pre-filled specialization ──────────
  const handleBookAppointment = () => {
    navigate('/book-appointment', {
      state: { specialization: result?.specialization || '' },
    });
  };

  // ════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════
  return (
    <ScreenContainer title="Symptom Checker" showBack={false}>
      <div className="flex flex-col h-full">

        {/* ── Progress header ── */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <span className="font-bold text-text-primary">
              Step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS}
            </span>
            <div className="w-10" />
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Step content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">

          {/* STEP 1 — Symptoms */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                What are your symptoms?
              </h2>
              <p className="text-text-secondary mb-6">Select all that apply.</p>
              <div className="flex flex-wrap gap-3">
                {SYMPTOMS_LIST.map(symptom => (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedSymptoms.includes(symptom)
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-text-secondary border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium text-text-secondary mb-3">Or type your specific symptoms:</p>
                <textarea
                  value={customSymptom}
                  onChange={e => setCustomSymptom(e.target.value)}
                  placeholder="E.g., I have a sharp pain in my lower left abdomen that started after lunch..."
                  className="w-full h-24 p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary resize-none text-sm transition-colors"
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Duration */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                How long have you had them?
              </h2>
              <p className="text-text-secondary mb-6">Select the duration of your symptoms.</p>
              <div className="space-y-3">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setDuration(opt)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${duration === opt
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 bg-white text-text-primary hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{opt}</span>
                      {duration === opt && <div className="w-4 h-4 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-text-secondary mb-3">Any specific details about the duration? (Optional)</p>
                <input
                  type="text"
                  value={step2Notes}
                  onChange={e => setStep2Notes(e.target.value)}
                  placeholder="E.g., Started slowly over time, or suddenly this morning"
                  className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors"
                />
              </div>
            </div>
          )}

          {/* STEP 3 — Severity + notes */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                How severe is it?
              </h2>
              <p className="text-text-secondary mb-8">Rate the severity of your symptoms.</p>

              <div className="mb-6 text-center">
                <span className={`text-3xl font-bold ${getSeverityColor(severity)}`}>
                  {getSeverityLabel(severity)}
                </span>
                <p className="text-sm text-text-secondary mt-1">Scale: {severity}/10</p>
              </div>

              <input
                type="range"
                min="1" max="10"
                value={severity}
                onChange={e => setSeverity(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary mb-8"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your symptoms in more detail..."
                  className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4 — Patient info (age / gender) */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                A bit about you
              </h2>
              <p className="text-text-secondary mb-6">
                Helps our AI give more accurate recommendations. All optional.
              </p>

              {/* Age */}
              <div className="mb-6">
                <label className="text-sm font-medium text-text-secondary block mb-2">
                  Your Age
                </label>
                <input
                  type="number"
                  min="1" max="120"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 32"
                  className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setGender(opt)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${gender === opt
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white text-text-primary hover:border-gray-300'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — Results */}
          {step === 5 && (
            <div>
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 size={48} className="text-primary animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    Analysing your symptoms…
                  </h3>
                  <p className="text-sm text-text-secondary text-center">
                    Our AI is reviewing your case. This takes a few seconds.
                  </p>
                </div>
              )}

              {/* Result */}
              {!loading && result && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={40} className="text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">
                      Analysis Complete
                    </h2>
                    <p className="text-text-secondary">
                      Based on your symptoms, here's our recommendation:
                    </p>
                  </div>

                  {/* Error banner (API failed but showing fallback) */}
                  {apiError && (
                    <Card className="bg-yellow-50 border-yellow-200 mb-4">
                      <p className="text-yellow-700 text-sm text-center">
                        ⚠️ {apiError}
                      </p>
                    </Card>
                  )}

                  <Card className="mb-4 border-primary/20 bg-blue-50/50">
                    {/* Specialization + priority */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-text-primary">
                          {result.specialization}
                        </h3>
                        <p className="text-sm text-text-secondary">Recommended Specialist</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${PRIORITY_CONFIG[result.priority]?.badge || PRIORITY_CONFIG.low.badge
                        }`}>
                        {PRIORITY_CONFIG[result.priority]?.label || 'Low Priority'}
                      </span>
                    </div>

                    {/* Possible conditions */}
                    {result.conditions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                          Possible Conditions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.conditions.map(c => (
                            <span
                              key={c}
                              className="px-2 py-1 bg-white rounded text-xs font-medium text-text-primary border border-gray-100"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Your symptoms summary */}
                    {(selectedSymptoms.length > 0 || customSymptom.trim()) && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                          Your Symptoms
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSymptoms.map(s => (
                            <span
                              key={s}
                              className="px-2 py-1 bg-primary/10 rounded text-xs font-medium text-primary"
                            >
                              {s}
                            </span>
                          ))}
                          {customSymptom.trim() && (
                            <span className="px-2 py-1 bg-primary/10 rounded text-xs font-medium text-primary line-clamp-1 max-w-full">
                              "{customSymptom.trim()}"
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Priority alert for high urgency */}
                    {result.priority === 'high' && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100 mb-3">
                        <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
                        <p className="text-xs text-red-800 font-medium">
                          Your symptoms suggest urgency. Please seek medical attention as soon as possible.
                        </p>
                      </div>
                    )}

                    {/* Disclaimer */}
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <AlertCircle size={16} className="text-warning mt-0.5 shrink-0" />
                      <p className="text-xs text-yellow-800">{result.disclaimer}</p>
                    </div>

                    {/* Recommended Doctors block */}
                    {loadingDoctors ? (
                      <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col items-center">
                        <Loader2 size={24} className="text-primary animate-spin mb-2" />
                        <p className="text-xs text-text-secondary">Finding best specialists for you...</p>
                      </div>
                    ) : recommendedDoctors.length > 0 ? (
                      <div className="mt-5 border-t border-blue-100 pt-5">
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4">
                          Recommended Specialists
                        </p>
                        <div className="space-y-3">
                          {recommendedDoctors.map(doctor => (
                            <div key={doctor.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
                              onClick={() => navigate('/book-appointment', { state: { doctorId: doctor.id } })}
                            >
                              <div className="flex items-center gap-3">
                                <img src={doctor.profile_image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300'} alt={doctor.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm" />
                                <div>
                                  <p className="font-bold text-sm text-text-primary">{doctor.name}</p>
                                  <p className="text-[11px] text-text-secondary">{doctor.specialization} • {doctor.experience} yrs exp</p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20">Book +</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                  </Card>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer buttons ── */}
        <div className="p-6 bg-white border-t border-gray-100">
          {step < TOTAL_STEPS ? (
            <div className="flex gap-3">
              {/* Step 4 has a Skip option */}
              {step === 4 && (
                <Button variant="ghost" onClick={handleNext} className="flex-1">
                  Skip
                </Button>
              )}
              <Button
                fullWidth
                onClick={handleNext}
                disabled={step === 1 && selectedSymptoms.length === 0 && !customSymptom.trim()}
                className={step === 4 ? 'flex-[2]' : ''}
              >
                {step === 4 ? 'Analyse Symptoms' : 'Next'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {!loading && (
                <>
                  <Button fullWidth onClick={handleBookAppointment}>
                    Book Appointment
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => navigate('/patient-dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </>
              )}
              {loading && (
                <Button fullWidth disabled>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Analysing…
                </Button>
              )}
            </div>
          )}
        </div>

      </div>
    </ScreenContainer>
  );
}