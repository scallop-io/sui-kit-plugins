import { TransactionBlock, SuiTransactionBlockResponse, toB64 } from "@mysten/sui.js"
import { SuiKit, SuiTxBlock, DerivePathParams } from "@scallop-io/sui-kit"
import { rpcClient } from "typed-rpc"
import type { ShinamiGasSponsor, SponsorRpc, SponsoredTransaction, SponsoredTransactionStatus } from "./shinami"

declare module "@scallop-io/sui-kit" {
  interface SuiKit {
    shinamiGasSponsor: ShinamiGasSponsor;
    initShinamiGasSponsor(gasAccessKey: string): void;

    requestShinamiSponsorship(
      tx: Uint8Array | TransactionBlock | SuiTxBlock,
      gasBudget: number,
      sender: string,
    ): Promise<SponsoredTransaction>;

    sendShinamiSponsoredTxn(
      tx: SponsoredTransaction,
      userSig: string,
    ): Promise<SuiTransactionBlockResponse>;

    signAndSendShinamiSponsoredTxn(
      tx: Uint8Array | TransactionBlock | SuiTxBlock,
      gasBudget: number,
      derivePathParams?: DerivePathParams
    ): Promise<SuiTransactionBlockResponse>;

    // Query the status of a sponsored transaction
    // Result is one of: "IN_FLIGHT" | "COMPLETE" | "INVALID"
    queryShinamiSponsoredTxnStatus(
      txDigest: string,
    ): Promise<SponsoredTransactionStatus>;
  }
}

SuiKit.prototype.initShinamiGasSponsor = function (gasAccessKey: string): void {
  const SHINAMI_SPONSOR_RPC_URL = `https://api.shinami.com/gas/v1/${gasAccessKey}`;
  this.shinamiGasSponsor = rpcClient<SponsorRpc>(SHINAMI_SPONSOR_RPC_URL);
}

SuiKit.prototype.requestShinamiSponsorship = async function (
  tx: Uint8Array | TransactionBlock | SuiTxBlock,
  gasBudget: number,
  sender: string,
): Promise<SponsoredTransaction> {
  if (!this.shinamiGasSponsor) {
    throw new Error("Please call suiKit.initShinamiGasSponsor(gasAccessKey) first.");
  }

  // Get the bytes of the transaction, and convert to base64
  tx = tx instanceof SuiTxBlock ? tx.txBlock : tx;
  const txnBytes = tx instanceof TransactionBlock
    ? await tx.build({onlyTransactionKind: true, provider: this.provider()})
    : tx;
  const txnBase64 = toB64(txnBytes);

  // Sponsor the transaction
  return this.shinamiGasSponsor.gas_sponsorTransactionBlock(txnBase64, sender, gasBudget);
}

SuiKit.prototype.sendShinamiSponsoredTxn = async function (
  sponsoredTxn: SponsoredTransaction,
  userSig: string,
): Promise<SuiTransactionBlockResponse> {
  // Send the full transaction payload, along with the gas owner's signature for execution on the Sui blockchain
  const executeResponse = await this.provider().executeTransactionBlock(
    {
      transactionBlock: sponsoredTxn.txBytes,
      signature: [userSig, sponsoredTxn.signature],
      options: {showEffects: true, showEvents: true, showObjectChanges: true},
      requestType: 'WaitForLocalExecution'
    }
  );
  return executeResponse;
}

SuiKit.prototype.signAndSendShinamiSponsoredTxn = async function (
  tx: Uint8Array | TransactionBlock | SuiTxBlock,
  gasBudget: number,
  derivePathParams?: DerivePathParams
): Promise<SuiTransactionBlockResponse> {
  const sender = this.getAddress(derivePathParams);
  const sponsorTxn = await this.requestShinamiSponsorship(tx, gasBudget, sender);

  // Sign the transaction with the sender's private key
  const senderSig = await this.signTxn(TransactionBlock.from(sponsorTxn.txBytes));

  // Send the full transaction payload, along with the gas owner and sender's signatures for execution on the Sui blockchain
  return this.sendShinamiSponsoredTxn(sponsorTxn, senderSig.signature);
}

SuiKit.prototype.queryShinamiSponsoredTxnStatus = async function (txDigest: string): Promise<SponsoredTransactionStatus> {
  if (!this.shinamiGasSponsor) {
    throw new Error("Please call suiKit.initShinamiGasSponsor(gasAccessKey) first.");
  }
  return this.shinamiGasSponsor.gas_getSponsoredTransactionBlockStatus(txDigest);
}

