export type NavView =
  | 'dashboard'
  | 'meetings'
  | 'meeting-detail'
  | 'tracker'
  | 'decisions'
  | 'unresolved'
  | 'analytics'
  | 'new-meeting'
  | 'settings'
  | 'evidence'
  | 'ask-meeting'
  | 'audio-transcript';

export type DetailTab = 'overview' | 'actions' | 'decisions' | 'unresolved' | 'evidence' | 'ask' | 'transcript';
export type IngestionMode = 'paste' | 'file' | 'audio';

export interface RouteLocation {
  path: string;
  view: NavView;
  meetingId?: string;
  tab?: DetailTab;
  mode?: IngestionMode;
  highlight?: string;
  statusFilter?: string;
}

/**
 * Parses any URL path and query parameters into a structured RouteLocation.
 */
export function parseRoute(pathname: string, search: string = ''): RouteLocation {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(search);
  const tabParam = searchParams.get('tab') as DetailTab | null;
  const highlightParam = searchParams.get('highlight') || undefined;
  const meetingIdParam = searchParams.get('meetingId') || undefined;
  const statusParam = searchParams.get('status') || undefined;

  // 1. Dashboard routes
  if (cleanPath === '' || cleanPath === '/' || cleanPath === '/dashboard') {
    return {
      path: '/dashboard',
      view: 'dashboard'
    };
  }

  // 2. Audio -> Transcript dedicated route
  if (cleanPath === '/audio-transcript' || cleanPath === '/audio') {
    return {
      path: '/audio-transcript',
      view: 'new-meeting',
      mode: 'audio'
    };
  }

  // 3. New Meeting route
  if (cleanPath === '/meetings/new' || cleanPath === '/new-meeting') {
    return {
      path: '/meetings/new',
      view: 'new-meeting',
      mode: 'paste'
    };
  }

  // 4. Evidence Explorer dedicated route
  if (cleanPath === '/evidence' || cleanPath === '/evidence-explorer') {
    return {
      path: '/evidence',
      view: 'meeting-detail',
      tab: 'evidence',
      meetingId: meetingIdParam,
      highlight: highlightParam
    };
  }

  // 5. Ask About This Meeting dedicated route
  if (cleanPath === '/ask-meeting' || cleanPath === '/ask' || cleanPath === '/qa') {
    return {
      path: '/ask-meeting',
      view: 'meeting-detail',
      tab: 'ask',
      meetingId: meetingIdParam
    };
  }

  // 6. Meeting Details route with ID (/meetings/:id)
  const meetingDetailMatch = cleanPath.match(/^\/meetings\/([^/]+)$/);
  if (meetingDetailMatch) {
    const id = meetingDetailMatch[1];
    return {
      path: cleanPath,
      view: 'meeting-detail',
      meetingId: id,
      tab: tabParam || 'overview',
      highlight: highlightParam
    };
  }

  // 7. Meeting History repository
  if (cleanPath === '/meetings' || cleanPath === '/history') {
    return {
      path: '/meetings',
      view: 'meetings'
    };
  }

  // 8. Accountability Tracker / Action Items
  if (cleanPath === '/accountability' || cleanPath === '/action-items' || cleanPath === '/tracker' || cleanPath === '/actions') {
    return {
      path: '/accountability',
      view: 'tracker',
      statusFilter: statusParam
    };
  }

  // 9. Meeting Health Analytics
  if (cleanPath === '/analytics' || cleanPath === '/health') {
    return {
      path: '/analytics',
      view: 'analytics'
    };
  }

  // 10. Decisions Register
  if (cleanPath === '/decisions') {
    return {
      path: '/decisions',
      view: 'decisions'
    };
  }

  // 11. Unresolved Issues & Blockers
  if (cleanPath === '/unresolved' || cleanPath === '/blockers') {
    return {
      path: '/unresolved',
      view: 'unresolved'
    };
  }

  // 12. Settings
  if (cleanPath === '/settings' || cleanPath === '/profile') {
    return {
      path: '/settings',
      view: 'settings'
    };
  }

  // 13. Login
  if (cleanPath === '/login' || cleanPath === '/signin') {
    return {
      path: '/login',
      view: 'dashboard' // will be guarded in App.tsx
    };
  }

  // Fallback to dashboard for unknown routes
  return {
    path: '/dashboard',
    view: 'dashboard'
  };
}

/**
 * Returns canonical URL path for any view or module.
 */
export function formatRoutePath(
  view: NavView,
  options?: {
    meetingId?: string;
    tab?: DetailTab;
    mode?: IngestionMode;
    highlight?: string;
  }
): string {
  switch (view) {
    case 'dashboard':
      return '/dashboard';
    case 'meetings':
      return '/meetings';
    case 'meeting-detail':
      if (options?.tab === 'evidence' && !options?.meetingId) {
        return '/evidence';
      }
      if (options?.tab === 'ask' && !options?.meetingId) {
        return '/ask-meeting';
      }
      if (options?.meetingId) {
        let p = `/meetings/${options.meetingId}`;
        const params = new URLSearchParams();
        if (options.tab && options.tab !== 'overview') {
          params.set('tab', options.tab);
        }
        if (options.highlight) {
          params.set('highlight', options.highlight);
        }
        const qs = params.toString();
        return qs ? `${p}?${qs}` : p;
      }
      return '/meetings';
    case 'tracker':
      return '/accountability';
    case 'analytics':
      return '/analytics';
    case 'decisions':
      return '/decisions';
    case 'unresolved':
      return '/unresolved';
    case 'new-meeting':
      return options?.mode === 'audio' ? '/audio-transcript' : '/meetings/new';
    case 'evidence':
      return options?.meetingId ? `/meetings/${options.meetingId}?tab=evidence` : '/evidence';
    case 'ask-meeting':
      return options?.meetingId ? `/meetings/${options.meetingId}?tab=ask` : '/ask-meeting';
    case 'audio-transcript':
      return '/audio-transcript';
    case 'settings':
      return '/settings';
    default:
      return '/dashboard';
  }
}
