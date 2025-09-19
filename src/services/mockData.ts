// Mock data that simulates what would come from the backend
export const mockPreDefinedValues = {
  text_field_options: [
    { value: "patient_name", label: "Patient Name" },
    { value: "doctor_name", label: "Doctor Name" },
    { value: "appointment_date", label: "Appointment Date" },
    { value: "patient_id", label: "Patient ID" },
    { value: "diagnosis", label: "Diagnosis" },
    { value: "treatment_plan", label: "Treatment Plan" },
    { value: "insurance_provider", label: "Insurance Provider" },
    { value: "emergency_contact", label: "Emergency Contact" }
  ],
  signature_field_options: [
    { value: "patient_signature", label: "Patient Signature" },
    { value: "doctor_signature", label: "Doctor Signature" },
    { value: "witness_signature", label: "Witness Signature" },
    { value: "guardian_signature", label: "Guardian Signature" }
  ],
  date_field_options: [
    { value: "appointment_date", label: "Appointment Date" },
    { value: "birth_date", label: "Birth Date" },
    { value: "treatment_date", label: "Treatment Date" },
    { value: "follow_up_date", label: "Follow-up Date" },
    { value: "insurance_expiry", label: "Insurance Expiry Date" }
  ]
};

// Mock form completion data that would come from backend
export const mockFormCompletionData = {
  patient_name: "John Smith",
  doctor_name: "Dr. Sarah Johnson",
  appointment_date: "2024-01-15",
  patient_id: "PT-12345",
  diagnosis: "Routine Checkup",
  treatment_plan: "Annual physical examination",
  insurance_provider: "Blue Cross Health",
  emergency_contact: "Jane Smith - (555) 123-4567",
  birth_date: "1985-03-20",
  treatment_date: "2024-01-15",
  follow_up_date: "2024-07-15",
  insurance_expiry: "2024-12-31"
};

// Mock PDF templates that would be stored in backend
export const mockPDFTemplates = [
  {
    id: "template_1",
    name: "Medical Consent Form",
    description: "Standard medical consent and treatment form",
    pages: [
      {
        id: "page_1",
        format: "A4" as const,
        elements: [],
        backgroundImage: null
      }
    ]
  },
  {
    id: "template_2", 
    name: "Patient Information Form",
    description: "Comprehensive patient intake form",
    pages: [
      {
        id: "page_1",
        format: "A4" as const,
        elements: [],
        backgroundImage: null
      }
    ]
  }
];