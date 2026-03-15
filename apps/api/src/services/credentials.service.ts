import type { Result } from '../lib/result.js';
import { ok, err } from '../lib/result.js';
import { NotFoundError, ValidationError } from '@tml/types';
import type { IssuedCredential } from '@tml/types';
import type { CredentialType, CredentialVerificationResult, VerifiableCredential } from '@tml/crypto';
import { issueCredential, verifyCredential, sha256Hex, keyPairFromPrivateKey, createDID } from '@tml/crypto';
import type { IssuedCredentialsRepository } from '../repositories/issued-credentials.repository.js';
import type { TrustedIssuersRepository } from '../repositories/trusted-issuers.repository.js';
import type { Env } from '../config/env.js';
import type { CredentialPlugin, PluginParams } from './credential-plugins/base-plugin.js';
import { InspectorPlugin } from './credential-plugins/inspector-plugin.js';
import { AuditorPlugin } from './credential-plugins/auditor-plugin.js';
import { CitizenPlugin } from './credential-plugins/citizen-plugin.js';

export class CredentialsService {
  private plugins: Map<string, CredentialPlugin> = new Map();

  constructor(
    private credentialsRepo: IssuedCredentialsRepository,
    private trustedIssuersRepo: TrustedIssuersRepository,
    private env: Env,
  ) {
    this.registerPlugin(new InspectorPlugin());
    this.registerPlugin(new AuditorPlugin());
    this.registerPlugin(new CitizenPlugin());
  }

  registerPlugin(plugin: CredentialPlugin): void {
    this.plugins.set(plugin.type, plugin);
  }

  async issue(params: {
    type: CredentialType;
    holderDid: string;
    actorId: string;
    metadata: Record<string, unknown>;
  }): Promise<Result<IssuedCredential>> {
    const plugin = this.plugins.get(params.type);
    if (!plugin) {
      return err(new ValidationError(`No plugin registered for credential type: ${params.type}`));
    }

    // Derive system key pair and DID from the configured signing key
    const privateKeyBytes = Buffer.from(this.env.SYSTEM_SIGNING_KEY_HEX, 'hex');
    const keyPair = keyPairFromPrivateKey(privateKeyBytes);
    const systemDid = createDID(keyPair.publicKey);

    // Check trusted issuer authorization
    const issuer = await this.trustedIssuersRepo.findByDid(systemDid);
    if (!issuer || !issuer.active || !issuer.credentialTypes.includes(params.type)) {
      return err(new ValidationError(
        `System DID ${systemDid} is not authorized to issue ${params.type}`,
      ));
    }

    // Build credential subject via plugin
    const pluginParams: PluginParams = {
      holderDid: params.holderDid,
      actorId: params.actorId,
      metadata: params.metadata,
    };
    const subject = plugin.buildSubject(pluginParams);
    const expirationDate = plugin.getExpirationDate();

    // Issue the verifiable credential
    const credential = issueCredential({
      type: params.type,
      issuerDid: systemDid,
      issuerPrivateKey: keyPair.privateKey,
      subject,
      expirationDate,
    });

    // Hash the credential JSON for integrity tracking
    const credentialHash = sha256Hex(JSON.stringify(credential));

    // Persist the issued credential
    const stored = await this.credentialsRepo.create({
      holderDid: params.holderDid,
      holderActorId: params.actorId,
      credentialType: params.type,
      credentialJson: credential as unknown as Record<string, unknown>,
      credentialHash,
      expiresAt: expirationDate ? new Date(expirationDate) : undefined,
    });

    return ok(stored);
  }

  async revoke(credentialId: string, reason: string): Promise<Result<void>> {
    const credential = await this.credentialsRepo.findById(credentialId);
    if (!credential) {
      return err(new NotFoundError('IssuedCredential', credentialId));
    }

    if (credential.status === 'revoked') {
      return err(new ValidationError('Credential is already revoked'));
    }

    await this.credentialsRepo.revoke(credentialId, reason);
    return ok(undefined);
  }

  async getById(credentialId: string): Promise<Result<IssuedCredential>> {
    const credential = await this.credentialsRepo.findById(credentialId);
    if (!credential) {
      return err(new NotFoundError('IssuedCredential', credentialId));
    }
    return ok(credential);
  }

  async getByHolder(holderDid: string): Promise<Result<IssuedCredential[]>> {
    const credentials = await this.credentialsRepo.findByHolder(holderDid);
    return ok(credentials);
  }

  async verify(credentialId: string): Promise<Result<CredentialVerificationResult>> {
    const credential = await this.credentialsRepo.findById(credentialId);
    if (!credential) {
      return err(new NotFoundError('IssuedCredential', credentialId));
    }

    if (credential.status === 'revoked') {
      return ok({ valid: false, errors: ['Credential has been revoked'] });
    }

    const vc = credential.credentialJson as unknown as VerifiableCredential;
    const result = verifyCredential(vc);
    return ok(result);
  }
}
