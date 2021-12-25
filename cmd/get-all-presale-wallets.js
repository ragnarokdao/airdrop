const Web3 = require("web3");
const ObjectsToCsv = require("objects-to-csv");

(async () => {
  const provider = new Web3(
    new Web3.providers.HttpProvider("https://api.avax.network/ext/bc/C/rpc")
  );

  //public presale
  const getPresaleAddresses = (presaleAddr) => {
    return new Promise((resolve, reject) => {
      const errors = [];

      provider.eth
        .getPastLogs({
          fromBlock: 8113555,
          toBlock: 8236486,
          address: presaleAddr,
        })
        .then((events) => {
          const addresses = events.map((event) => {
            try {
              const address = provider.utils.toChecksumAddress(
                event.topics[1].replace("0x000000000000000000000000", "0x")
              );
              return address;
            } catch (e) {
              console.error("invalid ethereum address", e.message);
              errors.push(event.topics[1]);
              return null;
            }
          });

          resolve({ addresses: [...new Set(addresses)], errors });
        });
    });
  };

  const [privatePresale, publicPresale] = await Promise.all([
    getPresaleAddresses("0x1b2e6E462ddE881376D366C66cC0C072f0183740"), //private presale
    getPresaleAddresses("0x3D7b923763455557f3939eB506F0D4Dcf14d3d9b"), //public presale
  ]);

  const addresses = [
    ...new Set([...privatePresale.addresses, ...publicPresale.addresses]),
  ];

  console.log(`${privatePresale.addresses.length}  wallets in private presale`);
  console.log(`${publicPresale.addresses.length}  wallets in public presale`);
  console.log(`${addresses.length} unique wallets in presales`);

  const csv = new ObjectsToCsv(
    addresses.map((n) => {
      return {
        wallet: n,
      };
    })
  );

  await csv.toDisk("./sheets/presales-wallets.csv");
})();
