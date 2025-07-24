import { TestBed } from '@angular/core/testing';

import { PublicGuardGuard } from './public-guard.guard';

describe('PublicGuardGuard', () => {
  let guard: PublicGuardGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(PublicGuardGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
