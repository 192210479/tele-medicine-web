import { useState, useEffect, useCallback } from 'react';
import { FileText, Eye, Check, X, Clock } from 'lucide-react';
import { apiGet, apiPut } from '../services/api';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatsCard } from '../components/ui/StatsCard';
export function DoctorApprovalScreen() {
  const [activeTab, setActiveTab] = useState('Pending');
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // The prompt specifically mentions GET /api/admin/doctors/pending?role=admin
      const data = await apiGet('/api/admin/doctors/pending', { role: 'admin' });
      // If data is { count: X, doctors: [] } or just []
      const list = Array.isArray(data) ? data : (data.doctors || []);
      setApplications(list.map((d: any) => ({
        id: d.id,
        name: d.name || d.full_name,
        spec: d.specialization || d.spec,
        license: d.license || 'N/A',
        date: d.created_at || 'Recently',
        status: 'Pending'
      })));
      setStats(prev => ({ ...prev, pending: list.length }));
    } catch (e) {
      console.error("Failed to load pending doctors", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await apiPut(`/api/admin/doctors/${action}/${id}`, { role: 'admin' });
      alert(`Doctor ${action}ed successfully`);
      loadData();
    } catch (e) {
      alert(`Failed to ${action} doctor`);
    }
  };

  const filteredApps = applications.filter((app) => app.status === activeTab);
  return (
    <ScreenContainer title="Doctor Approvals" showBack className="pb-8">
      <div className="px-6 py-6">
        {/* Stats */}
        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
          <div className="min-w-[140px]">
            <StatsCard label="Pending" value={stats.pending.toString()} icon={<Clock size={20} />} />
          </div>
          <div className="min-w-[140px]">
            <StatsCard
              label="Approved"
              value={stats.approved.toString()}
              icon={<Check size={20} />}
              trendUp
              trend="+0" />

          </div>
          <div className="min-w-[140px]">
            <StatsCard
              label="Rejected"
              value={stats.rejected.toString()}
              icon={<X size={20} />}
              trendUp={false}
              trend="+0" />

          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
          {['Pending', 'Approved', 'Rejected'].map((tab) =>
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>

              {tab}
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredApps.map((app) =>
          <Card key={app.id} className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                  {app.name.
                split(' ').
                map((n: string) => n[0]).
                join('').
                slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-text-primary">{app.name}</h3>
                    <Badge
                    variant={
                    app.status === 'Approved' ?
                    'success' :
                    app.status === 'Rejected' ?
                    'error' :
                    'warning'
                    }>

                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">{app.spec}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Lic: {app.license} • {app.date}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                variant="ghost"
                className="flex-1 text-xs h-8 px-2 min-h-0"
                icon={<FileText size={14} />}>

                  License
                </Button>
                <Button
                variant="ghost"
                className="flex-1 text-xs h-8 px-2 min-h-0"
                icon={<Eye size={14} />}>

                  Certificate
                </Button>
              </div>

              {app.status === 'Pending' &&
                <div className="flex gap-3 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => handleAction(app.id, 'reject')}
                    className="flex-1 h-10 text-sm font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(app.id, 'approve')}
                    className="flex-1 h-10 text-sm font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-colors">
                    Approve
                  </button>
                </div>
              }
            </Card>
          )}
          {filteredApps.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100 italic">
              No {activeTab.toLowerCase()} applications
            </div>
          )}
          {loading && (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 font-medium">Loading applications...</p>
            </div>
          )}
        </div>
      </div>
    </ScreenContainer>);

}