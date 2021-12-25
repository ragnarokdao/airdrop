const Web3 = require("web3");
const { AIRDROP_BLOCK_AT } = require("../get-contract");
const ObjectsToCsv = require("objects-to-csv");

(async () => {
  const provider = new Web3(
    new Web3.providers.HttpProvider("https://api.avax.network/ext/bc/C/rpc")
  );

  const START_BLOCK_AT = 8239283;

  let syncedBlock = START_BLOCK_AT;
  let events = [];
  let wallets = [];

  console.log(`syncing rgk/mim lp...`);

  while (syncedBlock < AIRDROP_BLOCK_AT) {
    let tmpOut = syncedBlock + 3000;
    if (tmpOut > AIRDROP_BLOCK_AT) tmpOut = AIRDROP_BLOCK_AT;
    console.log(`between ${syncedBlock} and ${tmpOut}`);
    events = [
      ...events,
      ...(await provider.eth.getPastLogs({
        fromBlock: syncedBlock,
        toBlock: tmpOut,
        address: "0xe8419ecda1c76c38800b21e7d43bdb6b02f51ace",
      })),
    ];
    syncedBlock = tmpOut;

    wallets = [
      ...wallets,
      ...(await Promise.all(
        events
          .filter(
            (event) =>
              event.topics[0] ===
              "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822"
          )
          .map(async (event) => {
            const address = provider.utils.toChecksumAddress(
              event.topics[2].replace("0x000000000000000000000000", "0x")
            );

            return address;
          })
      )),
    ];
  }

  const addresses = [...new Set(wallets)];

  const csv = new ObjectsToCsv(
    addresses.map((n) => {
      return {
        wallet: n,
      };
    })
  );

  await csv.toDisk("./sheets/rgk-mim-lp-wallets.csv");

  console.log(`${addresses.length} unique wallets in presales`);
})();
