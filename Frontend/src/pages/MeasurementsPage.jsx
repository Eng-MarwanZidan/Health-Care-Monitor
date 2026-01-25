import { useEffect, useState } from 'react';
import { useMeasurementStore } from '../store';
import { patientAPI, measurementAPI } from '../api';
import { Layout } from '../components/Layout';
import { Card, CardHeader, Badge, Button, Alert, Loading } from '../components/UI';

export function MeasurementsPage() {
  const { measurements, setMeasurements } = useMeasurementStore();
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    heart_rate: '',
    spo2: '',
    systolic: '',
    diastolic: '',
    respiratory_rate: '',
    temperature: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    setLoading(true);
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
      setMeasurements(allMeasurements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      setError('Failed to load measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const { data } = await measurementAPI.create(selectedPatient, {
        ...formData,
        heart_rate: parseFloat(formData.heart_rate),
        spo2: parseFloat(formData.spo2),
        systolic: parseFloat(formData.systolic),
        diastolic: parseFloat(formData.diastolic),
        respiratory_rate: formData.respiratory_rate ? parseFloat(formData.respiratory_rate) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        notes: formData.notes
      });
      setMeasurements([data, ...measurements]);
      setFormData({
        heart_rate: '',
        spo2: '',
        systolic: '',
        diastolic: '',
        respiratory_rate: '',
        temperature: '',
        notes: '',
      });
      setSelectedPatient(null);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add measurement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeasurement = async (id) => {
    if (!window.confirm('Delete this measurement?')) return;
    setDeleting(id);
    try {
      await measurementAPI.delete(id);
      setMeasurements(measurements.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.detail || 'Failed to delete measurement');
    } finally {
      setDeleting(null);
    }
  };

  const getFilteredMeasurements = () => {
    if (filter === 'all') return measurements;
    if (filter === 'high') return measurements.filter(m => m.prediction?.risk_label === 'high');
    if (filter === 'medium') return measurements.filter(m => m.prediction?.risk_label === 'medium');
    if (filter === 'low') return measurements.filter(m => m.prediction?.risk_label === 'low');
    return measurements;
  };

  const filteredMeasurements = getFilteredMeasurements();

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">All Measurements</h2>
        <Button
          variant={showForm ? 'secondary' : 'success'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Measurement'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900">Record New Measurement</h3>
          </CardHeader>
          <form onSubmit={handleAddMeasurement}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Patient *</label>
              <select
                value={selectedPatient || ''}
                onChange={(e) => setSelectedPatient(parseInt(e.target.value))}
                required
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
              >
                <option value="">Choose a patient...</option>
                {Object.values(patients).map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                step="0.1"
                placeholder="Heart Rate (bpm)"
                value={formData.heart_rate}
                onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                required
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="SpO₂ (%)"
                value={formData.spo2}
                onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                required
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Systolic (mmHg)"
                value={formData.systolic}
                onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                required
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Diastolic (mmHg)"
                value={formData.diastolic}
                onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                required
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Respiratory Rate (/min)"
                value={formData.respiratory_rate}
                onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Temperature (°C)"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={submitting}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
              rows="3"
            />
            <Button
              type="submit"
              variant="success"
              className="w-full mt-4"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Measurement'}
            </Button>
          </form>
        </Card>
      )}

      <div className="mb-8 flex gap-3 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-medical-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All ({measurements.length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'high'
              ? 'bg-danger-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          High Risk ({measurements.filter(m => m.prediction?.risk_label === 'high').length})
        </button>
        <button
          onClick={() => setFilter('medium')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'medium'
              ? 'bg-warning-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Medium Risk ({measurements.filter(m => m.prediction?.risk_label === 'medium').length})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'low'
              ? 'bg-success-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Low Risk ({measurements.filter(m => m.prediction?.risk_label === 'low').length})
        </button>
      </div>

      {filteredMeasurements.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600 text-lg">No measurements found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMeasurements.map((measurement) => (
            <Card key={measurement.id}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-bold text-gray-900">
                      {patients[measurement.patient]?.full_name || `Patient #${measurement.patient}`}
                    </h4>
                    {measurement.prediction && (
                      <Badge variant={measurement.prediction.risk_label}>
                        {measurement.prediction.risk_label?.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {new Date(measurement.timestamp).toLocaleString()}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">Heart Rate</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{measurement.heart_rate}</p>
                      <p className="text-xs text-gray-500">bpm</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">SpO₂</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{measurement.spo2}</p>
                      <p className="text-xs text-gray-500">%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">Systolic</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{measurement.systolic}</p>
                      <p className="text-xs text-gray-500">mmHg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">Diastolic</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{measurement.diastolic}</p>
                      <p className="text-xs text-gray-500">mmHg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">Respiratory Rate</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{measurement.respiratory_rate || '-'}</p>
                      <p className="text-xs text-gray-500">/min</p>
                    </div>
                    <div className="bg-gray-50 p-3 text-center rounded-lg border border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold">Temperature</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{measurement.temperature || '-'}</p>
                      <p className="text-xs text-gray-500">°C</p>
                    </div>
                  </div>

                  {measurement.prediction && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-300 mb-4">
                      <p className="text-sm font-semibold text-gray-900">Risk Assessment</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(measurement.prediction.risk_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {measurement.prediction.reason && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-gray-900">Reason</p>
                      <p className="text-sm text-gray-800">{measurement.prediction.reason}</p>
                    </div>
                  )}

                  {measurement.notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-gray-900">Notes</p>
                      <p className="text-sm text-gray-800">{measurement.notes}</p>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteMeasurement(measurement.id)}
                    disabled={deleting === measurement.id}
                  >
                    {deleting === measurement.id ? 'Deleting...' : 'Delete'}
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
