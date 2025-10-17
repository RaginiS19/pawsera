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

// Get appointments by status
export const getDummyAppointmentsByStatus = (status) => {
  return dummyAppointments.filter(appointment => appointment.status === status);
};

// Get pending vet approvals
export const getDummyPendingVets = () => {
  return dummyUsers.filter(user => user.role === 'Vet' && user.status === 'pending');
};

// Get approved vets
export const getDummyApprovedVets = () => {
  return dummyUsers.filter(user => user.role === 'Vet' && user.status === 'approved');
};
