import React from 'react';
import { Route, Switch } from 'wouter';
import { TodayScreen } from './screens/TodayScreen';
import { HubScreen } from './screens/HubScreen';
import { PlayScreen } from './screens/PlayScreen';
import { LibraryPlaceholderScreen } from './screens/PlaceholderScreens';
import { OnboardingScreen } from '../features/onboarding';
import { PlacementScreen } from '../features/placement';
import { StatsScreen } from '../features/stats';
import { SettingsScreen } from '../features/settings';
import { PortfolioScreen } from '../features/portfolio';
import { DevComponentsScreen } from './screens/DevComponentsScreen';
import { LegacyScreen } from './screens/LegacyScreen';
import { ErrorBoundary } from './ErrorBoundary';

export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={TodayScreen} />
        <Route path="/hub" component={HubScreen} />
        <Route path="/practice" component={HubScreen} />
        <Route path="/play/:gameId">
          {(params) => <PlayScreen gameId={params.gameId} />}
        </Route>
        <Route path="/exam">
          {() => <PlayScreen gameId="x1" />}
        </Route>
        <Route path="/stats" component={StatsScreen} />
        <Route path="/portfolio" component={PortfolioScreen} />
        <Route path="/writing/portfolio" component={PortfolioScreen} />
        <Route path="/library" component={LibraryPlaceholderScreen} />
        <Route path="/placement" component={PlacementScreen} />
        <Route path="/onboarding" component={OnboardingScreen} />
        <Route path="/settings" component={SettingsScreen} />
        <Route path="/dev/components" component={DevComponentsScreen} />
        <Route path="/legacy" component={LegacyScreen} />
        <Route>
          {() => <TodayScreen />}
        </Route>
      </Switch>
    </ErrorBoundary>
  );
};
