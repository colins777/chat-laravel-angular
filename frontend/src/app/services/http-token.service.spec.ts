import { TestBed } from '@angular/core/testing';

import { HttpTokenService } from './http-token.service';

describe('HttpTokenService', () => {
  let service: HttpTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
