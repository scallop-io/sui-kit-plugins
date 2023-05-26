# Sui Kit Plugins
This repo contains plugins for Sui Kit. 

## Plugin list
- Shinami sponsored transaction plugin

## Pre-requisite

**SuiKit**
`SuiKit` is required to use these plugins.
Please refer to the [Sui Kit documentation](!https://github.com/scallop-io/sui-kit) on how to install.


## Install
```bash
npm install @scallop-io/sui-kit-plugins
```

## Usage

### Shinami sponsored transaction plugin
This plugin will automatically sponsor your transaction with Shinami gas.
In order to use this plugin, you'll need to get a `Gas access key` from Shinami.
[How to get gas access key](!https://docs.shinami.com/reference/gas-station-api)

```typescript
import { SuiKit, SuiTxBlock } from '@scallop-io/sui-kit';
// import plugins, they will dynamically register themselves to SuiKit
import '@scallop-io/sui-kit-plugins';
import * as process from "process";

let suiKit = new SuiKit({secretKey: process.env.SECRET_KEY});
// init Shinami gas sponsor before using it
suiKit.initShinamiGasSponsor(process.env.GAS_ACCESS_KEY);

/**
 * This is an example of using sponsored transaction plugin in nodejs.
 */
async function forNodejs() {
  // Create a transaction
  const tx = new SuiTxBlock();
  tx.transferObjects(['<obj_id>'], '<sender_address>');

  const gasBudget = 10 ** 9;
  // Sponsor the transaction, and send it
  const res = await suikit.signAndSendShinamiSponsoredTxn(tx, gasBudget);
  return res;
}

/**
 * This is an example of using sponsored transaction plugin in browser.
 */
async function forBrowser() {
  // Create a transaction
  const tx = new SuiTxBlock();
  tx.transferObjects(['<obj_id>'], '<sender_address>');

  const gasBudget = 10 ** 9;
  // Sponsor the transaction
  const sender =  '<sender_address>';
  const sponsoredTx = await suikit.requestShinamiSponsorship(tx, gasBudget, sender);
  // Get the user's signature from wallet
  const txBytes = sponsoredTx.txBytes;
  // Implement your own function to get user's signature from wallet
  const userSignature = await getUserSignatureFromWallet(txBytes);
  // Send the signed sponsored transaction
  const res = await suikit.sendShinamiSponsoredTxn(sponsoredTx, userSignature);
  
  return res;
}
```
