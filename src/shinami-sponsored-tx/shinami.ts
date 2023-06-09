import { rpcClient } from "typed-rpc"
export interface SponsoredTransaction {
  txBytes: string;
  txDigest: string;
  signature: string;
  expireAtTime: number;
  expireAfterEpoch: number;
}
export type SponsoredTransactionStatus = "IN_FLIGHT" | "COMPLETE" | "INVALID";

export interface SponsorRpc {
  gas_sponsorTransactionBlock(txBytes: string, sender: string, gasBudget: number): SponsoredTransaction;
  gas_getSponsoredTransactionBlockStatus(txDigest: string): SponsoredTransactionStatus;
}

export type ShinamiGasSponsor = ReturnType<typeof rpcClient<SponsorRpc>>
