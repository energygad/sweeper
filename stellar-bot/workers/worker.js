import StellarSdk from 'stellar-sdk';

const secret = process.argv[2];
const recipient = process.argv[3];
const workerId = process.argv[4];

const server = new StellarSdk.Horizon.Server('https://api.mainnet.minepi.com');
const sourceKeypair = StellarSdk.Keypair.fromSecret(secret);

async function sendIfClaimable() {
  try {
    const account = await server.loadAccount(sourceKeypair.publicKey());

    const claimables = await server
      .claimableBalances()
      .claimant(sourceKeypair.publicKey())
      .call();

    for (const cb of claimables.records) {
      if (cb.asset === 'native') {
        const tx = new StellarSdk.TransactionBuilder(account, {
          fee: '100000',
          networkPassphrase: StellarSdk.Networks.PUBLIC
        })
          .addOperation(StellarSdk.Operation.claimClaimableBalance({ balanceId: cb.id }))
          .addOperation(StellarSdk.Operation.payment({
            destination: recipient,
            asset: StellarSdk.Asset.native(),
            amount: cb.amount
          }))
          .setTimeout(30)
          .build();

        tx.sign(sourceKeypair);

        await server.submitTransaction(tx);
        console.log(`✅ Worker ${workerId}: Claimed + Sent ${cb.amount} XLM`);
      }
    }
  } catch (e) {
    console.log(`⚠️ Worker ${workerId}: ${e.message}`);
  }
}

setInterval(sendIfClaimable, 50);
