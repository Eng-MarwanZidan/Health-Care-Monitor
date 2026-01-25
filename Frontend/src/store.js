import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  user: null,
  isLoading: false,
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
    set({ token });
  },

  setRefreshToken: (refreshToken) => {
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }
    set({ refreshToken });
  },

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ token: null, refreshToken: null, user: null });
  },
}));

export const usePatientStore = create((set) => ({
  patients: [],
  currentPatient: null,
  isLoading: false,
  error: null,

  setPatients: (patients) => set({ patients }),
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  addPatient: (patient) => set((state) => ({ patients: [patient, ...state.patients] })),
  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentPatient: state.currentPatient?.id === id ? { ...state.currentPatient, ...updates } : state.currentPatient,
    })),
  deletePatient: (id) =>
    set((state) => ({
      patients: state.patients.filter((p) => p.id !== id),
      currentPatient: state.currentPatient?.id === id ? null : state.currentPatient,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export const useMeasurementStore = create((set) => ({
  measurements: [],
  currentMeasurement: null,
  isLoading: false,
  error: null,

  setMeasurements: (measurements) => set({ measurements }),
  setCurrentMeasurement: (measurement) => set({ currentMeasurement: measurement }),
  addMeasurement: (measurement) => set((state) => ({ measurements: [measurement, ...state.measurements] })),
  deleteMeasurement: (id) =>
    set((state) => ({
      measurements: state.measurements.filter((m) => m.id !== id),
      currentMeasurement: state.currentMeasurement?.id === id ? null : state.currentMeasurement,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
