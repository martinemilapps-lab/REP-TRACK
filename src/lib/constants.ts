import { Representative } from '@/types';

export const INITIAL_REPRESENTATIVES: Representative[] = [
  { id: 'rep-1', name: 'Marwa shaaban', area: 'Maadi and Helwan', assignedHospitals: 40, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-2', name: 'Engy Hosny', area: 'Shobra', assignedHospitals: 30, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-3', name: 'Esraa Shehata', area: 'Down Town', assignedHospitals: 30, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-4', name: 'Philip Nayer', area: 'Masr el Gedida', assignedHospitals: 50, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-5', name: 'Fawzy Nasser', area: 'Cairo East', assignedHospitals: 20, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-6', name: 'Sara Adel', area: 'Doki and Mohandsen', assignedHospitals: 40, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-7', name: 'Mostafa Ahmed', area: 'October', assignedHospitals: 30, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-8', name: 'Mohamed Baiomy', area: 'Haram and Faisal', assignedHospitals: 50, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-9', name: 'Helana Talaat', area: 'Alex', assignedHospitals: 50, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-10', name: 'Ahmed Hassan', area: 'Menofya and Qalubia', assignedHospitals: 30, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-11', name: 'Ahmed El Mesalamy', area: 'Sharkia', assignedHospitals: 40, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-12', name: 'Emad Latif', area: 'Mansoura', assignedHospitals: 30, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-13', name: 'Marina Sameh', area: 'Tanata', assignedHospitals: 30, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-14', name: 'Kirollos Adel', area: 'Sohag', assignedHospitals: 20, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-15', name: 'Randa Magdy', area: 'Qena', assignedHospitals: 40, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-16', name: 'John Amin', area: 'Assuit', assignedHospitals: 30, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-17', name: 'Girgis Younan', area: 'Minia', assignedHospitals: 30, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-18', name: 'Ahmed El Kot', area: 'Damanhour', assignedHospitals: 40, assignedPharmacies: 20, assignedDrs: 100 },
  { id: 'rep-19', name: 'Amanda Medhat', area: 'Fayum and Benisuef', assignedHospitals: 40, assignedPharmacies: 20, assignedDrs: 100 }
];

export const PRODUCTS_LIST = [
  'Nitrong',
  'Danasetron',
  'Beconeurin',
  'Levosimendan'
];

export const HOSPITAL_TYPES = [
  { value: 'Private', label: 'خاص (Private)' },
  { value: 'Government', label: 'حكومي (Government)' },
  { value: 'University', label: 'جامعي (University)' },
  { value: 'Insurance', label: 'تأمين صحي (Insurance)' },
  { value: 'Other', label: 'أخرى (Other)' }
];

export const MONTHS_LIST = [
  'Jan', 'Feb', 'March', 'April', 'May', 'June',
  'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const VISIT_STATUS_OPTIONS = [
  { value: 'Visited', label: 'تمت الزيارة' },
  { value: 'Overdue', label: 'متأخرة' },
  { value: 'Not visited yet', label: 'لسه ماتزارتش' }
];

export const PHARMACY_CLASSES = ['A', 'B', 'C'];
export const DOCTOR_CLASSES = ['A', 'B'];
