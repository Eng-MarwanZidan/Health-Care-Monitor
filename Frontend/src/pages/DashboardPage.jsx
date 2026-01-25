import { useEffect, useState } from 'react';
import { usePatientStore, useMeasurementStore } from '../store';
import { patientAPI, measurementAPI } from '../api';
import { Layout } from '../components/Layout';
import { Card, CardHeader, Button, Loading, Alert } from '../components/UI';

export function DashboardPage() {
  const { patients, setPatients, setLoading: setPatientLoading } = usePatientStore();
  const { measurements, setMeasurements, setLoading: setMeasurementLoading } = useMeasurementStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load patients
      const patientsRes = await patientAPI.list();
      setPatients(patientsRes.data);

      // Load recent measurements from all patients
      const allMeasurements = [];
      for (const patient of patientsRes.data) {
        try {
          const measRes = await measurementAPI.list(patient.id);
          allMeasurements.push(...measRes.data);
        } catch (e) {
          console.error(`Failed to load measurements for patient ${patient.id}`);
        }
      }
      setMeasurements(allMeasurements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={patients.length}
          icon="👥"
          color="success"
        />
        <StatCard
          title="Recent Measurements"
          value={measurements.length}
          icon="📈"
          color="medical"
        />
        <StatCard
          title="High Risk Cases"
          value={measurements.filter(m => m.prediction?.risk_label === 'high').length}
          icon="⚠️"
          color="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900">Recent Patients</h3>
          </CardHeader>
          {patients.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No patients yet</p>
          ) : (
            <div className="space-y-4">
              {patients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{patient.full_name}</p>
                    <p className="text-sm text-gray-600">{patient.dob || 'DOB not set'}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = `/patients/${patient.id}`}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Measurements & Predictions */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900">Recent Measurements</h3>
          </CardHeader>
          {measurements.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No measurements yet</p>
          ) : (
            <div className="space-y-4">
              {measurements.slice(0, 5).map((m) => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">HR: {m.heart_rate} | SpO₂: {m.spo2}%</p>
                    <p className="text-sm text-gray-600">{new Date(m.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    {m.prediction && (
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        m.prediction.risk_label === 'low' ? 'bg-success-100 text-success-800' :
                        m.prediction.risk_label === 'medium' ? 'bg-warning-100 text-warning-800' :
                        'bg-danger-100 text-danger-800'
                      }`}>
                        {m.prediction.risk_label?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    success:'bg-success-50 text-green-600 border-green-200',
    medical: 'bg-medical-50 text-medical-600 border-medical-200',
    danger: 'bg-danger-50 text-danger-600 border-red-200',
  };
  return (
    <Card className={`text-center border-l-4 ${colorClasses[color]}`}>
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-600 text-sm font-semibold">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </Card>
  );
}
