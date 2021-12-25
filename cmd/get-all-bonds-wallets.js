const Web3 = require("web3");
const { AIRDROP_BLOCK_AT } = require("../get-contract");
const ObjectsToCsv = require("objects-to-csv");

(async () => {
  const provider = new Web3(
    new Web3.providers.HttpProvider("https://api.avax.network/ext/bc/C/rpc")
  );

  const START_BLOCK_AT = 8331223;

  const getBondAddresses = async (bondAddr, name) => {
    let syncedBlock = START_BLOCK_AT;
    let events = [];
    let wallets = [];

    console.log(`syncing ${name}...`);

    while (syncedBlock < AIRDROP_BLOCK_AT) {
      let tmpOut = syncedBlock + 3000;
      if (tmpOut > AIRDROP_BLOCK_AT) tmpOut = AIRDROP_BLOCK_AT;
      console.log(`between ${syncedBlock} and ${tmpOut}`);
      events = [
        ...events,
        ...(await provider.eth.getPastLogs({
          fromBlock: syncedBlock,
          toBlock: tmpOut,
          address: bondAddr,
        })),
      ];
      syncedBlock = tmpOut;

      wallets = [
        ...wallets,
        ...(await Promise.all(
          events.map(async (event) => {
            const tx = await provider.eth.getTransaction(event.transactionHash);
            return tx.from;
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

    await csv.toDisk("./sheets/" + name + "-wallets.csv");

    return addresses;
  };

  const oldBondMim = await getBondAddresses(
    "0x8c42Fe3c8DF7E0e2d41e1FAAa75511c22F17aF0f",
    "old-bond-mim"
  );
  const bondMim = await getBondAddresses(
    "0x4E6Bfc87322974C2Ac04a66A29a212ae5cEcA451",
    "bond-mim"
  );

  const oldBondRgkMim = await getBondAddresses(
    "0x0f11DEbabD1131970E1E93d07eB4427FAA5D5691",
    "old-bond-rgk-mim"
  );
  const bondRgkMim = await getBondAddresses(
    "0xc26f1b62f59CD066b4Fb6c52D387792EA8F35926",
    "bond-rgk-mim"
  );

  const usdcBond = await getBondAddresses(
    "0x72b87ae6566CFD27DeeAAcAa48B79B50eE050D93",
    "bond-usdc"
  );

  const addresses = [
    ...new Set([
      ...oldBondMim,
      ...bondMim,
      ...oldBondRgkMim,
      ...bondRgkMim,
      ...usdcBond,
    ]),
  ];

  console.log(`${addresses.length} unique wallets in bonds`);
})();
