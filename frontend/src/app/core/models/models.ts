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
  userId?: string;
  username: string;
  role: UserRole;
  specialistId?: string | null;
  assignedCompanies?: CompanyDto[];
  companies?: CompanyDto[];
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
  birthDate?: string;
  dateOfBirth?: string;
  age: number;
  gender: Gender;
  bloodType?: string | null;
  phone?: string | null;
  email?: string | null;
  allergies?: string | null;
  isActive: boolean;
}

export type PaymentMethod = 'Cash' | 'CreditCard' | 'DebitCard' | 'BankTransfer' | 'ElectronicWallet';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Cancelled';
export type DocumentCategory = 'LabResult' | 'ImagingXRay' | 'ConsentForm' | 'ExternalReport' | 'PrescriptionOrder' | 'Other';

export interface SchedulingDto {
  id: string;
  companyId?: string;
  patientId: string;
  patientName: string;
  patientDocument?: string;
  patientDocumentId?: string;
  specialistId: string;
  specialistName: string;
  interventionTypeId: string;
  interventionName?: string;
  interventionTypeName?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  paymentStatus?: PaymentStatus | null;
  paymentAmount?: number | null;
  paymentMethod?: PaymentMethod | null;
  paymentId?: string | null;
}

export interface PaymentDto {
  id: string;
  companyId: string;
  schedulingId?: string | null;
  patientId: string;
  patientName?: string | null;
  patientDocumentId?: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string | null;
  invoiceOrReceiptNumber?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface CreatePaymentDto {
  schedulingId?: string | null;
  patientId: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  transactionReference?: string | null;
  notes?: string | null;
}

export interface DailyCashSummaryDto {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  cashAmount: number;
  cardAmount: number;
  transferAmount: number;
  electronicWalletAmount: number;
  pendingCount: number;
  paidCount: number;
}

export interface PatientDocumentDto {
  id: string;
  companyId: string;
  patientId: string;
  medicalRecordId?: string | null;
  title: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  category: DocumentCategory;
  description?: string | null;
  createdAt: string;
}

export interface TimeSlotDto {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isAvailable: boolean;
}

export interface MedicalRecordDto {
  id: string;
  companyId?: string;
  patientId: string;
  patientName?: string;
  interventionTypeId?: string | null;
  interventionTypeName?: string | null;
  recordDate: string;
  diagnosis: string;
  treatment?: string | null;
  notes?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  temperatureCelsius?: number | null;
  systolicBP?: number | null;
  diastolicBP?: number | null;
  heartRateBpm?: number | null;
  oxygenSaturation?: number | null;
  createdAt?: string;
}

export interface CreateMedicalRecordDto {
  patientId: string;
  interventionTypeId?: string | null;
  recordDate?: string;
  diagnosis: string;
  treatment?: string | null;
  notes?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  temperatureCelsius?: number | null;
  systolicBP?: number | null;
  diastolicBP?: number | null;
  heartRateBpm?: number | null;
  oxygenSaturation?: number | null;
}

export interface PrescriptionItemDto {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string | null;
}

export interface CreatePrescriptionItemDto {
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

export interface CreatePrescriptionDto {
  patientId: string;
  medicalRecordId?: string | null;
  specialistId: string;
  prescriptionDate?: string;
  notes?: string | null;
  items: CreatePrescriptionItemDto[];
}
