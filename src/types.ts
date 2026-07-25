export type TransactionType = 'received' | 'pending' | 'sent';

export interface ReceivedMoney {
  id: string;
  type: 'received';
  personName: string;
  amount: number;
  date: string;
  purpose: string;
  invoiceNumber?: string;
}

export interface SentMoney {
  id: string;
  type: 'sent';
  personName: string;
  amount: number;
  date: string;
  purpose: string;
  invoiceNumber?: string;
}

export interface PendingMoney {
  id: string;
  type: 'pending';
  personName: string;
  phoneNumber?: string;
  email?: string;
  amount: number;
  reason: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  reminderFrequency: 'once' | '3days' | '7days' | '15days' | 'monthly';
  nextReminderDate: string;
  reminderStatus: 'active' | 'paused';
  penaltyEnabled?: boolean;
  penaltyType?: 'fixed' | 'percent_day' | 'percent_week' | 'percent_month';
  penaltyValue?: number;
  gracePeriod?: number; // in days
  aiTone?: 'friendly' | 'professional' | 'strict' | 'formal';
}

export type Transaction = ReceivedMoney | PendingMoney | SentMoney;

export interface RegisteredDevice {
  id: string; // The credential ID
  name: string; // Friendly name (e.g. "Windows Hello", "iPhone")
  publicKey: Uint8Array;
  addedAt: string;
  lastUsedAt: string | null;
  transports?: AuthenticatorTransport[];
}

export interface SecuritySettings {
  pinEnabled: boolean;
  pin: string | null;
  biometricEnabled: boolean;
  faceUnlockEnabled: boolean;
  autoLockTime: number; // in minutes
  registeredDevices: RegisteredDevice[];
}

export interface EmailSettings {
  enabled: boolean;
  emailAddress: string;
  verificationStatus?: 'verified' | 'pending' | 'invalid' | 'none';
  lastReportSent: string | null;
  nextScheduledReport: string | null;
}

export interface ReportSchedule {
  frequency: 'monthly' | 'weekly' | 'daily' | 'custom';
  customDay?: number;
  time: string; // HH:MM
  timezone: string;
}

export interface ReportSettings {
  emailAddress: string;
  verificationStatus: 'verified' | 'pending' | 'invalid' | 'none';
  schedule: ReportSchedule;
  includePdf: boolean;
}

export interface EmailHistoryLog {
  id: string;
  date: string;
  month: string;
  recipient: string;
  status: 'success' | 'failed';
  fileSizeXlsx?: number;
  fileSizePdf?: number;
  type?: 'monthly_report' | 'test_report' | 'simple_summary';
}

export interface GeneratedReport extends EmailHistoryLog {
  xlsxUrl?: string;
  pdfUrl?: string;
  aiSummary?: string;
  downloadCount?: number;
}

export interface GeneralSettings {
  timezone: string;
}

export interface AiRecognitionSettings {
  enabled: boolean;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'manual';
  enablePhoto: boolean;
  enableAiMessage: boolean;
  whatsappDelivery: 'auto' | 'ask' | 'download_only';
  theme: 'luxury_gold' | 'premium_blue' | 'executive_black' | 'royal_purple';
  orientation: 'portrait' | 'square' | 'landscape';
}

export interface AiRecognitionHistory {
  id: string;
  customerName: string;
  awardTitle: string;
  date: string;
  deliveryStatus: 'sent' | 'pending' | 'downloaded';
  posterUrl?: string;
}

export interface PlaceholderStyle {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  isBold: boolean;
  alignment: 'left' | 'center' | 'right';
  borderRadius: number;
  opacity: number;
}

export type PlaceholderType = 'CustomerPhoto' | 'CustomerName' | 'AwardTitle' | 'TotalPaid' | 'TrustScore' | 'LifetimeValue' | 'LastPaymentDate' | 'AiMessage' | 'GeneratedDate' | 'CompanyLogo' | 'QRCode';

export interface PosterPlaceholder {
  id: string;
  type: PlaceholderType;
  style: PlaceholderStyle;
}

export interface PosterTemplate {
  id: string;
  name: string;
  imageUrl: string;
  isDefault: boolean;
  placeholders: PosterPlaceholder[];
}

export interface GullakEntry {
  id: string;
  personName: string;
  amount: number;
  date: string;
  time: string;
  paymentMethod: string;
  category: string;
  note: string;
  receiptImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GullakSettings {
  monthlyGoal: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
  xpEarned: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface AppState {
  isSetupComplete: boolean;
  startingBalance: number;
  customers: Customer[];
  transactions: Transaction[];
  gullakEntries: GullakEntry[];
  gullakSettings: GullakSettings;
  securitySettings: SecuritySettings;
  emailSettings: EmailSettings;
  emailHistory: EmailHistoryLog[];
  reportSettings?: ReportSettings;
  generatedReports?: GeneratedReport[];
  generalSettings: GeneralSettings;
  unlockedAchievements?: UnlockedAchievement[];
  aiRecognitionSettings?: AiRecognitionSettings;
  aiRecognitionHistory?: AiRecognitionHistory[];
  posterTemplates?: PosterTemplate[];
  userProfile?: UserProfile;
}



export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  country: string;
  language: string;
  memberSince: string;
  profilePhoto: string;
  
  businessName: string;
  businessCategory: string;
  gstNumber: string;
  upiId: string;
  businessAddress: string;
  website: string;
  businessLogo: string;
  
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  googleConnected: boolean;
  lastLogin: string;
  activeDevice: string;
}
