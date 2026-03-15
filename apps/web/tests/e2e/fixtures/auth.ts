import { type Page } from '@playwright/test';

type Role = 'admin' | 'contractor_engineer' | 'independent_auditor' | 'citizen';

const USERS: Record<Role, { id: string; did: string; roles: Role[] }> = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    did: 'did:key:z6MkAdmin1234567890',
    roles: ['admin'],
  },
  contractor_engineer: {
    id: '00000000-0000-0000-0000-000000000002',
    did: 'did:key:z6MkContractor1234567890',
    roles: ['contractor_engineer'],
  },
  independent_auditor: {
    id: '00000000-0000-0000-0000-000000000003',
    did: 'did:key:z6MkAuditor1234567890',
    roles: ['independent_auditor'],
  },
  citizen: {
    id: '00000000-0000-0000-0000-000000000004',
    did: 'did:key:z6MkCitizen1234567890',
    roles: ['citizen'],
  },
};

/**
 * Inject auth state into localStorage so AuthGuard treats the session as authenticated.
 * Must be called BEFORE navigating to a protected page.
 */
export async function loginAs(page: Page, role: Role): Promise<void> {
  const user = USERS[role];

  const state = {
    state: {
      user,
      accessToken: `fake-access-token-${role}`,
      refreshToken: `fake-refresh-token-${role}`,
      isLoading: false,
    },
    version: 0,
  };

  // Set localStorage before navigation so Zustand picks it up on hydration
  await page.addInitScript((serialized) => {
    window.localStorage.setItem('tml-auth', serialized);
  }, JSON.stringify(state));
}

/**
 * Clear auth state from localStorage.
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem('tml-auth');
  });
}
