import type { CredentialType, ProfessionalEngineerSubject } from '@tml/crypto';
import type { CredentialPlugin, PluginParams } from './base-plugin.js';

export class InspectorPlugin implements CredentialPlugin {
  readonly type: CredentialType = 'ProfessionalEngineerCredential';

  buildSubject(params: PluginParams): ProfessionalEngineerSubject {
    return {
      id: params.holderDid,
      licenseNumber: (params.metadata['licenseNumber'] as string) ?? 'PENDING',
      specialization: (params.metadata['specialization'] as string) ?? 'general',
      issuingAuthority: 'TML System',
    };
  }

  getExpirationDate(): string {
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1);
    return expiration.toISOString();
  }
}
