import type { CredentialType, AuditorAccreditationSubject } from '@tml/crypto';
import type { CredentialPlugin, PluginParams } from './base-plugin.js';

export class AuditorPlugin implements CredentialPlugin {
  readonly type: CredentialType = 'AuditorAccreditationCredential';

  buildSubject(params: PluginParams): AuditorAccreditationSubject {
    return {
      id: params.holderDid,
      accreditationBody: 'TML',
      accreditationType: (params.metadata['accreditationType'] as string) ?? 'independent_audit',
      validRegions: (params.metadata['validRegions'] as string[]) ?? [],
    };
  }

  getExpirationDate(): string {
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 2);
    return expiration.toISOString();
  }
}
