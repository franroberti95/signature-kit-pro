import { 
  User,
  Calendar,
  Phone,
  Mail,
  Stethoscope,
  PenTool
} from "lucide-react";

export interface VariableType {
  name: string;
  type: 'text' | 'textarea' | 'signature' | 'date';
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  prePopulated?: boolean; // Fields that are auto-filled and shouldn't appear in stepper
}

// Common variables for medical/dental documents
export const COMMON_VARIABLES: VariableType[] = [
  { name: "patient_name", type: "text", label: "Patient Name", icon: User },
  { name: "patient_surname", type: "text", label: "Patient Surname", icon: User },
  { name: "patient_signature", type: "signature", label: "Patient Signature", icon: PenTool },
  { name: "professional_signature", type: "signature", label: "Professional Signature", icon: PenTool },
  { name: "today_date", type: "date", label: "Today's Date", icon: Calendar, prePopulated: true },
  { name: "patient_id", type: "text", label: "Patient ID", icon: User, prePopulated: true },
  { name: "date_of_birth", type: "date", label: "Date of Birth", icon: Calendar },
  { name: "phone_number", type: "text", label: "Phone Number", icon: Phone },
  { name: "email_address", type: "text", label: "Email Address", icon: Mail },
  { name: "appointment_date", type: "date", label: "Appointment Date", icon: Calendar },
  { name: "doctor_name", type: "text", label: "Doctor Name", icon: Stethoscope },
];
