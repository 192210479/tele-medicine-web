import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';

export function DataPolicyScreen() {
  const navigate = useNavigate();
  const [policyData, setPolicyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrivacyInfo();
  }, []);

  const fetchPrivacyInfo = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/privacy-info");
      const data = await response.json();
      setPolicyData(data);
    } catch (error) {
      console.error('Failed to fetch privacy info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer title="Data & Privacy" showBack>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-text-secondary space-y-4">
          {isLoading ? (
            <div className="text-center py-20 text-gray-400 italic">Loading policy...</div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-text-primary">
                {policyData?.title || "Privacy Policy"}
              </h3>
              <p>Last updated: {policyData?.last_updated || "October 24, 2023"}</p>

              {policyData?.sections ? (
                policyData.sections.map((section: any, index: number) => (
                  <div key={index}>
                    <h4 className="font-bold text-text-primary mt-4">
                      {section.title}
                    </h4>
                    <p className="mt-2">{section.content}</p>
                    {section.bullets && (
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        {section.bullets.map((bullet: string, bIndex: number) => (
                          <li key={bIndex}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 italic">Policy content unavailable.</div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <Button fullWidth onClick={() => navigate(-1)}>I Understand</Button>
        </div>
      </div>
    </ScreenContainer>
  );
}