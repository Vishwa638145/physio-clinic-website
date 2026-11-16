/**
 * ─────────────────────────────────────────────────────────────
 *  ALL clinic content lives in this file.
 *  Update every value marked EDIT with the client's real details.
 * ─────────────────────────────────────────────────────────────
 */

export const BRAND = {
  /** EDIT: clinic name shown in the header, footer, page titles and Ads Studio */
  name: 'Clinic Name',
  /** EDIT: short descriptor under the name in the logo */
  descriptor: 'Physiotherapy & Rehabilitation',
  /** EDIT: path to the logo file in frontend/public (e.g. 'images/logo.svg'). Leave '' to use the built-in mark. */
  logoSrc: '',
  /** EDIT: public website address. Ads link here, so it must be the live https domain. */
  siteUrl: 'https://www.example.com',
  /** EDIT: city or area, used in copy ("home visits across …") */
  city: 'Chennai',
  phone: '+91 98400 00000', // EDIT
  phoneHref: 'tel:+919840000000', // EDIT
  whatsappHref: 'https://wa.me/919840000000?text=Hi%2C%20I%27d%20like%20to%20book%20a%20physiotherapy%20appointment.', // EDIT
  email: 'care@example.com', // EDIT
  /** EDIT (optional): clinic address lines. Leave empty to hide the address everywhere. */
  address: [] as string[],
  /** EDIT (optional): Google Maps link, shown only when an address is set */
  mapsHref: '',
  /** Clinic location: the default centre for "around the clinic" ad targeting in the Ads Studio */
  geo: { latitude: 13.0827, longitude: 80.2707, label: 'the clinic' }, // EDIT
  /** EDIT (optional): shown only when set, e.g. { score: 4.9, count: 120, href: 'https://g.page/…' } */
  googleRating: null as null | { score: number; count: number; href: string },
  instagram: '', // EDIT (optional)
  facebook: '', // EDIT (optional)
};

/* ── The physiotherapist ─────────────────────────────────── */
export const DOCTOR = {
  name: 'Dr. Anjali Rao', // EDIT
  title: 'Consultant Physiotherapist', // EDIT
  qualifications: 'BPT, MPT (Orthopaedics)', // EDIT
  experienceYears: 12, // EDIT
  /** EDIT: put a portrait in frontend/public/images/doctor.jpg (portrait orientation works best) */
  photo: 'images/doctor.jpg',
  initials: 'AR', // EDIT
  intro:
    'I started this practice so that every patient is assessed, treated and followed up by the same physiotherapist. You will see me at every session, at the clinic or at your home, and I will explain what we are doing and why.', // EDIT
  bio: [
    'After my master’s in orthopaedic physiotherapy I spent several years in hospital and sports rehabilitation, working with patients after joint replacements, ligament surgery and spinal problems.',
    'My approach is simple: find the cause, treat it with hands-on care and exercise, and give you a plan you can follow at home so the problem stays away.',
  ], // EDIT
  credentials: [
    'Master of Physiotherapy (Orthopaedics)',
    'Certified in manual therapy and dry needling',
    'Experience in hospital and sports rehabilitation',
    'Registered physiotherapist',
  ], // EDIT
  focus: ['Joint pain and arthritis', 'Back and neck pain', 'Post-surgery rehab', 'Sports injuries', 'Senior care'], // EDIT
};

/* ── Opening hours (Asia/Kolkata). 0 = Sunday … 6 = Saturday. 24h "HH:MM". ── */
export const WEEKLY_HOURS: [string, string][][] = [
  [], // Sun: closed
  [['08:00', '13:00'], ['16:00', '20:30']],
  [['08:00', '13:00'], ['16:00', '20:30']],
  [['08:00', '13:00'], ['16:00', '20:30']],
  [['08:00', '13:00'], ['16:00', '20:30']],
  [['08:00', '13:00'], ['16:00', '20:30']],
  [['08:00', '13:00']], // Sat
]; // EDIT
export const HOURS_DISPLAY = [
  { days: 'Monday to Friday', time: '8:00 am – 1:00 pm, 4:00 pm – 8:30 pm' },
  { days: 'Saturday', time: '8:00 am – 1:00 pm' },
  { days: 'Sunday', time: 'Home visits by appointment' },
]; // EDIT

/* ── Photos ──────────────────────────────────────────────────
   Free images from Unsplash (Unsplash License), loaded from Unsplash's CDN.
   Replace with the clinic's own photos whenever available: put files in
   frontend/public/images/ and change the paths to 'images/your-file.jpg'.
   ─────────────────────────────────────────────────────────── */
const u = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTOS = {
  hero: { src: u('photo-1649751361457-01d3a696c7e6', 1400), alt: 'Physiotherapist examining a patient’s leg' },
  homeVisit: { src: u('photo-1773227055624-07b515ba87c5'), alt: 'Physiotherapist helping an older woman walk with a walker at home' },
  consult: { src: u('photo-1758691463000-08b98131daf3'), alt: 'Physiotherapist explaining a scan to a patient on a tablet' },
  care: { src: u('photo-1758691462071-757bca955439'), alt: 'Physiotherapist reassuring a patient' },
  exercise: { src: u('photo-1645005513713-9e2b92a687d3'), alt: 'Patient doing supervised strength exercises with dumbbells' },
};

/* ── Services ────────────────────────────────────────────── */
export type ServiceIcon = 'bone' | 'spine' | 'run' | 'joint' | 'shoulder' | 'brain' | 'balance' | 'home';

export interface Service {
  slug: string;
  name: string;
  icon: ServiceIcon;
  image: string;
  short: string;
  description: string;
  helpsWith: string[];
  approach: string[];
  atHome: boolean;
}

export const SERVICES: Service[] = [
  {
    slug: 'orthopaedic',
    name: 'Orthopaedic physiotherapy',
    icon: 'bone',
    image: u('photo-1649751361457-01d3a696c7e6', 900),
    short: 'Joint pain, arthritis, fractures and muscle injuries.',
    description: 'Treatment for painful, stiff or weak joints and muscles, from knee arthritis to recovery after a fracture.',
    helpsWith: ['Knee and hip arthritis', 'Stiffness after a fracture', 'Ligament and muscle sprains', 'Tennis elbow and wrist pain'],
    approach: ['Detailed assessment of movement and strength', 'Manual therapy to ease pain and stiffness', 'Progressive strengthening plan'],
    atHome: true,
  },
  {
    slug: 'back-neck',
    name: 'Back and neck pain',
    icon: 'spine',
    image: u('photo-1768507423533-b87b62769758', 900),
    short: 'Disc problems, sciatica, stiff necks and posture pain.',
    description: 'Most back and neck pain settles with the right treatment and movement, not long rest.',
    helpsWith: ['Lower back pain and sciatica', 'Slipped or bulging disc', 'Cervical spondylosis', 'Desk and posture-related pain'],
    approach: ['Hands-on mobilisation to settle the flare-up', 'Core and spine strengthening', 'Advice on sitting, lifting and sleep'],
    atHome: true,
  },
  {
    slug: 'sports',
    name: 'Sports injury rehabilitation',
    icon: 'run',
    image: u('photo-1645005513713-9e2b92a687d3', 900),
    short: 'Sprains, strains and safe return to sport.',
    description: 'From the first days after an injury to getting back on the field, with testing at each stage.',
    helpsWith: ['Ankle sprains', 'Hamstring and calf strains', 'Runner’s knee and shin pain', 'Shoulder injuries in cricket and gym'],
    approach: ['Injury assessment and taping', 'Strength, balance and agility training', 'Return-to-sport testing'],
    atHome: false,
  },
  {
    slug: 'post-surgery',
    name: 'Post-surgery rehabilitation',
    icon: 'joint',
    image: u('photo-1758691463000-08b98131daf3', 900),
    short: 'After knee or hip replacement, ACL repair and spine surgery.',
    description: 'Structured rehab that follows your surgeon’s protocol and keeps them informed of your progress.',
    helpsWith: ['Knee and hip replacement', 'ACL and ligament reconstruction', 'Fracture fixation', 'Spine surgery'],
    approach: ['Home visits in the first weeks if needed', 'Range, swelling and walking checks', 'Gradual return to daily activities'],
    atHome: true,
  },
  {
    slug: 'shoulder',
    name: 'Shoulder rehabilitation',
    icon: 'shoulder',
    image: u('photo-1645005512968-0c1fe99f0093', 900),
    short: 'Frozen shoulder, rotator cuff problems and stiffness.',
    description: 'Phase-by-phase treatment to bring back reach, rotation and strength without pain.',
    helpsWith: ['Frozen shoulder', 'Rotator cuff injuries', 'Shoulder impingement', 'Recovery after dislocation'],
    approach: ['Pain relief and mobilisation', 'Targeted strengthening', 'Everyday reaching and lifting practice'],
    atHome: true,
  },
  {
    slug: 'neuro',
    name: 'Neurological rehabilitation',
    icon: 'brain',
    image: u('photo-1758691462071-757bca955439', 900),
    short: 'Stroke recovery, Parkinson’s and nerve injuries.',
    description: 'Patient, goal-based rehab built around everyday tasks like standing, walking and using the hands.',
    helpsWith: ['Stroke recovery', 'Parkinson’s disease', 'Nerve injuries', 'Weakness after a long illness'],
    approach: ['Task-based training', 'Balance and walking practice', 'Family and carer guidance'],
    atHome: true,
  },
  {
    slug: 'senior',
    name: 'Senior care and fall prevention',
    icon: 'balance',
    image: u('photo-1773227059334-38d10a9075f2', 900),
    short: 'Strength, balance and confidence for older adults.',
    description: 'Gentle, safe programmes that keep older adults strong, steady and independent.',
    helpsWith: ['Fear of falling or recent falls', 'Poor balance', 'General weakness', 'Arthritis-related stiffness'],
    approach: ['Home safety check', 'Leg strength and balance training', 'Walking aid guidance'],
    atHome: true,
  },
  {
    slug: 'home',
    name: 'Physiotherapy at home',
    icon: 'home',
    image: u('photo-1773227055624-07b515ba87c5', 900),
    short: 'The same care, in the comfort of your home.',
    description: 'For patients who can’t travel easily: after surgery, after a stroke, or in older age.',
    helpsWith: ['Recovery after surgery', 'Stroke and neuro rehab', 'Elderly patients', 'Bed-bound or limited mobility'],
    approach: ['Portable equipment brought to you', 'Fixed visit timings', 'Progress updates for the family'],
    atHome: true,
  },
];

/* kept for the Ads Studio and forms */
export const ALL_SERVICES = SERVICES;

/* ── Why choose us ───────────────────────────────────────── */
export const WHY_US = [
  { icon: 'user', title: 'One physiotherapist, every visit', text: 'You are treated by the same experienced physiotherapist from assessment to recovery.' },
  { icon: 'clipboard', title: 'A plan made for you', text: 'Clear goals, a realistic timeline and exercises that fit your daily routine.' },
  { icon: 'home', title: 'Clinic or home', text: 'Choose clinic sessions or home visits, and switch whenever you need to.' },
  { icon: 'clock', title: 'Morning and evening slots', text: 'Appointments before and after work, six days a week.' },
] as const;

/* ── Treatment process ───────────────────────────────────── */
export const PROCESS = [
  { title: 'Consultation', text: 'We talk through your problem, history and goals, and look at any scans or reports.' },
  { title: 'Assessment', text: 'A thorough check of movement, strength and posture to find the cause.' },
  { title: 'Treatment', text: 'Hands-on therapy and guided exercise, one-to-one, at every session.' },
  { title: 'Recovery', text: 'A home programme that keeps you moving well long after treatment ends.' },
];

/* ── Conditions by body region (body map) ────────────────── */
export interface Region {
  id: string;
  name: string;
  x: number;
  y: number;
  conditions: { name: string; service: string }[];
}

export const REGIONS: Region[] = [
  { id: 'neck', name: 'Neck', x: 50, y: 18, conditions: [
    { name: 'Neck stiffness', service: 'back-neck' }, { name: 'Cervical spondylosis', service: 'back-neck' },
    { name: 'Tension headaches', service: 'back-neck' }, { name: 'Posture-related neck pain', service: 'back-neck' } ] },
  { id: 'shoulder', name: 'Shoulder', x: 70, y: 23, conditions: [
    { name: 'Frozen shoulder', service: 'shoulder' }, { name: 'Rotator cuff injury', service: 'shoulder' },
    { name: 'Shoulder impingement', service: 'shoulder' }, { name: 'After a dislocation', service: 'shoulder' } ] },
  { id: 'arm', name: 'Elbow, wrist and hand', x: 20, y: 52, conditions: [
    { name: 'Tennis elbow', service: 'orthopaedic' }, { name: 'Golfer’s elbow', service: 'orthopaedic' },
    { name: 'Carpal tunnel symptoms', service: 'orthopaedic' }, { name: 'Stiffness after a wrist fracture', service: 'orthopaedic' } ] },
  { id: 'back', name: 'Back and spine', x: 50, y: 39, conditions: [
    { name: 'Lower back pain', service: 'back-neck' }, { name: 'Sciatica', service: 'back-neck' },
    { name: 'Slipped or bulging disc', service: 'back-neck' }, { name: 'After spine surgery', service: 'post-surgery' } ] },
  { id: 'hip', name: 'Hip', x: 60, y: 52, conditions: [
    { name: 'Hip arthritis', service: 'orthopaedic' }, { name: 'Hip replacement recovery', service: 'post-surgery' },
    { name: 'Hip and groin strain', service: 'sports' } ] },
  { id: 'knee', name: 'Knee', x: 41, y: 74, conditions: [
    { name: 'Knee osteoarthritis', service: 'orthopaedic' }, { name: 'ACL or meniscus injury', service: 'sports' },
    { name: 'Knee replacement recovery', service: 'post-surgery' }, { name: 'Runner’s knee', service: 'sports' } ] },
  { id: 'ankle', name: 'Ankle and foot', x: 61, y: 94, conditions: [
    { name: 'Ankle sprain', service: 'sports' }, { name: 'Heel pain (plantar fasciitis)', service: 'orthopaedic' },
    { name: 'Achilles pain', service: 'sports' }, { name: 'Flat-foot pain', service: 'orthopaedic' } ] },
];

export const WHOLE_BODY = {
  name: 'Whole body',
  conditions: [
    { name: 'Stroke recovery', service: 'neuro' }, { name: 'Parkinson’s disease', service: 'neuro' },
    { name: 'Falls and poor balance', service: 'senior' }, { name: 'Weakness after illness', service: 'senior' },
  ],
};

/* ── Home visits ─────────────────────────────────────────── */
export const HOME_VISITS = {
  /** EDIT: areas you visit. Leave empty to say "across {city}" instead. */
  areas: [] as string[],
  benefits: [
    'No travel for patients in pain or recovering from surgery',
    'Exercises planned around your own home and furniture',
    'Family members can learn how to help',
    'Portable equipment brought to every visit',
  ],
  goodFor: ['After knee or hip replacement', 'Stroke and neurological conditions', 'Elderly patients', 'Limited mobility or bed rest'],
  steps: [
    { title: 'Call or request a call back', text: 'Tell us the problem and your location. We fix a convenient time, usually within a day.' },
    { title: 'First visit and assessment', text: 'A full assessment at home, plus a quick check of the space for safe exercise.' },
    { title: 'Regular visits', text: 'Sessions at a fixed time, two to five days a week depending on your plan.' },
    { title: 'Progress updates', text: 'Short updates for family members after each visit, on WhatsApp.' },
  ],
};

/* ── Reviews: shown only when you add real patient reviews (with their permission) ── */
export const REVIEWS: { name: string; text: string; condition?: string }[] = []; // EDIT

export const FAQS = [
  { q: 'Do I need a doctor’s referral?', a: 'No, you can book directly. If you have scans, X-rays or a surgeon’s notes, please bring them to your first visit.' },
  { q: 'How many sessions will I need?', a: 'It depends on the problem. Most people need between six and twelve sessions. You’ll get a clear estimate after your first assessment.' },
  { q: 'How long is each session?', a: 'The first assessment takes about an hour. Follow-up sessions take 45 minutes, always one-to-one.' },
  { q: 'Do you offer home visits?', a: `Yes. Home physiotherapy is available across ${BRAND.city} for patients who find it difficult to travel.` },
  { q: 'What should I wear?', a: 'Loose, comfortable clothes you can move in. Shorts are helpful for knee and ankle problems.' },
  { q: 'Can I claim physiotherapy on insurance?', a: 'We provide itemised receipts and a treatment summary. Whether it’s covered depends on your policy, so please check with your insurer.' },
]; // EDIT
