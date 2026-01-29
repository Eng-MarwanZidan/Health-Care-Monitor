import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../store';
import { patientAPI } from '../api';
import { Layout } from '../components/Layout';
import { Card, CardHeader, Button, Input, Alert, Loading } from '../components/UI';

export function PatientsPage() {
  const navigate = useNavigate();
  const { patients, setPatients, addPatient, deletePatient, setLoading: setPatientLoading } = usePatientStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ full_name: '', dob: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const { data } = await patientAPI.list();
      setPatients(data);
    } catch (err) {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data } = await patientAPI.create(formData);
      addPatient(data);
      setFormData({ full_name: '', dob: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.full_name?.[0] || 'Failed to create patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    setDeleting(id);
    try {
      await patientAPI.delete(id);
      deletePatient(id);
    } catch (err) {
      console.error('Delete patient error:', err);
      setError(err.response?.data?.detail || 'Failed to delete patient');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Patients</h2>
        <Button
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Patient'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900">Add New Patient</h3>
          </CardHeader>
          <form onSubmit={handleCreatePatient}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter patient's full name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              disabled={submitting}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              disabled={submitting}
            />
            <Button
              type="submit"
              variant="success"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Patient'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {patients.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600 text-lg">No patients yet. Create one to get started!</p>
          </Card>
        ) : (
          patients.map((patient) => (
            <Card key={patient.id}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">{patient.full_name}</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-800">
                    <div>
                      <p className="font-semibold">ID : {patient.id}</p> 
                      <span className="font-semibold">Date of birth :</span> {patient.dob || 'Not set'}
                    </div>
                    <div>
                      <span className="font-semibold">Added:</span> {new Date(patient.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeletePatient(patient.id)}
                    disabled={deleting === patient.id}
                  >
                    {deleting === patient.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}
