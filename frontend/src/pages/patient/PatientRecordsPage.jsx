import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Pill, Calendar } from 'lucide-react';
import api from '../../api/axios';

const PatientRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRecords = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, prescRes] = await Promise.all([
        api.get('/medical-records'),
        api.get('/prescriptions'),
      ]);
      setRecords(recRes.data.records || []);
      setPrescriptions(prescRes.data.prescriptions || []);
    } catch (err) {
      console.error('Error loading patient clinical records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRecords();
  }, [fetchMyRecords]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
        Loading your prescriptions and medical records...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Prescriptions &amp; Medical Records
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review your clinical diagnoses, physician notes, and active medication instructions.
        </p>
      </div>

      {/* Section 1: Prescriptions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-medical-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Active &amp; Past Prescriptions ({prescriptions.length})
          </h2>
        </div>

        {prescriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
            No prescriptions have been issued to your profile yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {prescriptions.map((pr) => (
              <div
                key={pr._id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Dr. {pr.doctorId?.userId?.name?.replace(/^Dr\.\s*/i, '') || 'Physician'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {pr.doctorId?.departmentId?.name || 'Clinical Specialist'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(pr.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {pr.medicines?.map((med, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs border border-slate-100"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{med.name}</span>
                        <span className="ml-2 rounded bg-medical-100 px-2 py-0.5 font-semibold text-medical-700">
                          {med.dosage}
                        </span>
                      </div>
                      <span className="text-slate-600">
                        {med.frequency} ({med.duration})
                      </span>
                    </div>
                  ))}
                </div>

                {pr.instructions && (
                  <p className="mt-3 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900 border border-amber-100">
                    <strong>Instructions:</strong> {pr.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Medical Records */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-medical-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Clinical Medical History ({records.length})
          </h2>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
            No clinical diagnoses recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((rec) => (
              <div
                key={rec._id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
              >
                <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-base font-bold text-medical-700">
                      {rec.diagnosis}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Attending Physician: {rec.doctorId?.userId?.name || 'Doctor'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Reported Symptoms
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {rec.symptoms?.length > 0 ? (
                        rec.symptoms.map((s, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None listed</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Treatment Plan
                    </p>
                    <p className="mt-1 text-sm text-slate-800">{rec.treatment}</p>
                  </div>
                </div>

                {rec.notes && (
                  <p className="mt-3 text-xs text-slate-500 italic">
                    Note: {rec.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecordsPage;
