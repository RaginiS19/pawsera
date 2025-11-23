// Dummy Data Service for Pawsera Application
// This provides realistic test data when Firebase data is unavailable

export const dummyUsers = [
  // Pet Owners
  {
    id: 'owner1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    role: 'PetOwner',
    status: 'active',
    city: 'Toronto',
    phone: '+1 (416) 555-0123',
    createdAt: '2024-01-15T10:30:00Z',
    profileImage: 'SJ'
  },
  {
    id: 'owner2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    role: 'PetOwner',
    status: 'active',
    city: 'Vancouver',
    phone: '+1 (604) 555-0456',
    createdAt: '2024-02-20T14:15:00Z',
    profileImage: 'MC'
  },
  {
    id: 'owner3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    role: 'PetOwner',
    status: 'active',
    city: 'Montreal',
    phone: '+1 (514) 555-0789',
    createdAt: '2024-03-10T09:45:00Z',
    profileImage: 'ER'
  },
  {
    id: 'owner4',
    name: 'David Thompson',
    email: 'david.thompson@email.com',
    role: 'PetOwner',
    status: 'active',
    city: 'Calgary',
    phone: '+1 (403) 555-0321',
    createdAt: '2024-01-25T16:20:00Z',
    profileImage: 'DT'
  },

  // Veterinarians
  {
    id: 'vet1',
    name: 'Dr. Olivia Bennett',
    email: 'dr.olivia.bennett@vetclinic.com',
    role: 'Vet',
    status: 'approved',
    specialization: 'Small Animal Medicine',
    clinic: 'Downtown Animal Hospital',
    phone: '+1 (416) 555-1001',
    experience: '8 years',
    rating: 4.9,
    createdAt: '2024-01-05T08:00:00Z',
    approvedAt: '2024-01-06T10:00:00Z',
    profileImage: 'OB'
  },
  {
    id: 'vet2',
    name: 'Dr. Ethan Walker',
    email: 'dr.ethan.walker@vetclinic.com',
    role: 'Vet',
    status: 'approved',
    specialization: 'Emergency Medicine',
    clinic: 'Emergency Pet Care Center',
    phone: '+1 (416) 555-1002',
    experience: '12 years',
    rating: 4.8,
    createdAt: '2024-01-10T09:30:00Z',
    approvedAt: '2024-01-11T11:15:00Z',
    profileImage: 'EW'
  },
  {
    id: 'vet3',
    name: 'Dr. Ava Mitchell',
    email: 'dr.ava.mitchell@vetclinic.com',
    role: 'Vet',
    status: 'approved',
    specialization: 'Dermatology',
    clinic: 'Skin & Coat Veterinary Clinic',
    phone: '+1 (416) 555-1003',
    experience: '6 years',
    rating: 4.9,
    createdAt: '2024-02-01T13:45:00Z',
    approvedAt: '2024-02-02T09:30:00Z',
    profileImage: 'AM'
  },
  {
    id: 'vet4',
    name: 'Dr. Noah Thompson',
    email: 'dr.noah.thompson@vetclinic.com',
    role: 'Vet',
    status: 'pending',
    specialization: 'Surgery',
    clinic: 'Advanced Surgical Center',
    phone: '+1 (416) 555-1004',
    experience: '10 years',
    rating: 4.7,
    createdAt: '2024-03-15T15:20:00Z',
    profileImage: 'NT'
  },
  {
    id: 'vet5',
    name: 'Dr. Sophia Hayes',
    email: 'dr.sophia.hayes@vetclinic.com',
    role: 'Vet',
    status: 'pending',
    specialization: 'Internal Medicine',
    clinic: 'Comprehensive Pet Care',
    phone: '+1 (416) 555-1005',
    experience: '7 years',
    rating: 4.8,
    createdAt: '2024-03-20T11:10:00Z',
    profileImage: 'SH'
  },

  // Admins
  {
    id: 'admin1',
    name: 'Ragini Shirwalkar',
    email: 'ragini@pawsera.com',
    role: 'Admin',
    status: 'active',
    permissions: ['user_management', 'vet_approval', 'system_analytics'],
    createdAt: '2024-01-01T00:00:00Z',
    profileImage: 'RS'
  },
  {
    id: 'admin2',
    name: 'John Smith',
    email: 'john.smith@pawsera.com',
    role: 'Admin',
    status: 'active',
    permissions: ['user_management', 'vet_approval'],
    createdAt: '2024-01-15T10:00:00Z',
    profileImage: 'JS'
  }
];

export const dummyPets = [
  {
    id: 'pet1',
    ownerId: 'owner1',
    ownerName: 'Sarah Johnson',
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: 3,
    gender: 'Male',
    weight: '65 lbs',
    color: 'Golden',
    microchipId: 'CHIP001234567',
    medicalHistory: ['Vaccinated', 'Neutered', 'No known allergies'],
    lastCheckup: '2024-02-15',
    nextCheckup: '2024-05-15',
    profileImage: '🐕',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'pet2',
    ownerId: 'owner1',
    ownerName: 'Sarah Johnson',
    name: 'Whiskers',
    species: 'Cat',
    breed: 'Persian',
    age: 2,
    gender: 'Female',
    weight: '8 lbs',
    color: 'White',
    microchipId: 'CHIP001234568',
    medicalHistory: ['Vaccinated', 'Spayed', 'Allergic to fish'],
    lastCheckup: '2024-01-20',
    nextCheckup: '2024-04-20',
    profileImage: '🐱',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'pet3',
    ownerId: 'owner2',
    ownerName: 'Michael Chen',
    name: 'Max',
    species: 'Dog',
    breed: 'German Shepherd',
    age: 5,
    gender: 'Male',
    weight: '75 lbs',
    color: 'Black and Tan',
    microchipId: 'CHIP001234569',
    medicalHistory: ['Vaccinated', 'Neutered', 'Hip dysplasia monitoring'],
    lastCheckup: '2024-03-01',
    nextCheckup: '2024-06-01',
    profileImage: '🐕',
    createdAt: '2024-02-20T14:15:00Z'
  },
  {
    id: 'pet4',
    ownerId: 'owner3',
    ownerName: 'Emily Rodriguez',
    name: 'Luna',
    species: 'Cat',
    breed: 'Maine Coon',
    age: 4,
    gender: 'Female',
    weight: '12 lbs',
    color: 'Black',
    microchipId: 'CHIP001234570',
    medicalHistory: ['Vaccinated', 'Spayed', 'No known issues'],
    lastCheckup: '2024-02-28',
    nextCheckup: '2024-05-28',
    profileImage: '🐱',
    createdAt: '2024-03-10T09:45:00Z'
  },
  {
    id: 'pet5',
    ownerId: 'owner4',
    ownerName: 'David Thompson',
    name: 'Charlie',
    species: 'Dog',
    breed: 'Labrador Retriever',
    age: 1,
    gender: 'Male',
    weight: '45 lbs',
    color: 'Chocolate',
    microchipId: 'CHIP001234571',
    medicalHistory: ['Vaccinated', 'Not neutered yet', 'Puppy training'],
    lastCheckup: '2024-03-10',
    nextCheckup: '2024-06-10',
    profileImage: '🐕',
    createdAt: '2024-01-25T16:20:00Z'
  }
];

export const dummyAppointments = [
  {
    id: 'apt1',
    petId: 'pet1',
    petName: 'Buddy',
    ownerId: 'owner1',
    ownerName: 'Sarah Johnson',
    vetId: 'vet1',
    vetName: 'Dr. Olivia Bennett',
    clinic: 'Downtown Animal Hospital',
    date: '2024-04-15',
    time: '10:00 AM',
    purpose: 'Annual Checkup',
    status: 'confirmed',
    notes: 'Regular annual examination and vaccination update',
    createdAt: '2024-03-20T14:30:00Z'
  },
  {
    id: 'apt2',
    petId: 'pet2',
    petName: 'Whiskers',
    ownerId: 'owner1',
    ownerName: 'Sarah Johnson',
    vetId: 'vet3',
    vetName: 'Dr. Ava Mitchell',
    clinic: 'Skin & Coat Veterinary Clinic',
    date: '2024-04-18',
    time: '2:30 PM',
    purpose: 'Skin Allergy Consultation',
    status: 'pending',
    notes: 'Follow-up on skin irritation and allergy testing',
    createdAt: '2024-03-22T09:15:00Z'
  },
  {
    id: 'apt3',
    petId: 'pet3',
    petName: 'Max',
    ownerId: 'owner2',
    ownerName: 'Michael Chen',
    vetId: 'vet2',
    vetName: 'Dr. Ethan Walker',
    clinic: 'Emergency Pet Care Center',
    date: '2024-04-12',
    time: '9:00 AM',
    purpose: 'Hip Dysplasia Follow-up',
    status: 'confirmed',
    notes: 'X-ray review and pain management assessment',
    createdAt: '2024-03-18T16:45:00Z'
  },
  {
    id: 'apt4',
    petId: 'pet4',
    petName: 'Luna',
    ownerId: 'owner3',
    ownerName: 'Emily Rodriguez',
    vetId: 'vet1',
    vetName: 'Dr. Olivia Bennett',
    clinic: 'Downtown Animal Hospital',
    date: '2024-04-20',
    time: '11:30 AM',
    purpose: 'Dental Cleaning',
    status: 'pending',
    notes: 'Annual dental cleaning and oral health check',
    createdAt: '2024-03-25T13:20:00Z'
  },
  {
    id: 'apt5',
    petId: 'pet5',
    petName: 'Charlie',
    ownerId: 'owner4',
    ownerName: 'David Thompson',
    vetId: 'vet2',
    vetName: 'Dr. Ethan Walker',
    clinic: 'Emergency Pet Care Center',
    date: '2024-04-10',
    time: '3:00 PM',
    purpose: 'Puppy Vaccination',
    status: 'completed',
    notes: 'Second round of puppy vaccinations completed successfully',
    createdAt: '2024-03-15T10:00:00Z'
  },
  {
    id: 'apt6',
    petId: 'pet1',
    petName: 'Buddy',
    ownerId: 'owner1',
    ownerName: 'Sarah Johnson',
    vetId: 'vet4',
    vetName: 'Dr. Noah Thompson',
    clinic: 'Advanced Surgical Center',
    date: '2024-04-25',
    time: '8:00 AM',
    purpose: 'Surgery Consultation',
    status: 'cancelled',
    notes: 'Cancelled due to scheduling conflict',
    createdAt: '2024-03-28T14:00:00Z'
  },
  {
    id: 'apt7',
    petId: 'pet2',
    petName: 'Whiskers',
    ownerId: 'owner1',
    ownerName: 'Sarah Johnson',
    vetId: 'vet1',
    vetName: 'Dr. Olivia Bennett',
    clinic: 'Downtown Animal Hospital',
    date: '2024-04-22',
    time: '2:00 PM',
    purpose: 'Vaccination',
    status: 'confirmed',
    notes: 'Annual vaccination and health check',
    createdAt: '2024-03-30T10:00:00Z'
  },
  {
    id: 'apt8',
    petId: 'pet3',
    petName: 'Max',
    ownerId: 'owner2',
    ownerName: 'Michael Chen',
    vetId: 'vet2',
    vetName: 'Dr. Ethan Walker',
    clinic: 'Emergency Pet Care Center',
    date: '2024-04-19',
    time: '10:30 AM',
    purpose: 'Physical Therapy',
    status: 'confirmed',
    notes: 'Post-surgery physical therapy session',
    createdAt: '2024-03-28T11:00:00Z'
  },
  {
    id: 'apt9',
    petId: 'pet4',
    petName: 'Luna',
    ownerId: 'owner3',
    ownerName: 'Emily Rodriguez',
    vetId: 'vet3',
    vetName: 'Dr. Ava Mitchell',
    clinic: 'Skin & Coat Veterinary Clinic',
    date: '2024-04-24',
    time: '3:30 PM',
    purpose: 'Dermatology Consultation',
    status: 'pending',
    notes: 'Skin condition follow-up',
    createdAt: '2024-04-01T09:00:00Z'
  },
  {
    id: 'apt10',
    petId: 'pet5',
    petName: 'Charlie',
    ownerId: 'owner4',
    ownerName: 'David Thompson',
    vetId: 'vet1',
    vetName: 'Dr. Olivia Bennett',
    clinic: 'Downtown Animal Hospital',
    date: '2024-04-21',
    time: '11:00 AM',
    purpose: 'Wellness Exam',
    status: 'confirmed',
    notes: 'Routine wellness examination for puppy',
    createdAt: '2024-04-02T14:00:00Z'
  },
  {
    id: 'apt11',
    petId: 'pet1',
    petName: 'Buddy',
    ownerId: 'owner1',
    ownerName: 'Sarah Johnson',
    vetId: 'vet2',
    vetName: 'Dr. Ethan Walker',
    clinic: 'Emergency Pet Care Center',
    date: '2024-04-26',
    time: '9:30 AM',
    purpose: 'Blood Work',
    status: 'pending',
    notes: 'Routine blood panel and health screening',
    createdAt: '2024-04-03T10:00:00Z'
  },
  {
    id: 'apt12',
    petId: 'pet2',
    petName: 'Whiskers',
    ownerId: 'owner1',
    ownerName: 'Sarah Johnson',
    vetId: 'vet3',
    vetName: 'Dr. Ava Mitchell',
    clinic: 'Skin & Coat Veterinary Clinic',
    date: '2024-04-23',
    time: '1:00 PM',
    purpose: 'Allergy Testing',
    status: 'confirmed',
    notes: 'Comprehensive allergy panel',
    createdAt: '2024-04-04T11:00:00Z'
  },
  {
    id: 'apt13',
    petId: 'pet3',
    petName: 'Max',
    ownerId: 'owner2',
    ownerName: 'Michael Chen',
    vetId: 'vet1',
    vetName: 'Dr. Olivia Bennett',
    clinic: 'Downtown Animal Hospital',
    date: '2024-04-27',
    time: '2:30 PM',
    purpose: 'Medication Review',
    status: 'pending',
    notes: 'Review current medications and adjust dosage',
    createdAt: '2024-04-05T12:00:00Z'
  },
  {
    id: 'apt14',
    petId: 'pet4',
    petName: 'Luna',
    ownerId: 'owner3',
    ownerName: 'Emily Rodriguez',
    vetId: 'vet2',
    vetName: 'Dr. Ethan Walker',
    clinic: 'Emergency Pet Care Center',
    date: '2024-04-28',
    time: '10:00 AM',
    purpose: 'X-Ray Review',
    status: 'confirmed',
    notes: 'Review recent X-rays and discuss treatment plan',
    createdAt: '2024-04-06T13:00:00Z'
  },
  {
    id: 'apt15',
    petId: 'pet5',
    petName: 'Charlie',
    ownerId: 'owner4',
    ownerName: 'David Thompson',
    vetId: 'vet3',
    vetName: 'Dr. Ava Mitchell',
    clinic: 'Skin & Coat Veterinary Clinic',
    date: '2024-04-29',
    time: '4:00 PM',
    purpose: 'Behavioral Consultation',
    status: 'pending',
    notes: 'Discuss puppy behavior and training recommendations',
    createdAt: '2024-04-07T14:00:00Z'
  }
];

export const dummySystemActivity = [
  {
    id: 'activity1',
    type: 'approval',
    message: 'Vet account for Dr. Olivia Bennett approved',
    user: 'Ragini Shirwalkar',
    timestamp: '2 hours ago',
    icon: '🛡️'
  },
  {
    id: 'activity2',
    type: 'registration',
    message: 'New user \'sarah.johnson@email.com\' registered',
    user: 'System',
    timestamp: '5 hours ago',
    icon: '👤'
  },
  {
    id: 'activity3',
    type: 'appointment',
    message: 'Appointment scheduled for Buddy with Dr. Olivia Bennett',
    user: 'Sarah Johnson',
    timestamp: '1 day ago',
    icon: '📅'
  },
  {
    id: 'activity4',
    type: 'vet_registration',
    message: 'New vet \'Dr. Noah Thompson\' registered - pending approval',
    user: 'System',
    timestamp: '2 days ago',
    icon: '👨‍⚕️'
  },
  {
    id: 'activity5',
    type: 'system',
    message: 'System backup completed successfully',
    user: 'System',
    timestamp: '3 days ago',
    icon: '💾'
  },
  {
    id: 'activity6',
    type: 'appointment',
    message: 'Appointment cancelled for Max with Dr. Ethan Walker',
    user: 'Michael Chen',
    timestamp: '4 hours ago',
    icon: '📅'
  },
  {
    id: 'activity7',
    type: 'registration',
    message: 'New pet owner \'emily.rodriguez@email.com\' registered',
    user: 'System',
    timestamp: '6 hours ago',
    icon: '👤'
  },
  {
    id: 'activity8',
    type: 'approval',
    message: 'Vet account for Dr. Ava Mitchell approved',
    user: 'Ragini Shirwalkar',
    timestamp: '1 day ago',
    icon: '🛡️'
  },
  {
    id: 'activity9',
    type: 'appointment',
    message: 'Appointment completed for Whiskers with Dr. Ava Mitchell',
    user: 'Sarah Johnson',
    timestamp: '1 day ago',
    icon: '✅'
  },
  {
    id: 'activity10',
    type: 'system',
    message: 'Database optimization completed',
    user: 'System',
    timestamp: '2 days ago',
    icon: '⚙️'
  },
  {
    id: 'activity11',
    type: 'registration',
    message: 'New pet \'Luna\' added by Emily Rodriguez',
    user: 'Emily Rodriguez',
    timestamp: '2 days ago',
    icon: '🐾'
  },
  {
    id: 'activity12',
    type: 'appointment',
    message: 'Appointment rescheduled for Charlie with Dr. Olivia Bennett',
    user: 'David Thompson',
    timestamp: '3 days ago',
    icon: '📅'
  },
  {
    id: 'activity13',
    type: 'system',
    message: 'Security audit completed - no issues found',
    user: 'System',
    timestamp: '4 days ago',
    icon: '🔒'
  },
  {
    id: 'activity14',
    type: 'vet_registration',
    message: 'New vet \'Dr. James Wilson\' registered - pending approval',
    user: 'System',
    timestamp: '5 days ago',
    icon: '👨‍⚕️'
  },
  {
    id: 'activity15',
    type: 'appointment',
    message: 'Emergency appointment created for Buddy',
    user: 'Sarah Johnson',
    timestamp: '6 days ago',
    icon: '🚨'
  },
  {
    id: 'activity16',
    type: 'system',
    message: 'Performance metrics report generated',
    user: 'System',
    timestamp: '1 week ago',
    icon: '📊'
  },
  {
    id: 'activity17',
    type: 'registration',
    message: 'New admin account created',
    user: 'System',
    timestamp: '1 week ago',
    icon: '👤'
  },
  {
    id: 'activity18',
    type: 'approval',
    message: 'Vet account for Dr. Ethan Walker approved',
    user: 'Ragini Shirwalkar',
    timestamp: '1 week ago',
    icon: '🛡️'
  },
  {
    id: 'activity19',
    type: 'system',
    message: 'System update v2.1.0 deployed successfully',
    user: 'System',
    timestamp: '2 weeks ago',
    icon: '🚀'
  },
  {
    id: 'activity20',
    type: 'appointment',
    message: 'Bulk appointment import completed - 25 appointments added',
    user: 'System',
    timestamp: '2 weeks ago',
    icon: '📥'
  }
];

export const dummyWeatherData = {
  location: 'Toronto, ON',
  temperature: '18°C',
  condition: 'Partly Cloudy',
  humidity: '65%',
  windSpeed: '12 km/h',
  icon: '⛅',
  recommendations: [
    'Perfect weather for outdoor walks',
    'Consider morning exercise for your pets',
    'Stay hydrated during outdoor activities'
  ]
};

export const dummyNotifications = [
  {
    id: 'notif1',
    type: 'appointment',
    title: 'Upcoming Appointment',
    message: 'Buddy has an appointment tomorrow at 10:00 AM',
    timestamp: '2 hours ago',
    read: false,
    icon: '📅'
  },
  {
    id: 'notif2',
    type: 'reminder',
    title: 'Vaccination Due',
    message: 'Whiskers is due for annual vaccination',
    timestamp: '1 day ago',
    read: false,
    icon: '💉'
  },
  {
    id: 'notif3',
    type: 'system',
    title: 'Welcome to Pawsera',
    message: 'Your account has been successfully created',
    timestamp: '3 days ago',
    read: true,
    icon: '🎉'
  }
];

export const dummyPetMilestones = [
  {
    id: 'milestone1',
    petId: 'pet1',
    petName: 'Buddy',
    type: 'birthday',
    title: 'Buddy\'s 3rd Birthday',
    date: '2024-04-10',
    description: 'Celebrate Buddy\'s special day!',
    icon: '🎂'
  },
  {
    id: 'milestone2',
    petId: 'pet5',
    petName: 'Charlie',
    type: 'adoption',
    title: 'Adoption Anniversary',
    date: '2024-04-15',
    description: 'One year since Charlie joined the family',
    icon: '🏠'
  },
  {
    id: 'milestone3',
    petId: 'pet2',
    petName: 'Whiskers',
    type: 'health',
    title: 'Health Check Complete',
    date: '2024-04-05',
    description: 'Whiskers completed her annual health check',
    icon: '✅'
  }
];

// Helper functions to get dummy data
export const getDummyUsers = () => dummyUsers;
export const getDummyPets = () => dummyPets;
export const getDummyAppointments = () => dummyAppointments;
export const getDummySystemActivity = () => dummySystemActivity;
export const getDummyWeatherData = () => dummyWeatherData;
export const getDummyNotifications = () => dummyNotifications;
export const getDummyPetMilestones = () => dummyPetMilestones;

// Get users by role
export const getDummyUsersByRole = (role) => {
  return dummyUsers.filter(user => user.role === role);
};

// Get pets by owner
export const getDummyPetsByOwner = (ownerId) => {
  return dummyPets.filter(pet => pet.ownerId === ownerId);
};

export const dummyMedicalHistory = [
  {
    id: 'med1',
    petId: 'pet1',
    title: 'Annual Check-up',
    doctor: 'Olivia Bennett',
    date: '2024-02-15',
    type: 'checkup',
    description: 'Complete physical examination. Pet is in excellent health. All vaccinations are up to date. Weight: 65 lbs. Heart rate and temperature normal.',
    createdAt: '2024-02-15T10:00:00Z'
  },
  {
    id: 'med2',
    petId: 'pet1',
    title: 'Rabies Vaccination',
    doctor: 'Olivia Bennett',
    date: '2024-02-15',
    type: 'vaccination',
    description: 'Rabies vaccination administered. Next due: February 2025. No adverse reactions observed.',
    createdAt: '2024-02-15T10:30:00Z'
  },
  {
    id: 'med3',
    petId: 'pet1',
    title: 'Dental Cleaning',
    doctor: 'Ethan Walker',
    date: '2024-01-10',
    type: 'dental',
    description: 'Professional dental cleaning performed. Minor tartar buildup removed. Teeth are in good condition. Recommended annual cleaning.',
    createdAt: '2024-01-10T14:00:00Z'
  },
  {
    id: 'med4',
    petId: 'pet2',
    title: 'Skin Allergy Consultation',
    doctor: 'Ava Mitchell',
    date: '2024-01-20',
    type: 'checkup',
    description: 'Follow-up on skin irritation. Diagnosed with fish allergy. Prescribed hypoallergenic diet. Skin condition improving.',
    createdAt: '2024-01-20T11:00:00Z'
  },
  {
    id: 'med5',
    petId: 'pet2',
    title: 'Annual Vaccination',
    doctor: 'Ava Mitchell',
    date: '2024-01-20',
    type: 'vaccination',
    description: 'Annual vaccinations completed: FVRCP and Rabies. All vaccines up to date.',
    createdAt: '2024-01-20T11:30:00Z'
  },
  {
    id: 'med6',
    petId: 'pet3',
    title: 'Hip Dysplasia Follow-up',
    doctor: 'Ethan Walker',
    date: '2024-03-01',
    type: 'checkup',
    description: 'X-ray review shows stable condition. Prescribed joint supplements. Continue monitoring. Pet is responding well to treatment.',
    createdAt: '2024-03-01T09:00:00Z'
  },
  {
    id: 'med7',
    petId: 'pet4',
    title: 'Annual Wellness Exam',
    doctor: 'Olivia Bennett',
    date: '2024-02-28',
    type: 'checkup',
    description: 'Complete wellness examination. Pet is healthy and active. All systems normal. Weight: 12 lbs.',
    createdAt: '2024-02-28T10:00:00Z'
  },
  {
    id: 'med8',
    petId: 'pet5',
    title: 'Puppy Vaccination Series',
    doctor: 'Ethan Walker',
    date: '2024-03-10',
    type: 'vaccination',
    description: 'Second round of puppy vaccinations completed. DHPP and Bordatella administered. Next vaccination due in 3 weeks.',
    createdAt: '2024-03-10T15:00:00Z'
  }
];

// Get appointments by status
export const getDummyAppointmentsByStatus = (status) => {
  return dummyAppointments.filter(appointment => appointment.status === status);
};

// Get medical history by pet ID
export const getDummyMedicalHistoryByPetId = (petId) => {
  return dummyMedicalHistory
    .filter(record => record.petId === petId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Get pending vet approvals
export const getDummyPendingVets = () => {
  return dummyUsers.filter(user => user.role === 'Vet' && user.status === 'pending');
};

// Get approved vets
export const getDummyApprovedVets = () => {
  return dummyUsers.filter(user => user.role === 'Vet' && user.status === 'approved');
};
