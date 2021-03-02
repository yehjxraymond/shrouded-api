type SnarkBigInt = any;

export interface SnarkProof {
  pi_a: SnarkBigInt[];
  pi_b: SnarkBigInt[][];
  pi_c: SnarkBigInt[];
}
export interface IdentityGroup {
  identityGroup: string;
  name: string;
}

export interface IdentityCommitment {
  identityGroup: string;
  identityCommitment: string;
}

export interface Proof {
  merkleRoot: string;
  snarkProof: SnarkProof;
}

export interface Claim {
  identityGroup: string;
  nullifier: string;
  externalNullifier: string;
  message: string;
  proof: Proof;
  timestamp: number;
}

export interface DbEntry {
  PK: string;
  SK: string;
  data?: any;
}
