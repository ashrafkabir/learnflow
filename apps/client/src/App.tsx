import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { PageTransition } from './components/PageTransition.js';
import { analytics } from './lib/analytics.js';
import { MobileNav } from './components/MobileNav.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { ShortcutsModal } from './components/ShortcutsModal.js';

// Code-split all screen components via React.lazy
const OnboardingWelcome = React.lazy(() =>
  import('./screens/onboarding/Welcome.js').then((m) => ({ default: m.OnboardingWelcome })),
);
const OnboardingGoals = React.lazy(() =>
  import('./screens/onboarding/Goals.js').then((m) => ({ default: m.OnboardingGoals })),
);
const OnboardingTopics = React.lazy(() =>
  import('./screens/onboarding/Topics.js').then((m) => ({ default: m.OnboardingTopics })),
);
const OnboardingApiKeys = React.lazy(() =>
  import('./screens/onboarding/ApiKeys.js').then((m) => ({ default: m.OnboardingApiKeys })),
);
const SubscriptionChoice = React.lazy(() =>
  import('./screens/onboarding/SubscriptionChoice.js').then((m) => ({
    default: m.SubscriptionChoice,
  })),
);
const FirstCourse = React.lazy(() =>
  import('./screens/onboarding/FirstCourse.js').then((m) => ({ default: m.FirstCourse })),
);
const Dashboard = React.lazy(() =>
  import('./screens/Dashboard.js').then((m) => ({ default: m.Dashboard })),
);
const Conversation = React.lazy(() =>
  import('./screens/Conversation.js').then((m) => ({ default: m.Conversation })),
);
const CourseView = React.lazy(() =>
  import('./screens/CourseView.js').then((m) => ({ default: m.CourseView })),
);
const LessonReader = React.lazy(() =>
  import('./screens/LessonReader.js').then((m) => ({ default: m.LessonReader })),
);
const MindmapExplorer = React.lazy(() =>
  import('./screens/MindmapExplorer.js').then((m) => ({ default: m.MindmapExplorer })),
);
const CourseMarketplace = React.lazy(() =>
  import('./screens/marketplace/CourseMarketplace.js').then((m) => ({
    default: m.CourseMarketplace,
  })),
);
const AgentMarketplace = React.lazy(() =>
  import('./screens/marketplace/AgentMarketplace.js').then((m) => ({
    default: m.AgentMarketplace,
  })),
);
const CourseDetail = React.lazy(() =>
  import('./screens/marketplace/CourseDetail.js').then((m) => ({ default: m.CourseDetail })),
);
const CreatorDashboard = React.lazy(() =>
  import('./screens/marketplace/CreatorDashboard.js').then((m) => ({
    default: m.CreatorDashboard,
  })),
);
const ProfileSettings = React.lazy(() =>
  import('./screens/ProfileSettings.js').then((m) => ({ default: m.ProfileSettings })),
);
const PipelineDetail = React.lazy(() =>
  import('./screens/PipelineDetail.js').then((m) => ({ default: m.PipelineDetail })),
);
const PipelineViewScreen = React.lazy(() =>
  import('./screens/PipelineView.js').then((m) => ({ default: m.PipelineViewScreen })),
);
const LoginScreen = React.lazy(() =>
  import('./screens/LoginScreen.js').then((m) => ({ default: m.LoginScreen })),
);
const RegisterScreen = React.lazy(() =>
  import('./screens/RegisterScreen.js').then((m) => ({ default: m.RegisterScreen })),
);
const HomePage = React.lazy(() =>
  import('./screens/marketing/Home.js').then((m) => ({ default: m.HomePage })),
);
const FeaturesPage = React.lazy(() =>
  import('./screens/marketing/Features.js').then((m) => ({ default: m.FeaturesPage })),
);
const PricingPage = React.lazy(() =>
  import('./screens/marketing/Pricing.js').then((m) => ({ default: m.PricingPage })),
);
const DownloadPage = React.lazy(() =>
  import('./screens/marketing/Download.js').then((m) => ({ default: m.DownloadPage })),
);
const BlogPage = React.lazy(() =>
  import('./screens/marketing/Blog.js').then((m) => ({ default: m.BlogPage })),
);
const BlogPostPage = React.lazy(() =>
  import('./screens/marketing/BlogPost.js').then((m) => ({ default: m.BlogPostPage })),
);
const AboutPage = React.lazy(() =>
  import('./screens/marketing/About.js').then((m) => ({ default: m.AboutPage })),
);
const DocsPage = React.lazy(() =>
  import('./screens/marketing/Docs.js').then((m) => ({ default: m.DocsPage })),
);
const Collaboration = React.lazy(() =>
  import('./screens/Collaboration.js').then((m) => ({ default: m.Collaboration })),
);
const NotFound = React.lazy(() =>
  import('./screens/NotFound.js').then((m) => ({ default: m.NotFound })),
);

function LoadingSpinner() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-bg dark:bg-bg-dark"
      role="status"
      aria-label="Loading"
    >
      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <span className="text-3xl animate-pulse">🧠</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">LearnFlow</h1>
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading your learning journey...</p>
    </div>
  );
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  const isOnboarding = location.pathname.startsWith('/onboarding');
  const isPublic =
    [
      '/',
      '/login',
      '/register',
      '/features',
      '/pricing',
      '/download',
      '/blog',
      '/about',
      '/docs',
    ].includes(location.pathname) || location.pathname.startsWith('/blog/');
  const isAuth = ['/login', '/register'].includes(location.pathname);

  const token = localStorage.getItem('learnflow-token');
  const completed =
    state.onboarding.completed || localStorage.getItem('learnflow-onboarding-complete') === 'true';

  if (!token && !isPublic && !isOnboarding && !isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (token && !completed && !isOnboarding && !isPublic) {
    return <Navigate to="/onboarding/welcome" replace />;
  }
  return <>{children}</>;
}

function AppMobileNav() {
  const location = useLocation();
  const appPaths = [
    '/dashboard',
    '/conversation',
    '/courses',
    '/mindmap',
    '/marketplace',
    '/settings',
    '/pipeline',
    '/collaborate',
  ];
  const isAppScreen = appPaths.some((p) => location.pathname.startsWith(p));
  if (!isAppScreen) return null;
  return <MobileNav />;
}

function AnalyticsPageTracker() {
  const location = useLocation();
  useEffect(() => {
    analytics.page(location.pathname);
  }, [location.pathname]);
  return null;
}

export function App() {
  const { showHelp, setShowHelp } = useKeyboardShortcuts();
  return (
    <main role="main" aria-label="LearnFlow Application">
      <ShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>
      <AnalyticsPageTracker />
      <AppMobileNav />
      <div id="main-content" tabIndex={-1}>
        <ErrorBoundary>
          <OnboardingGuard>
            <Suspense fallback={<LoadingSpinner />}>
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
                  <Route
                    path="/onboarding"
                    element={<Navigate to="/onboarding/welcome" replace />}
                  />

                  {/* Core screens */}
                  <Route
                    path="/dashboard"
                    element={
                      <ErrorBoundary>
                        <Dashboard />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/conversation"
                    element={
                      <ErrorBoundary>
                        <Conversation />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/courses/:courseId"
                    element={
                      <ErrorBoundary>
                        <CourseView />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/courses/:courseId/lessons/:lessonId"
                    element={
                      <ErrorBoundary>
                        <LessonReader />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/mindmap"
                    element={
                      <ErrorBoundary>
                        <MindmapExplorer />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/pipelines"
                    element={
                      <ErrorBoundary>
                        <PipelineViewScreen />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/pipeline/:pipelineId"
                    element={
                      <ErrorBoundary>
                        <PipelineDetail />
                      </ErrorBoundary>
                    }
                  />

                  {/* Marketplace */}
                  <Route
                    path="/marketplace"
                    element={
                      <ErrorBoundary>
                        <CourseMarketplace />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/marketplace/courses"
                    element={
                      <ErrorBoundary>
                        <CourseMarketplace />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/marketplace/courses/:courseId"
                    element={
                      <ErrorBoundary>
                        <CourseDetail />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/marketplace/agents"
                    element={
                      <ErrorBoundary>
                        <AgentMarketplace />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/marketplace/creator"
                    element={
                      <ErrorBoundary>
                        <CreatorDashboard />
                      </ErrorBoundary>
                    }
                  />

                  {/* Collaboration */}
                  <Route
                    path="/collaborate"
                    element={
                      <ErrorBoundary>
                        <Collaboration />
                      </ErrorBoundary>
                    }
                  />

                  {/* Profile & Settings */}
                  <Route
                    path="/settings"
                    element={
                      <ErrorBoundary>
                        <ProfileSettings />
                      </ErrorBoundary>
                    }
                  />

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

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </Suspense>
          </OnboardingGuard>
        </ErrorBoundary>
      </div>
    </main>
  );
}
