import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext.js';
import { OnboardingWelcome } from './screens/onboarding/Welcome.js';
import { OnboardingGoals } from './screens/onboarding/Goals.js';
import { OnboardingTopics } from './screens/onboarding/Topics.js';
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
import { CourseDetail } from './screens/marketplace/CourseDetail.js';
import { CreatorDashboard } from './screens/marketplace/CreatorDashboard.js';
import { ProfileSettings } from './screens/ProfileSettings.js';
import { PipelineDetail } from './screens/PipelineDetail.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { RegisterScreen } from './screens/RegisterScreen.js';
import { HomePage } from './screens/marketing/Home.js';
import { FeaturesPage } from './screens/marketing/Features.js';
import { PricingPage } from './screens/marketing/Pricing.js';
import { DownloadPage } from './screens/marketing/Download.js';
import { BlogPage } from './screens/marketing/Blog.js';
import { BlogPostPage } from './screens/marketing/BlogPost.js';
import { AboutPage } from './screens/marketing/About.js';
import { DocsPage } from './screens/marketing/Docs.js';
import { Collaboration } from './screens/Collaboration.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { PageTransition } from './components/PageTransition.js';
import { MobileNav } from './components/MobileNav.js';

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  const isOnboarding = location.pathname.startsWith('/onboarding');
  const isPublic = ['/', '/login', '/register', '/features', '/pricing', '/download', '/blog', '/about', '/docs'].includes(location.pathname) || location.pathname.startsWith('/blog/');
  const isAuth = ['/login', '/register'].includes(location.pathname);

  // Check authentication
  const token = localStorage.getItem('learnflow-token');
  const completed = state.onboarding.completed || localStorage.getItem('learnflow-onboarding-complete') === 'true';

  // Unauthenticated users → login (unless on public/auth page)
  if (!token && !isPublic && !isOnboarding && !isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but not onboarded → onboarding
  if (token && !completed && !isOnboarding && !isPublic) {
    return <Navigate to="/onboarding/welcome" replace />;
  }
  return <>{children}</>;
}

function AppMobileNav() {
  const location = useLocation();
  const appPaths = ['/dashboard', '/conversation', '/courses', '/mindmap', '/marketplace', '/settings', '/pipeline', '/collaborate'];
  const isAppScreen = appPaths.some((p) => location.pathname.startsWith(p));
  if (!isAppScreen) return null;
  return <MobileNav />;
}

export function App() {
  return (
    <main role="main" aria-label="LearnFlow Application">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">Skip to content</a>
      <div id="main-content" />
      <AppMobileNav />
      <ErrorBoundary>
      <OnboardingGuard>
      <PageTransition>
      <Routes>
        {/* Onboarding — 6 screens per spec 5.2.1 */}
        <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
        <Route path="/onboarding/goals" element={<OnboardingGoals />} />
        <Route path="/onboarding/topics" element={<OnboardingTopics />} />
        <Route path="/onboarding/interests" element={<OnboardingTopics />} />
        <Route path="/onboarding/api-keys" element={<OnboardingApiKeys />} />
        <Route path="/onboarding/api-key" element={<OnboardingApiKeys />} />
        <Route path="/onboarding/subscription" element={<SubscriptionChoice />} />
        <Route path="/onboarding/first-course" element={<FirstCourse />} />
        <Route path="/onboarding/ready" element={<FirstCourse />} />
        <Route path="/onboarding" element={<Navigate to="/onboarding/welcome" replace />} />

        {/* Core screens */}
        <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="/conversation" element={<ErrorBoundary><Conversation /></ErrorBoundary>} />
        <Route path="/courses/:courseId" element={<ErrorBoundary><CourseView /></ErrorBoundary>} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<ErrorBoundary><LessonReader /></ErrorBoundary>} />
        <Route path="/mindmap" element={<ErrorBoundary><MindmapExplorer /></ErrorBoundary>} />
        <Route path="/pipeline/:pipelineId" element={<ErrorBoundary><PipelineDetail /></ErrorBoundary>} />

        {/* Marketplace */}
        <Route path="/marketplace" element={<ErrorBoundary><CourseMarketplace /></ErrorBoundary>} />
        <Route path="/marketplace/courses" element={<ErrorBoundary><CourseMarketplace /></ErrorBoundary>} />
        <Route path="/marketplace/courses/:courseId" element={<ErrorBoundary><CourseDetail /></ErrorBoundary>} />
        <Route path="/marketplace/agents" element={<ErrorBoundary><AgentMarketplace /></ErrorBoundary>} />
        <Route path="/marketplace/creator" element={<ErrorBoundary><CreatorDashboard /></ErrorBoundary>} />

        {/* Collaboration */}
        <Route path="/collaborate" element={<ErrorBoundary><Collaboration /></ErrorBoundary>} />

        {/* Profile & Settings */}
        <Route path="/settings" element={<ErrorBoundary><ProfileSettings /></ErrorBoundary>} />

        {/* Marketing pages */}
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/docs" element={<DocsPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />

        {/* Homepage */}
        <Route path="/" element={<HomePage />} />
      </Routes>
      </PageTransition>
      </OnboardingGuard>
      </ErrorBoundary>
    </main>
  );
}
