import { useEffect, useState } from 'react';
import { measurementAPI, patientAPI } from '../api';
import { Layout } from '../components/Layout';
import { Card, Badge, Button, Alert, Loading } from '../components/UI';

export function PredictionsPage() {
  const [measurements, setMeasurements] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    setError('');
    try {
      // Load all patients first
      const patientsRes = await patientAPI.list();
      const patientMap = {};
      patientsRes.data.forEach(p => {
        patientMap[p.id] = p;
      });
      setPatients(patientMap);

      // Load measurements from all patients
      const allMeasurements = [];
      for (const patient of patientsRes.data) {
        try {
          const measRes = await measurementAPI.list(patient.id);
          allMeasurements.push(...measRes.data);
        } catch (e) {
          console.error(`Failed to load measurements for patient ${patient.id}`);
        }
      }
      
      // Filter to only include measurements with predictions
      const withPredictions = allMeasurements.filter(m => m.prediction);
      setMeasurements(withPredictions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error('Load predictions error:', err);
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPredictions = () => {
    if (filter === 'all') return measurements;
    if (filter === 'high') return measurements.filter(m => m.prediction?.risk_label === 'high');
    if (filter === 'medium') return measurements.filter(m => m.prediction?.risk_label === 'medium');
    if (filter === 'low') return measurements.filter(m => m.prediction?.risk_label === 'low');
    return measurements;
  };

  const filteredPredictions = getFilteredPredictions();

  const getRiskStats = () => {
    return {
      total: measurements.length,
      high: measurements.filter(m => m.prediction?.risk_label === 'high').length,
      medium: measurements.filter(m => m.prediction?.risk_label === 'medium').length,
      low: measurements.filter(m => m.prediction?.risk_label === 'low').length,
    };
  };

  const stats = getRiskStats();

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Risk Predictions</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Predictions"
            value={stats.total}
            icon="📊"
            color="medical"
          />
          <StatCard
            title="High Risk"
            value={stats.high}
            icon="🔴"
            color="danger"
          />
          <StatCard
            title="Medium Risk"
            value={stats.medium}
            icon="🟡"
            color="warning"
          />
          <StatCard
            title="Low Risk"
            value={stats.low}
            icon="🟢"
            color="success"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-8 flex gap-3 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-medical-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'high'
              ? 'bg-danger-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          High Risk ({stats.high})
        </button>
        <button
          onClick={() => setFilter('medium')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'medium'
              ? 'bg-warning-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Medium Risk ({stats.medium})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'low'
              ? 'bg-success-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Low Risk ({stats.low})
        </button>
      </div>

      {/* Predictions List */}
      {filteredPredictions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600 text-lg">No predictions found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((measurement) => (
            <Card key={measurement.id}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {patients[measurement.patient]?.full_name || `Patient #${measurement.patient}`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(measurement.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={measurement.prediction.risk_label}>
                      {measurement.prediction.risk_label?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">Risk Score</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(measurement.prediction.risk_score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">Heart Rate</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{measurement.heart_rate}</p>
                      <p className="text-xs text-gray-500">bpm</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">SpO₂</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{measurement.spo2}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">Blood Pressure</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {measurement.systolic}/{measurement.diastolic}
                      </p>
                      <p className="text-xs text-gray-500">mmHg</p>
                    </div>
                  </div>

                  {measurement.prediction.reason && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                      <p className="text-sm font-semibold text-gray-900">Reason</p>
                      <p className="text-sm text-gray-800">{measurement.prediction.reason}</p>
                    </div>
                  )}

                  {measurement.notes && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-gray-900">Notes</p>
                      <p className="text-sm text-gray-800">{measurement.notes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/patients/${measurement.patient}`}
                  >
                    View Patient
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    medical: 'bg-medical-50 text-medical-600 border-medical-200',
    danger: 'bg-danger-50 text-danger-600 border-red-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
    success: 'bg-success-50 text-success-600 border-success-200',
  };
  return (
    <Card className={`text-center border-l-4 ${colorClasses[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-gray-600 text-sm font-semibold">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </Card>
  );
}
