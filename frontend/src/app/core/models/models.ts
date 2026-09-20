export type UserRole = 'Admin' | 'Receptionist' | 'Specialist';
export type Gender = 'M' | 'F' | 'O';
export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  username: string;
  role: UserRole;
  specialistId?: string | null;
  companies: CompanyDto[];
}

export interface UserSession {
  username: string;
  role: UserRole;
  specialistId?: string | null;
  token: string;
  companyIds: string[];
}

export interface CompanyDto {
  id: string;
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCompanyDto {
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface UpdateCompanyDto {
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface AreaDto {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface SpecialtyDto {
  id: string;
  areaId: string;
  areaName: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface SpecialistDto {
  id: string;
  specialtyId: string;
  specialtyName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  licenseNumber: string;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
}

export interface SpecialistAvailabilityDto {
  id: string;
  specialistId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startHour: string; // "08:00:00"
  endHour: string;   // "16:00:00"
}

export interface InterventionTypeDto {
  id: string;
  specialtyId: string;
  specialtyName: string;
  name: string;
  description?: string | null;
  code?: string | null;
  durationMinutes: number;
  requiresAnesthesia: boolean;
  requiresHospitalization: boolean;
  isActive: boolean;
}

export interface UserDto {
  id: string;
  username: string;
  role: UserRole;
  specialistId?: string | null;
  specialistName?: string | null;
  isActive: boolean;
  companyIds: string[];
  companies: CompanyDto[];
}

export interface PatientDto {
  id: string;
  documentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  bloodType?: string | null;
  phone?: string | null;
  email?: string | null;
  allergies?: string | null;
  isActive: boolean;
}

export interface SchedulingDto {
  id: string;
  patientId: string;
  patientName: string;
  patientDocument: string;
  specialistId: string;
  specialistName: string;
  interventionTypeId: string;
  interventionName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
}

export interface TimeSlotDto {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isAvailable: boolean;
}

export interface MedicalRecordDto {
  id: string;
  patientId: string;
  patientName: string;
  specialistId: string;
  specialistName: string;
  consultationDate: string;
  reasonForVisit: string;
  symptoms?: string | null;
  diagnosis: string;
  treatmentPlan: string;
  bloodPressure?: string | null;
  heartRateBpm?: number | null;
  temperatureCelsius?: number | null;
  respiratoryRateBpm?: number | null;
  oxygenSaturationPct?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bodyMassIndex?: number | null;
}

export interface PrescriptionItemDto {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string | null;
}

export interface PrescriptionDto {
  id: string;
  patientId: string;
  patientName: string;
  specialistId: string;
  specialistName: string;
  medicalRecordId?: string | null;
  prescriptionDate: string;
  notes?: string | null;
  items: PrescriptionItemDto[];
}
