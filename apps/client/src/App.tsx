import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OnboardingWelcome } from './screens/onboarding/Welcome.js';
import { OnboardingGoals } from './screens/onboarding/Goals.js';
import { OnboardingTopics } from './screens/onboarding/Topics.js';
import { OnboardingExperience } from './screens/onboarding/Experience.js';
import { OnboardingApiKeys } from './screens/onboarding/ApiKeys.js';
import { OnboardingReady } from './screens/onboarding/Ready.js';
import { Dashboard } from './screens/Dashboard.js';
import { Conversation } from './screens/Conversation.js';
import { CourseView } from './screens/CourseView.js';
import { LessonReader } from './screens/LessonReader.js';
import { MindmapExplorer } from './screens/MindmapExplorer.js';
import { CourseMarketplace } from './screens/marketplace/CourseMarketplace.js';
import { AgentMarketplace } from './screens/marketplace/AgentMarketplace.js';
import { ProfileSettings } from './screens/ProfileSettings.js';

export function App() {
  return (
    <main role="main" aria-label="LearnFlow Application">
      <Routes>
        {/* Onboarding — 6 screens per spec 5.2.1 */}
        <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
        <Route path="/onboarding/goals" element={<OnboardingGoals />} />
        <Route path="/onboarding/topics" element={<OnboardingTopics />} />
        <Route path="/onboarding/experience" element={<OnboardingExperience />} />
        <Route path="/onboarding/api-keys" element={<OnboardingApiKeys />} />
        <Route path="/onboarding/ready" element={<OnboardingReady />} />

        {/* Core screens */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/conversation" element={<Conversation />} />
        <Route path="/courses/:courseId" element={<CourseView />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonReader />} />
        <Route path="/mindmap" element={<MindmapExplorer />} />

        {/* Marketplace */}
        <Route path="/marketplace/courses" element={<CourseMarketplace />} />
        <Route path="/marketplace/agents" element={<AgentMarketplace />} />

        {/* Profile & Settings */}
        <Route path="/settings" element={<ProfileSettings />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  );
}
