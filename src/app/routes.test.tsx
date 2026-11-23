import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Router } from 'wouter';
import { appNavigate, useAppHashLocation, useAppHashSearch } from './hashRouter';

vi.mock('./screens/TodayScreen', () => ({
  TodayScreen: () => <div>TODAY_OK</div>,
}));
vi.mock('../features/stats/StatsScreen', () => ({
  StatsScreen: () => {
    throw new Error('stats-boom');
  },
}));

import { AppRoutes } from './routes';

function Harness() {
  return (
    <Router hook={useAppHashLocation} searchHook={useAppHashSearch}>
      <AppRoutes />
    </Router>
  );
}

describe('routes: ErrorBoundary key theo route (X10) và hash router có query (F5)', () => {
  beforeEach(() => {
    window.location.hash = '#/stats';
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lỗi ở Thống kê hiện mã lỗi + Về Hôm nay, bấm sang Hôm nay thì hiện bình thường', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<Harness />);

    await waitFor(() => expect(screen.getByText(/ERR_UI_BOUNDARY: stats-boom/)).toBeTruthy());
    expect(screen.getByText('Thử lại')).toBeTruthy();
    expect(screen.getByTestId('error-go-today').getAttribute('href')).toBe('#/');

    act(() => appNavigate('/'));
    await waitFor(() => expect(screen.getByText('TODAY_OK')).toBeTruthy());
    expect(screen.queryByText(/ERR_UI_BOUNDARY/)).toBeNull();
  });

  it('query nằm trong hash, không rò vào location.search và không làm hỏng khớp route', async () => {
    window.location.hash = '#/';
    render(<Harness />);
    await waitFor(() => expect(screen.getByText('TODAY_OK')).toBeTruthy());

    act(() => appNavigate('/play/v1?from=today&task=2026-11-23%3Av1%3A1'));
    expect(window.location.hash).toBe('#/play/v1?from=today&task=2026-11-23%3Av1%3A1');
    expect(window.location.search).toBe('');

    act(() => appNavigate('/hub'));
    expect(window.location.hash).toBe('#/hub');
    expect(window.location.search).toBe('');
  });
});
