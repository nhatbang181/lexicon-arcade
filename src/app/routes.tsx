import React, { Suspense, lazy } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { TodayScreen } from './screens/TodayScreen';
import { ErrorBoundary } from './ErrorBoundary';
import { Skeleton } from '../design/components';

// X5: mọi route trừ Hôm nay tải theo nhu cầu để JS ở `#/` nhỏ.
const HubScreen = lazy(() =>
  import('./screens/HubScreen').then((m) => ({ default: m.HubScreen })),
);
const PlayScreen = lazy(() =>
  import('./screens/PlayScreen').then((m) => ({ default: m.PlayScreen })),
);
const LibraryPlaceholderScreen = lazy(() =>
  import('./screens/PlaceholderScreens').then((m) => ({ default: m.LibraryPlaceholderScreen })),
);
const OnboardingScreen = lazy(() =>
  import('../features/onboarding/OnboardingScreen').then((m) => ({ default: m.OnboardingScreen })),
);
const PlacementScreen = lazy(() =>
  import('../features/placement/PlacementScreen').then((m) => ({ default: m.PlacementScreen })),
);
const StatsScreen = lazy(() =>
  import('../features/stats/StatsScreen').then((m) => ({ default: m.StatsScreen })),
);
const SettingsScreen = lazy(() =>
  import('../features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);
const PortfolioScreen = lazy(() =>
  import('../features/portfolio/PortfolioScreen').then((m) => ({ default: m.PortfolioScreen })),
);
const LegacyScreen = lazy(() =>
  import('./screens/LegacyScreen').then((m) => ({ default: m.LegacyScreen })),
);

// X6: route dev chỉ tồn tại khi chạy `vite` (DEV); bản build không chứa các màn này.
const DevComponentsScreen = import.meta.env.DEV
  ? lazy(() =>
      import('./screens/DevComponentsScreen').then((m) => ({ default: m.DevComponentsScreen })),
    )
  : null;
const SpeechDevScreen = import.meta.env.DEV
  ? lazy(() =>
      import('../features/dev/SpeechDevScreen').then((m) => ({ default: m.SpeechDevScreen })),
    )
  : null;

const RouteFallback: React.FC = () => (
  <div className="max-w-xl mx-auto p-6 space-y-4" role="status" aria-label="Đang tải màn hình">
    <Skeleton className="h-10 w-1/2" />
    <Skeleton lines={4} />
  </div>
);

export const AppRoutes: React.FC = () => {
  const [location] = useLocation();

  return (
    // X10: đổi route thì ErrorBoundary được dựng lại, lỗi ở màn này không kẹt sang màn khác.
    <ErrorBoundary key={location}>
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path="/" component={TodayScreen} />
          <Route path="/hub" component={HubScreen} />
          <Route path="/practice" component={HubScreen} />
          <Route path="/play/:gameId">
            {(params) => <PlayScreen gameId={params.gameId} />}
          </Route>
          <Route path="/exam">{() => <PlayScreen gameId="x1" />}</Route>
          <Route path="/stats" component={StatsScreen} />
          <Route path="/portfolio" component={PortfolioScreen} />
          <Route path="/writing/portfolio" component={PortfolioScreen} />
          <Route path="/library" component={LibraryPlaceholderScreen} />
          <Route path="/placement" component={PlacementScreen} />
          <Route path="/onboarding" component={OnboardingScreen} />
          <Route path="/settings" component={SettingsScreen} />
          {DevComponentsScreen && <Route path="/dev/components" component={DevComponentsScreen} />}
          {SpeechDevScreen && <Route path="/dev/speech" component={SpeechDevScreen} />}
          <Route path="/legacy" component={LegacyScreen} />
          <Route>{() => <TodayScreen />}</Route>
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
};
