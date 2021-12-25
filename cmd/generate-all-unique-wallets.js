const csv = require("csv-parser");
const Web3 = require("web3");
const fs = require("fs");
const util = require("util");
const ObjectsToCsv = require("objects-to-csv");

const readdir = util.promisify(fs.readdir);

(async () => {
  const provider = new Web3(
    new Web3.providers.HttpProvider("https://api.avax.network/ext/bc/C/rpc")
  );

  let wallets = [];
  let files = null;

  try {
    files = await readdir("./sheets/");
  } catch (e) {
    console.log("e", e);
  }

  for await (let file of files) {
    await new Promise((resolve, reject) => {
      fs.createReadStream("./sheets/" + file)
        .pipe(csv())
        .on("data", (data) => wallets.push(data.wallet))
        .on("end", () => {
          resolve();
        });
    });
  }

  const uncheckedUniqueWallets = [...new Set(wallets)];
  const checkedUniqueWallets = [];
  const contracts = [];

  console.log("Verifing addresses...");
  let i = 1;
  for await (const wallet of uncheckedUniqueWallets) {
    console.log(`Checking ${i++}/${uncheckedUniqueWallets.length} : ${wallet}`);
    const code = await provider.eth.getCode(wallet);

    if (code == "0x") checkedUniqueWallets.push(wallet);
    else {
      console.log(`${wallet} is a contract`);
      contracts.push(wallet);
    }
  }

  const csv2 = new ObjectsToCsv(
    checkedUniqueWallets.map((n) => {
      return {
        wallet: n,
      };
    })
  );

  await csv2.toDisk("./wallets.csv");

  console.log(
    `${checkedUniqueWallets.length} unique wallets and ${contracts.length} contracts interacted with the ecosystem`
  );
})();
