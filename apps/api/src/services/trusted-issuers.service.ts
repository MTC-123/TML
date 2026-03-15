import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import { NotFoundError, ConflictError } from '@tml/types';
import type { TrustedIssuerRegistry } from '@tml/types';
import type { TrustedIssuersRepository } from '../repositories/trusted-issuers.repository.js';

export class TrustedIssuersService {
  constructor(private repo: TrustedIssuersRepository) {}

  async register(data: {
    issuerDid: string;
    issuerName: string;
    credentialTypes: string[];
  }): Promise<Result<TrustedIssuerRegistry>> {
    const existing = await this.repo.findByDid(data.issuerDid);
    if (existing) {
      return err(new ConflictError(`Trusted issuer with DID ${data.issuerDid} already exists`));
    }

    const issuer = await this.repo.create(data);
    return ok(issuer);
  }

  async list(): Promise<Result<TrustedIssuerRegistry[]>> {
    const issuers = await this.repo.findAll();
    return ok(issuers);
  }

  async remove(id: string): Promise<Result<void>> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      return err(new NotFoundError('TrustedIssuer', id));
    }

    await this.repo.update(id, {
      active: false,
      revocationReason: 'Removed by administrator',
      revokedAt: new Date(),
    });
    return ok(undefined);
  }

  async isAuthorized(issuerDid: string, credentialType: string): Promise<boolean> {
    const issuer = await this.repo.findByDid(issuerDid);
    if (!issuer) return false;
    if (!issuer.active) return false;
    return issuer.credentialTypes.includes(credentialType);
  }
}
