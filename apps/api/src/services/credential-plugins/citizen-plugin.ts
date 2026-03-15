import type { CredentialType, CNIEIdentitySubject } from '@tml/crypto';
import type { CredentialPlugin, PluginParams } from './base-plugin.js';

export class CitizenPlugin implements CredentialPlugin {
  readonly type: CredentialType = 'CNIEIdentityCredential';

  buildSubject(params: PluginParams): CNIEIdentitySubject {
    return {
      id: params.holderDid,
      cnieHash: (params.metadata['cnieHash'] as string) ?? '',
      verificationLevel: (params.metadata['verificationLevel'] as 'in_person' | 'remote') ?? 'remote',
    };
  }

  getExpirationDate(): string {
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 5);
    return expiration.toISOString();
  }
}
