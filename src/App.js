import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OwnerLogin from './components/owner/Login';
import OwnerSignup from './components/owner/Signup';
import OwnerHome from './components/owner/Home';
import MyPets from './components/owner/MyPets';
import PetRecords from './components/owner/PetRecords';
import Schedule from './components/owner/Schedule';
import NearbyVets from './components/owner/NearbyVets';
import Settings from './components/owner/Settings';

// Vet
import VetDashboard from './components/vet/VetDashboard';
import VetScheduling from './components/vet/VetScheduling';
import VetSettings from './components/vet/VetSettings';

// Admin
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAppointments from './components/admin/AdminAppointments';
import AdminUsers from './components/admin/AdminUsers';
import AdminSettings from './components/admin/AdminSettings';

export default function App(){
  return (
    <Router>
      <Routes>
        <Route path='/' element={<OwnerLogin />} />
        <Route path='/signup' element={<OwnerSignup />} />
        <Route path='/home' element={<OwnerHome />} />
            <Route path='/mypets' element={<MyPets />} />
            <Route path='/pet-records/:petId' element={<PetRecords />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/nearbyvets' element={<NearbyVets />} />
            <Route path='/settings' element={<Settings />} />

        <Route path='/vet/dashboard' element={<VetDashboard />} />
        <Route path='/vet/scheduling' element={<VetScheduling />} />
        <Route path='/vet/settings' element={<VetSettings />} />

            <Route path='/admin/dashboard' element={<AdminDashboard />} />
            <Route path='/admin/appointments' element={<AdminAppointments />} />
            <Route path='/admin/users' element={<AdminUsers />} />
            <Route path='/admin/settings' element={<AdminSettings />} />
      </Routes>
    </Router>
  );
}

