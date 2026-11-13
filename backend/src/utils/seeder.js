import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import Bill from '../models/Bill.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing records for clean seed
    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      Doctor.deleteMany(),
      Patient.deleteMany(),
      Appointment.deleteMany(),
      MedicalRecord.deleteMany(),
      Prescription.deleteMany(),
      Bill.deleteMany(),
    ]);

    console.log('Cleared existing database collections...');

    // 1. Create Departments
    const departments = await Department.insertMany([
      {
        name: 'Cardiology',
        description: 'Diagnosis and treatment of heart disorders and cardiovascular conditions.',
        status: 'active',
      },
      {
        name: 'Neurology',
        description: 'Specialized care for disorders of the nervous system and brain.',
        status: 'active',
      },
      {
        name: 'Orthopedics',
        description: 'Musculoskeletal system care, joint replacements, and sports injuries.',
        status: 'active',
      },
      {
        name: 'Pediatrics',
        description: 'Comprehensive medical care for infants, children, and adolescents.',
        status: 'active',
      },
      {
        name: 'General Medicine',
        description: 'Primary care, internal medicine, and preventive health screenings.',
        status: 'active',
      },
    ]);

    // 2. Create Users for each role
    const adminUser = await User.create({
      name: 'Dr. Eleanor Vance (Admin)',
      email: 'admin@medicore.com',
      password: 'Password123!',
      phone: '+1 (555) 100-0001',
      role: 'admin',
    });

    const doctorUser1 = await User.create({
      name: 'Dr. Marcus Sterling',
      email: 'doctor@medicore.com',
      password: 'Password123!',
      phone: '+1 (555) 200-0001',
      role: 'doctor',
    });

    const doctorUser2 = await User.create({
      name: 'Dr. Sophia Chen',
      email: 'sophia.chen@medicore.com',
      password: 'Password123!',
      phone: '+1 (555) 200-0002',
      role: 'doctor',
    });

    const receptionistUser = await User.create({
      name: 'Clara Oswald',
      email: 'receptionist@medicore.com',
      password: 'Password123!',
      phone: '+1 (555) 300-0001',
      role: 'receptionist',
    });

    const patientUser1 = await User.create({
      name: 'James Miller',
      email: 'patient@medicore.com',
      password: 'Password123!',
      phone: '+1 (555) 400-0001',
      role: 'patient',
    });

    const patientUser2 = await User.create({
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      password: 'Password123!',
      phone: '+1 (555) 400-0002',
      role: 'patient',
    });

    // 3. Create Doctor Profiles
    const doctor1 = await Doctor.create({
      userId: doctorUser1._id,
      specialization: 'Interventional Cardiology',
      departmentId: departments[0]._id,
      qualification: 'MD, FACC',
      experience: 14,
      consultationFee: 180,
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Friday', startTime: '09:00', endTime: '15:00', isAvailable: true },
      ],
    });

    const doctor2 = await Doctor.create({
      userId: doctorUser2._id,
      specialization: 'Clinical Neurology',
      departmentId: departments[1]._id,
      qualification: 'MD, PhD',
      experience: 10,
      consultationFee: 200,
      availability: [
        { day: 'Monday', startTime: '10:00', endTime: '18:00', isAvailable: true },
        { day: 'Wednesday', startTime: '10:00', endTime: '18:00', isAvailable: true },
        { day: 'Friday', startTime: '10:00', endTime: '16:00', isAvailable: true },
      ],
    });

    // Assign head doctors to departments
    departments[0].headDoctor = doctor1._id;
    await departments[0].save();
    departments[1].headDoctor = doctor2._id;
    await departments[1].save();

    // 4. Create Patient Profiles
    const patient1 = await Patient.create({
      userId: patientUser1._id,
      dateOfBirth: new Date('1988-06-15'),
      gender: 'Male',
      address: '742 Evergreen Terrace, Suite 4B, Springfield',
      bloodGroup: 'O+',
      emergencyContact: {
        name: 'Sarah Miller',
        phone: '+1 (555) 400-9999',
        relation: 'Spouse',
      },
    });

    await Patient.create({
      userId: patientUser2._id,
      dateOfBirth: new Date('1994-11-22'),
      gender: 'Female',
      address: '1200 Lakeshore Drive, Apt 1102, Chicago',
      bloodGroup: 'A+',
      emergencyContact: {
        name: 'Victor Rostov',
        phone: '+1 (555) 400-8888',
        relation: 'Brother',
      },
    });

    // 5. Create Sample Appointment, Medical Record, Prescription, and Bill
    const todayStr = new Date().toISOString().split('T')[0];

    const sampleAppointment = await Appointment.create({
      patientId: patient1._id,
      doctorId: doctor1._id,
      appointmentDate: todayStr,
      appointmentTime: '10:30',
      reason: 'Annual cardiovascular checkup and blood pressure monitoring',
      status: 'scheduled',
      notes: 'Patient requested morning slot.',
    });

    await MedicalRecord.create({
      patientId: patient1._id,
      doctorId: doctor1._id,
      diagnosis: 'Mild Essential Hypertension (Stage 1)',
      symptoms: ['Occasional morning headache', 'Elevated blood pressure (138/88 mmHg)'],
      treatment: 'Low-sodium diet, regular aerobic exercise, and daily ACE inhibitor therapy.',
      notes: 'Follow-up in 4 weeks to reassess blood pressure response.',
    });

    await Prescription.create({
      patientId: patient1._id,
      doctorId: doctor1._id,
      appointmentId: sampleAppointment._id,
      medicines: [
        {
          name: 'Lisinopril',
          dosage: '10 mg',
          frequency: 'Once daily in the morning',
          duration: '30 days',
        },
        {
          name: 'Aspirin (Low Dose)',
          dosage: '81 mg',
          frequency: 'Once daily after meal',
          duration: '30 days',
        },
      ],
      instructions: 'Monitor blood pressure every morning before taking medication. Stay hydrated.',
    });

    await Bill.create({
      patientId: patient1._id,
      appointmentId: sampleAppointment._id,
      amount: 180,
      paymentStatus: 'paid',
      paymentMethod: 'card',
    });

    console.log('====================================================');
    console.log('Demo Database Seeded Successfully!');
    console.log('Demo Accounts (Password for all: Password123!):');
    console.log('  Admin:        admin@medicore.com');
    console.log('  Doctor:       doctor@medicore.com');
    console.log('  Receptionist: receptionist@medicore.com');
    console.log('  Patient:      patient@medicore.com');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
