import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Home from './pages/Home';
import TrainerManagement from './pages/TrainerManagement';
import RequestManagement from './pages/RequestManagement';
import ClientManagement from './pages/ClientManagement';
import TrainingPlanEditor from './pages/TrainingPlanEditor';
import ClientWorkouts from './pages/ClientWorkouts';
import ClientStatsDashboard from './pages/ClientStatsDashboard';
import AddClient from './pages/AddClient';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import ExerciseManagement from './pages/ExerciseManagement';
import PendingApproval from './pages/PendingApproval';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Route for unvalidated trainers */}
        <Route path="/pending-approval" element={
          <ProtectedRoute>
            <PendingApproval />
          </ProtectedRoute>
        } />


        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/trainers" element={<TrainerManagement />} />
              <Route path="/requests" element={<RequestManagement />} />
            </Route>

            {/* Trainer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['trainer']} />}>
              <Route path="/trainer" element={<Navigate to="/trainer/clients" />} />
              <Route path="/trainer/clients" element={<ClientManagement />} />
              <Route path="/trainer/clients/add" element={<AddClient />} />
              <Route path="/trainer/plans/:clientId" element={<TrainingPlanEditor />} />
              <Route path="/trainer/dashboard/:clientId" element={<ClientStatsDashboard />} />
              <Route path="/trainer/exercises" element={<ExerciseManagement />} />
            </Route>

            {/* Client Routes */}
            <Route element={<ProtectedRoute allowedRoles={['client']} />}>
              <Route path="/client" element={<ClientWorkouts />} />
              <Route path="/client/statistics" element={<ClientStatsDashboard />} />
            </Route>

            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
