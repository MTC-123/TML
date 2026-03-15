// ─── Presentation Definition (what the verifier wants) ───────────────────

export interface PresentationDefinition {
  id: string;
  name?: string;
  purpose?: string;
  input_descriptors: InputDescriptor[];
}

export interface InputDescriptor {
  id: string;
  name?: string;
  purpose?: string;
  constraints: InputDescriptorConstraints;
}

export interface InputDescriptorConstraints {
  fields: InputDescriptorField[];
}

export interface InputDescriptorField {
  path: string[]; // JSONPath expressions, e.g. ['$.credentialSubject.licenseNumber']
  filter?: {
    type: string;
    pattern?: string;
    const?: string;
  };
  purpose?: string;
}

// ─── Authorization Request (sent to holder) ──────────────────────────────

export interface AuthorizationRequest {
  response_type: 'vp_token';
  client_id: string; // verifier DID
  response_uri: string;
  response_mode: 'direct_post';
  presentation_definition: PresentationDefinition;
  nonce: string;
  state: string;
}

// ─── Authorization Response (from holder) ────────────────────────────────

export interface AuthorizationResponse {
  vp_token: string; // JSON-encoded VerifiablePresentation
  presentation_submission: PresentationSubmission;
  state: string;
}

// ─── Presentation Submission (maps VP to definition) ─────────────────────

export interface PresentationSubmission {
  id: string;
  definition_id: string;
  descriptor_map: DescriptorMapEntry[];
}

export interface DescriptorMapEntry {
  id: string; // matches input_descriptor.id
  format: 'ldp_vp';
  path: string; // JSONPath to VP, usually '$'
  path_nested?: {
    format: 'ldp_vc';
    path: string; // JSONPath to VC within VP, e.g. '$.verifiableCredential[0]'
  };
}

// ─── Verification Request/Response for API ───────────────────────────────

export interface VerifyRequest {
  mode: 'hash' | 'qr' | 'openid4vp';
  // hash mode
  certificateHash?: string;
  // qr mode
  qrPayload?: string;
  // openid4vp mode
  vpToken?: string;
  presentationSubmission?: PresentationSubmission;
  state?: string;
}

export interface VerifyResponse {
  valid: boolean;
  mode: 'hash' | 'qr' | 'openid4vp';
  certificate?: {
    id: string;
    milestoneDescription: string;
    projectName: string;
    issuedAt: string;
    status: string;
  };
  credentialVerification?: {
    credentialsVerified: number;
    allValid: boolean;
    details: Array<{ type: string; valid: boolean; issuer: string }>;
  };
  errors: string[];
}
