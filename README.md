
# Pawsera - Smart Pet Care Management Platform

A comprehensive pet care management platform designed for pet owners, veterinarians, and administrators. Pawsera helps organize pet care, track health records, and provides weather-based reminders for optimal pet care.

## 🐾 Features

### For Pet Owners
- **Pet Profiles**: Create and manage detailed pet profiles with medical history
- **Vaccination Tracking**: Keep track of vaccination schedules and medical records
- **Appointment Management**: Book and manage veterinary appointments
- **Weather Reminders**: Get weather-based pet care recommendations
- **Nearby Services**: Find veterinary clinics and pet stores using Google Maps

### For Veterinarians
- **Patient Management**: Access and update pet medical records
- **Appointment Scheduling**: Manage veterinary appointments and schedules
- **Medical Records**: Update vaccination history and treatment plans
- **Analytics Dashboard**: View practice insights and patient statistics

### For Administrators
- **User Management**: Manage user accounts and permissions
- **System Monitoring**: Oversee platform operations and user activity
- **Analytics**: View platform-wide statistics and performance metrics

## 🛠 Technology Stack

- **Frontend**: React 18 with modern hooks and context API
- **Backend**: Firebase Firestore (NoSQL cloud database)
- **Authentication**: Firebase Authentication
- **Maps Integration**: Google Maps API
- **Weather API**: OpenWeather API
- **Styling**: Custom CSS with modern design principles
- **Deployment**: GitHub Pages ready

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project setup
- Google Maps API key
- OpenWeather API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Pawsera
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication and Firestore
   - Copy your Firebase config to `src/firebase/config.js`

4. **API Keys Setup**
   - Get Google Maps API key from [Google Cloud Console](https://console.cloud.google.com)
   - Get OpenWeather API key from [OpenWeatherMap](https://openweathermap.org/api)
   - Update the API keys in the respective components

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── pets/           # Pet management components
│   ├── vet/            # Veterinarian dashboard
│   ├── admin/          # Admin dashboard
│   ├── services/       # Google Maps integration
│   ├── weather/        # Weather reminders
│   └── Navbar.js       # Navigation component
├── contexts/
│   └── AuthContext.js  # Authentication context
├── firebase/
│   └── config.js       # Firebase configuration
├── App.js              # Main app component
└── index.js            # App entry point
```

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Update `src/firebase/config.js` with your Firebase config

### Google Maps Setup
1. Enable Google Maps JavaScript API
2. Create API key with appropriate restrictions
3. Update the API key in `src/components/services/NearbyServices.js`

### OpenWeather Setup
1. Sign up for OpenWeather API
2. Get your API key
3. Update the API key in `src/components/weather/WeatherReminders.js`

## 👥 User Roles

### Pet Owner
- Create and manage pet profiles
- Track vaccinations and medical history
- Book veterinary appointments
- Access weather-based reminders
- Find nearby pet services

### Veterinarian
- View and update pet medical records
- Manage appointment schedules
- Add treatment notes and recommendations
- Access patient analytics

### Admin
- Manage user accounts and permissions
- Monitor system activity
- View platform analytics
- Configure system settings

## 🎨 Design Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with intuitive navigation
- **Accessibility**: WCAG compliant design patterns
- **Performance**: Optimized for fast loading and smooth interactions

## 📱 Key Components

### Authentication System
- Secure login/signup with Firebase Auth
- Role-based access control
- Protected routes for different user types

### Pet Management
- CRUD operations for pet profiles
- Medical history tracking
- Photo upload capabilities
- Vaccination scheduling

### Maps Integration
- Google Maps integration for service discovery
- Location-based search
- Interactive markers and info windows

### Weather Integration
- Real-time weather data
- Pet-specific weather recommendations
- Safety alerts for extreme weather

## 🚀 Deployment

### GitHub Pages Deployment
1. Build the project: `npm run build`
2. Deploy to GitHub Pages using GitHub Actions or manual deployment
3. Update Firebase hosting rules if needed

### Firebase Hosting (Alternative)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase: `firebase init`
3. Deploy: `firebase deploy`

## 🔒 Security Features

- Firebase Authentication for secure user management
- Role-based access control
- Protected API routes
- Input validation and sanitization
- Secure data storage in Firestore

## 📊 Database Schema

### Users Collection
```javascript
{
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  role: 'petOwner' | 'veterinarian' | 'admin',
  phone: string,
  address: string,
  createdAt: timestamp
}
```

### Pets Collection
```javascript
{
  id: string,
  ownerId: string,
  name: string,
  species: string,
  breed: string,
  birthDate: timestamp,
  weight: number,
  color: string,
  gender: string,
  medicalNotes: string,
  microchipId: string,
  insuranceProvider: string,
  emergencyContact: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Appointments Collection
```javascript
{
  id: string,
  ownerId: string,
  vetId: string,
  petId: string,
  petName: string,
  ownerName: string,
  vetName: string,
  type: string,
  date: timestamp,
  duration: string,
  notes: string,
  status: string
}
```


## 🔮 Future Enhancements

- Mobile app development
- Push notifications
- Advanced analytics
- AI-powered health recommendations
- Integration with wearable pet devices
- Telemedicine features
- Multi-language support

---

**Pawsera** - Making pet care organized, accessible, and user-friendly! 🐾
