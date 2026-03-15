import type { CredentialType, CredentialSubject } from '@tml/crypto';

export interface PluginParams {
  holderDid: string;
  actorId: string;
  metadata: Record<string, unknown>;
}

export interface CredentialPlugin {
  type: CredentialType;
  buildSubject(params: PluginParams): CredentialSubject;
  getExpirationDate(): string | undefined;
}
