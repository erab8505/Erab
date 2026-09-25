export type UserRole = 'SuperAdmin' | 'Admin' | 'Receptionist' | 'Specialist' | 'Laboratorist';
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
  profileName?: string | null;
  roles: UserRole[];
  role?: UserRole;
  employeeId?: string | null;
  specialistId?: string | null;
  receptionistId?: string | null;
  assignedCompanies?: CompanyDto[];
  companies?: CompanyDto[];
}

export interface UserSession {
  username: string;
  profileName?: string | null;
  roles: UserRole[];
  role?: UserRole;
  employeeId?: string | null;
  specialistId?: string | null;
  receptionistId?: string | null;
  token: string;
  companyIds: string[];
}

export const CompanyFeatureKeys = {
  ModuleScheduling: 'MODULE_SCHEDULING',
  ModuleLaboratory: 'MODULE_LABORATORY',
  AllowReceptionistStudyOrders: 'ALLOW_RECEPTIONIST_STUDY_ORDERS',
} as const;

export type CompanyFeatureKey = typeof CompanyFeatureKeys[keyof typeof CompanyFeatureKeys];

export interface CompanyFeatureDto {
  featureKey: string;
  isEnabled: boolean;
  configValue?: string | null;
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
  features?: Record<string, boolean>;
}

export interface CreateCompanyDto {
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  isActive: boolean;
  features?: Record<string, boolean>;
}

export interface UpdateCompanyDto {
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  isActive: boolean;
  features?: Record<string, boolean>;
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

export interface EmployeeDto {
  id: string;
  companyId: string;
  companyName?: string | null;
  specialtyId?: string | null;
  specialtyName?: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  identificationNumber?: string | null;
  licenseNumber?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  identificationNumber?: string | null;
  licenseNumber?: string | null;
  specialtyId?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface UpdateEmployeeDto {
  firstName: string;
  lastName: string;
  identificationNumber?: string | null;
  licenseNumber?: string | null;
  specialtyId?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface EmployeeAvailabilityDto {
  id: string;
  employeeId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startHour: string; // "08:00:00"
  endHour: string;   // "16:00:00"
}

export interface CreateEmployeeAvailabilityDto {
  dayOfWeek: number;
  startHour: string;
  endHour: string;
}

export interface BulkEmployeeAvailabilityDto {
  availabilities: CreateEmployeeAvailabilityDto[];
}

export interface AvailableSlotDto {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Backward compatibility types
export type SpecialistDto = EmployeeDto;
export type SpecialistAvailabilityDto = EmployeeAvailabilityDto;
export type ReceptionistDto = EmployeeDto;
export type CreateReceptionistDto = CreateEmployeeDto;
export type UpdateReceptionistDto = UpdateEmployeeDto;

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
  roles: UserRole[];
  role?: UserRole;
  employeeId?: string | null;
  employeeName?: string | null;
  specialistId?: string | null;
  specialistName?: string | null;
  receptionistId?: string | null;
  receptionistName?: string | null;
  isActive: boolean;
  companyIds: string[];
  companies: CompanyDto[];
}

export interface CreateUserDto {
  username: string;
  password: string;
  roles: UserRole[];
  role?: UserRole;
  employeeId?: string | null;
  companyIds?: string[];
}

export interface UpdateUserDto {
  roles?: UserRole[];
  role?: UserRole;
  employeeId?: string | null;
  companyIds?: string[];
  isActive?: boolean;
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
  employeeId: string;
  employeeName?: string | null;
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

export interface CreateSchedulingDto {
  patientId: string;
  employeeId?: string;
  specialistId?: string;
  interventionTypeId: string;
  scheduledAt: string;
  durationMinutes: number;
  notes?: string | null;
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
  employeeId?: string;
  specialistId?: string;
  prescriptionDate?: string;
  notes?: string | null;
  items: CreatePrescriptionItemDto[];
}

// Clinical Studies & Lab Models
export type StudyCategory = 'Laboratory' | 'ImagingXRay' | 'Ultrasound' | 'Cardiology' | 'Endoscopy' | 'PathologyBiopsy' | 'Other';
export type SampleType = 'None' | 'VenousBlood' | 'Serum' | 'Plasma' | 'Urine' | 'Stool' | 'Swab' | 'TissueBiopsy' | 'FluidAspirate' | 'Sputum' | 'Other';
export type StudyOrderStatus = 'Requested' | 'SampleCollected' | 'InAnalysis' | 'Completed' | 'Delivered' | 'Cancelled';
export type ParameterValueType = 'Numeric' | 'Qualitative' | 'TextFree';

// ==========================================
// CLINICAL STUDIES & LABORATORY MODULE (MODULAR)
// ==========================================

export interface LabParameterDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  valueType: ParameterValueType;
  valueTypeName?: string;
  defaultReferenceMin?: number | null;
  defaultReferenceMax?: number | null;
  defaultReferenceText?: string | null;
  defaultReagentName?: string | null;
  defaultReagentQuantity?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateLabParameterDto {
  code: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  valueType: ParameterValueType;
  defaultReferenceMin?: number | null;
  defaultReferenceMax?: number | null;
  defaultReferenceText?: string | null;
  defaultReagentName?: string | null;
  defaultReagentQuantity?: number | null;
}

export interface UpdateLabParameterDto extends CreateLabParameterDto {
  isActive: boolean;
}

export interface LabExamParameterItemDto {
  id: string;
  labParameterId: string;
  parameterCode: string;
  parameterName: string;
  unit?: string | null;
  valueType: ParameterValueType;
  valueTypeName?: string;
  sortOrder: number;
  referenceRangeMin?: number | null;
  referenceRangeMax?: number | null;
  referenceText?: string | null;
  reagentName?: string | null;
  reagentQuantity?: number | null;
}

export interface LabExamDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sampleType: SampleType;
  sampleTypeName?: string;
  method?: string | null;
  turnaroundHours?: number | null;
  isActive: boolean;
  createdAt: string;
  parameters: LabExamParameterItemDto[];
}

export interface CreateLabExamParameterDto {
  labParameterId: string;
  sortOrder: number;
  customReferenceMin?: number | null;
  customReferenceMax?: number | null;
  customReferenceText?: string | null;
}

export interface CreateLabExamDto {
  code: string;
  name: string;
  description?: string | null;
  sampleType: SampleType;
  method?: string | null;
  turnaroundHours?: number | null;
  parameters: CreateLabExamParameterDto[];
}

export interface UpdateLabExamDto extends CreateLabExamDto {
  isActive: boolean;
}

export interface ClinicalStudyExamItemDto {
  id: string;
  labExamId: string;
  examCode: string;
  examName: string;
  sampleType: SampleType;
  sampleTypeName?: string;
  method?: string | null;
  sortOrder: number;
  parameters: LabExamParameterItemDto[];
}

export interface ClinicalStudyDto {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string | null;
  category: StudyCategory;
  categoryName?: string;
  basePrice: number;
  preparationInstructions?: string | null;
  turnaroundTimeHours?: number | null;
  isActive: boolean;
  createdAt: string;
  exams: ClinicalStudyExamItemDto[];
}

export interface CreateClinicalStudyExamDto {
  labExamId: string;
  sortOrder: number;
}

export interface CreateClinicalStudyDto {
  code: string;
  name: string;
  description?: string | null;
  category: StudyCategory;
  basePrice: number;
  preparationInstructions?: string | null;
  turnaroundTimeHours?: number | null;
  exams: CreateClinicalStudyExamDto[];
}

export interface UpdateClinicalStudyDto extends CreateClinicalStudyDto {
  isActive: boolean;
}

export interface StudyOrderResultDto {
  id: string;
  studyOrderItemId: string;
  labExamId: string;
  examName: string;
  labParameterId: string;
  parameterCode: string;
  parameterName: string;
  unit?: string | null;
  valueType: ParameterValueType;
  valueTypeName?: string;
  numericValue?: number | null;
  textValue?: string | null;
  referenceRangeMin?: number | null;
  referenceRangeMax?: number | null;
  referenceText?: string | null;
  isOutOfRange: boolean;
  alertLevel?: 'Normal' | 'High' | 'Low' | 'Critical' | string | null;
  interpretation?: string | null;
  technicianNotes?: string | null;
}

export interface StudyOrderItemDto {
  id: string;
  studyOrderId?: string;
  clinicalStudyId: string;
  studyCode: string;
  studyName: string;
  studyCategory: StudyCategory;
  studyCategoryName?: string;
  price: number;
  status: StudyOrderStatus;
  observations?: string | null;
  results: StudyOrderResultDto[];
}

export interface StudyOrderDto {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientDocumentId?: string | null;
  patientPhone?: string | null;
  specialistId?: string | null;
  specialistName?: string | null;
  laboratoristId?: string | null;
  laboratoristName?: string | null;
  schedulingId?: string | null;
  status: StudyOrderStatus;
  statusName?: string;
  orderDate: string;
  completedDate?: string | null;
  clinicalDiagnosis?: string | null;
  notes?: string | null;
  totalAmount: number;
  createdAt: string;
  paymentId?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  items: StudyOrderItemDto[];
}

export interface CreateStudyOrderDto {
  patientId: string;
  specialistId?: string | null;
  schedulingId?: string | null;
  clinicalDiagnosis?: string | null;
  notes?: string | null;
  clinicalStudyIds: string[];
}

export interface UpdateStudyOrderStatusDto {
  status: StudyOrderStatus;
}

export interface SaveParameterResultDto {
  studyOrderItemId: string;
  labParameterId: string;
  numericValue?: number | null;
  textValue?: string | null;
  interpretation?: string | null;
  technicianNotes?: string | null;
}

export interface SaveStudyResultsDto {
  specialistId?: string | null;
  laboratoristId?: string | null;
  laboratoristName?: string | null;
  generalInterpretation?: string | null;
  results: SaveParameterResultDto[];
}

export interface AuditLogDto {
  id: string;
  companyId?: string | null;
  companyName?: string | null;
  userId?: string | null;
  username: string;
  userRole: UserRole;
  action: string;
  module: string;
  entityId?: string | null;
  description: string;
  detailsJson?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AuditLogFilterDto {
  fromDate?: string | null;
  toDate?: string | null;
  role?: UserRole | null;
  userId?: string | null;
  module?: string | null;
  action?: string | null;
  search?: string | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedAuditLogsDto {
  items: AuditLogDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
