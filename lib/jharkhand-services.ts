// All 10 live services from jharbhoomi.jharkhand.gov.in. Each service opens
// in an in-app WebView (Chrome Custom Tab on Android via @capacitor/browser,
// a popup on web) so the user interacts with the REAL government portal and
// gets REAL data — not sample content. The URLs below were collected from
// the live portal and should be re-verified before each release.
import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  ClipboardCheck,
  FileSearch,
  FileText,
  Globe2,
  Landmark,
  Layers,
  Map,
  Scroll,
  UserPlus,
} from 'lucide-react'

export type JharkhandService = {
  id: string
  title: string
  english: string
  description: string
  url: string
  icon: LucideIcon
  theme: 'green' | 'blue' | 'saffron' | 'rose'
  category: 'खोजें' | 'नक्शा' | 'आवेदन'
}

export const JHARKHAND_SERVICES: JharkhandService[] = [
  {
    id: 'apna-khata',
    title: 'अपना खाता देखें',
    english: 'View Your Khata (ROR)',
    description: 'जिला, अंचल, मौजा चुनकर खातेदार का नाम / खाता नंबर से रिकॉर्ड देखें।',
    url: 'https://jharbhoomi.jharkhand.gov.in/MISROR/DistrictMap',
    icon: FileSearch,
    theme: 'green',
    category: 'खोजें',
  },
  {
    id: 'register-2',
    title: 'रजिस्टर-II देखें',
    english: 'View Register-II',
    description: 'खाता नंबर / खेसरा / खातेदार से रजिस्टर-II (भूमि रिकॉर्ड) देखें।',
    url: 'https://jharbhoomi.jharkhand.gov.in/MISRegister2/DistrictMap',
    icon: Scroll,
    theme: 'saffron',
    category: 'खोजें',
  },
  {
    id: 'khata-reg2',
    title: 'खाता + रजिस्टर-II',
    english: 'ROR + Register-II (combined)',
    description: 'खाता और रजिस्टर-II एक साथ — एक ही जगह से पूरा विवरण।',
    url: 'https://jharbhoomi.jharkhand.gov.in/MISROR_REG2/MISROR_REG2',
    icon: Layers,
    theme: 'blue',
    category: 'खोजें',
  },
  {
    id: 'plot-history',
    title: 'पंजी-II खेसरा-वार',
    english: 'Plot-wise transaction history',
    description: 'किसी खेसरा / प्लॉट का सारा लेन-देन इतिहास देखें।',
    url: 'https://jharbhoomi.jharkhand.gov.in/MISROR_REG2/Plot_Tran_Hist',
    icon: FileText,
    theme: 'rose',
    category: 'खोजें',
  },
  {
    id: 'khesra-full',
    title: 'खेसरा सम्पूर्ण विवरण',
    english: 'Full plot details (Khatian)',
    description: 'खेसरा का पूरा खातियान विवरण — स्वामी, क्षेत्रफल, श्रेणी।',
    url: 'https://jharbhoomi.jharkhand.gov.in/MISKhatianRegister2/DistrictMap',
    icon: ClipboardCheck,
    theme: 'green',
    category: 'खोजें',
  },
  {
    id: 'bhu-naksha',
    title: 'भू-नक्शा देखें',
    english: 'Land map (cadastral)',
    description: 'नक्शे पर खेसरा / प्लॉट खोजें और सीमा देखें।',
    url: 'https://jharbhunaksha.jharkhand.gov.in/',
    icon: Map,
    theme: 'blue',
    category: 'नक्शा',
  },
  {
    id: 'land-bank',
    title: 'भूमि बैंक',
    english: 'Land Bank (available land)',
    description: 'सरकारी / निजी निवेश के लिए उपलब्ध भूमि की सूची।',
    url: 'https://jharbhoomi.jharkhand.gov.in/NewlandBank',
    icon: Landmark,
    theme: 'saffron',
    category: 'नक्शा',
  },
  {
    id: 'online-apply',
    title: 'ऑनलाइन आवेदन',
    english: 'Online application (mutation etc.)',
    description: 'दाखिल-खारिज सहित सेवाओं के लिए ऑनलाइन आवेदन करें।',
    url: 'https://jharbhoomi.jharkhand.gov.in/Operater/UserLogin',
    icon: UserPlus,
    theme: 'green',
    category: 'आवेदन',
  },
  {
    id: 'application-status',
    title: 'आवेदन स्थिति',
    english: 'Application status',
    description: 'अपने आवेदन संख्या से स्थिति ट्रैक करें।',
    url: 'https://jharbhoomi.jharkhand.gov.in/ApplicationStatus/DistrictMap',
    icon: ClipboardCheck,
    theme: 'rose',
    category: 'आवेदन',
  },
  {
    id: 'district-sites',
    title: 'जिला की वेबसाइट',
    english: 'District websites',
    description: 'अपने जिले के राजस्व पोर्टल पर जाएं।',
    url: 'https://jharbhoomi.jharkhand.gov.in/KnowYourDistrict',
    icon: Globe2,
    theme: 'blue',
    category: 'नक्शा',
  },
  {
    id: 'lagan',
    title: 'ऑनलाइन लगान',
    english: 'Online Lagan (land-tax payment)',
    description: 'लगान / भूमि कर का ऑनलाइन भुगतान करें।',
    url: 'https://jharbhoomi.jharkhand.gov.in/',
    icon: Building2,
    theme: 'saffron',
    category: 'आवेदन',
  },
]

export function groupServices() {
  const groups: Record<JharkhandService['category'], JharkhandService[]> = {
    'खोजें': [],
    'नक्शा': [],
    'आवेदन': [],
  }
  for (const s of JHARKHAND_SERVICES) groups[s.category].push(s)
  return groups
}
