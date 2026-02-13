import type { GeoPoint } from "@tml/types";
import { sha256Hex } from "./hashing.js";

export interface ProximityProof {
  proofHash: string;
  timestamp: string;
  verified: boolean;
}

export interface ZKPProximityVerifier {
  generateProof(location: GeoPoint, boundary: GeoPoint[]): Promise<ProximityProof>;
  verifyProof(proof: ProximityProof): Promise<boolean>;
}

export function createStubVerifier(): ZKPProximityVerifier {
  return {
    async generateProof(location: GeoPoint, boundary: GeoPoint[]): Promise<ProximityProof> {
      const input = JSON.stringify({ location, boundary });
      const proofHash = sha256Hex(input);
      return {
        proofHash,
        timestamp: new Date().toISOString(),
        verified: true,
      };
    },
    async verifyProof(proof: ProximityProof): Promise<boolean> {
      return proof.verified;
    },
  };
}
