import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { OnboardingWelcome } from './screens/onboarding/Welcome.js';
import { OnboardingGoals } from './screens/onboarding/Goals.js';
import { OnboardingTopics } from './screens/onboarding/Topics.js';
import { OnboardingExperience } from './screens/onboarding/Experience.js';
import { OnboardingApiKeys } from './screens/onboarding/ApiKeys.js';
import { SubscriptionChoice } from './screens/onboarding/SubscriptionChoice.js';
import { FirstCourse } from './screens/onboarding/FirstCourse.js';
import { Dashboard } from './screens/Dashboard.js';
import { Conversation } from './screens/Conversation.js';
import { CourseView } from './screens/CourseView.js';
import { LessonReader } from './screens/LessonReader.js';
import { MindmapExplorer } from './screens/MindmapExplorer.js';
import { CourseMarketplace } from './screens/marketplace/CourseMarketplace.js';
import { AgentMarketplace } from './screens/marketplace/AgentMarketplace.js';
import { ProfileSettings } from './screens/ProfileSettings.js';
import { HomePage } from './screens/marketing/Home.js';
import { FeaturesPage } from './screens/marketing/Features.js';
import { PricingPage } from './screens/marketing/Pricing.js';
import { DownloadPage } from './screens/marketing/Download.js';
import { BlogPage } from './screens/marketing/Blog.js';

export function App() {
  return (
    <main role="main" aria-label="LearnFlow Application">
      <Routes>
        {/* Onboarding — 6 screens per spec 5.2.1 */}
        <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
        <Route path="/onboarding/goals" element={<OnboardingGoals />} />
        <Route path="/onboarding/topics" element={<OnboardingTopics />} />
        <Route path="/onboarding/interests" element={<OnboardingTopics />} />
        <Route path="/onboarding/experience" element={<OnboardingExperience />} />
        <Route path="/onboarding/api-keys" element={<OnboardingApiKeys />} />
        <Route path="/onboarding/api-key" element={<OnboardingApiKeys />} />
        <Route path="/onboarding/subscription" element={<SubscriptionChoice />} />
        <Route path="/onboarding/first-course" element={<FirstCourse />} />
        <Route path="/onboarding/ready" element={<FirstCourse />} />

        {/* Core screens */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/conversation" element={<Conversation />} />
        <Route path="/courses/:courseId" element={<CourseView />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonReader />} />
        <Route path="/mindmap" element={<MindmapExplorer />} />

        {/* Marketplace */}
        <Route path="/marketplace" element={<CourseMarketplace />} />
        <Route path="/marketplace/courses" element={<CourseMarketplace />} />
        <Route path="/marketplace/agents" element={<AgentMarketplace />} />

        {/* Profile & Settings */}
        <Route path="/settings" element={<ProfileSettings />} />

        {/* Marketing pages */}
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/blog" element={<BlogPage />} />

        {/* Homepage */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </main>
  );
}
