import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientAPI, measurementAPI } from '../api';
import { Layout } from '../components/Layout';
import { Card, CardHeader, Button, Input, VitalCard, Alert, Loading, Badge } from '../components/UI';

export function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    heart_rate: '',
    spo2: '',
    systolic: '',
    diastolic: '',
    respiratory_rate: '',
    temperature: '',
    notes: ''
  });

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    setLoading(true);
    setError('');
    try {
      const [patientRes, measurementsRes] = await Promise.all([
        patientAPI.get(patientId),
        measurementAPI.list(patientId),
      ]);
      setPatient(patientRes.data);
      setMeasurements(measurementsRes.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error('Load patient error:', err);
      setError(err.response?.data?.detail || 'Failed to load patient data');
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data } = await measurementAPI.create(patientId, {
        ...formData,
        heart_rate: parseFloat(formData.heart_rate),
        spo2: parseFloat(formData.spo2),
        systolic: parseFloat(formData.systolic),
        diastolic: parseFloat(formData.diastolic),
        respiratory_rate: parseFloat(formData.respiratory_rate),
        temperature: parseFloat(formData.temperature),
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
        notes: ''
      });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add measurement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeasurement = async (id) => {
    if (!window.confirm('Delete this measurement?')) return;
    try {
      await measurementAPI.delete(id);
      setMeasurements(measurements.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete measurement error:', err);
      setError(err.response?.data?.detail || 'Failed to delete measurement');
    }
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!patient) {
    return (
      <Layout>
        <Alert type="error" onClose={() => navigate('/patients')}>
          {error || 'Patient not found'}. <button onClick={() => navigate('/patients')} className="underline">Go back to patients</button>
        </Alert>
      </Layout>
    );
  }

  const latestMeasurement = measurements[0];

  return (
    <Layout>
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="mb-6 flex justify-between items-start">
        <div>
          <Button             
            variant="primary"
            className='mb-3'
            onClick={() => navigate('/patients')}
          >
            {'Back to patients'}
          </Button>
          <h2 className="text-3xl font-bold text-gray-900">{patient.full_name}</h2>
          <p className="text-gray-600 text-md">DOB: {patient.dob || 'Not set'} | ID: {patient.id}</p>
        </div>
        <Button
          variant="danger"
          disabled={deleting}
          onClick={() => {
            if (window.confirm('Delete this patient?')) {
              setDeleting(true);
              patientAPI.delete(patientId)
                .then(() => navigate('/patients'))
                .catch(err => {
                  console.error('Delete patient error:', err);
                  setError(err.response?.data?.detail || 'Failed to delete patient');
                  setDeleting(false);
                });
            }
          }}
        >
          {deleting ? 'Deleting...' : 'Delete Patient'}
        </Button>
      </div>

      {/* Latest Measurement & Prediction */}
      {latestMeasurement && (
        <Card className="mb-8 bg-gradient-to-r from-medical-50 to-medical-100 border-medical-300">
          <CardHeader>
            <h3 className="text-xl font-bold text-medical-900">Latest Measurement</h3>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <VitalCard label="Heart Rate" value={latestMeasurement.heart_rate} unit="bpm" />
            <VitalCard label="SpO₂" value={latestMeasurement.spo2} unit="%" />
            <VitalCard label="Systolic" value={latestMeasurement.systolic} unit="mmHg" />
            <VitalCard label="Diastolic" value={latestMeasurement.diastolic} unit="mmHg" />
            <VitalCard label="RR" value={latestMeasurement.respiratory_rate} unit="/min" />
            <VitalCard label="Temp" value={latestMeasurement.temperature} unit="°C" />
          </div>

          {latestMeasurement.prediction && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">🔹Risk Assessment</p>
                  <p className="text-2xl font-semibold mt-2">{(latestMeasurement.prediction.risk_score * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <Badge variant={latestMeasurement.prediction.risk_label}>
                    {latestMeasurement.prediction.risk_label?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add Measurement Form */}
      <div className="mb-8">
        <Button
          variant={showForm ? 'secondary' : 'success'}
          onClick={() => setShowForm(!showForm)}
          className="mb-4"
        >
          {showForm ? '✕ Cancel' : '+ Add Measurement'}
        </Button>

        {showForm && (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold text-gray-900">Record New Measurement</h3>
            </CardHeader>
            <form onSubmit={handleAddMeasurement}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Heart Rate (bpm)"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 75"
                  value={formData.heart_rate}
                  onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                  required
                  disabled={submitting}
                />
                <Input
                  label="SpO₂ (%)"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 98"
                  value={formData.spo2}
                  onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                  required
                  disabled={submitting}
                />
                <Input
                  label="Systolic (mmHg)"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 120"
                  value={formData.systolic}
                  onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                  required
                  disabled={submitting}
                />
                <Input
                  label="Diastolic (mmHg)"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 80"
                  value={formData.diastolic}
                  onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                  required
                  disabled={submitting}
                />
                <Input
                  label="Respiratory Rate (/min)"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 16"
                  value={formData.respiratory_rate}
                  onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                  disabled={submitting}
                />
                <Input
                  label="Temperature (°C)"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 37.0"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  disabled={submitting}
                />
              </div>
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
      </div>

      {/* Measurement History */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold text-gray-900">Measurement History</h3>
        </CardHeader>
        {measurements.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No measurements recorded yet</p>
        ) : (
          <div className="space-y-4">
            {measurements.map((measurement) => (
              <div key={measurement.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{new Date(measurement.timestamp).toLocaleString()}</p>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <span>❤️ {measurement.heart_rate} bpm</span>
                      <span>💨 {measurement.spo2}%</span>
                      <span>🩺 {measurement.systolic}/{measurement.diastolic} mmHg</span>
                      <span>🫁 {measurement.respiratory_rate}/min</span>
                      <span>🌡️ {measurement.temperature}°C</span>
                    </div>
                  </div>
                  {measurement.prediction && (
                    <div className="text-right">
                      <Badge variant={measurement.prediction.risk_label}>
                        {measurement.prediction.risk_label?.toUpperCase()}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">{(measurement.prediction.risk_score * 100).toFixed(1)}%</p>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteMeasurement(measurement.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  );
}
