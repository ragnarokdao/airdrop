const Web3 = require("web3");
const presaleAbi = require("./abi/presale.json");
const stableBondAbi = require("./abi/stable-bond.json");
const tokenAbi = require("./abi/token.json");
const stackingAbi = require("./abi/stacking.json");

const AIRDROP_BLOCK_AT = 8642900;

module.exports.AIRDROP_BLOCK_AT = AIRDROP_BLOCK_AT;

module.exports.getContract = ({ provider, address, type }) => {
  let abi = "";

  switch (type) {
    case "presale":
      abi = presaleAbi.abi;
      break;
    case "stable-bond":
      abi = stableBondAbi.abi;
      break;
    case "lp-bond":
      abi = stableBondAbi.abi;
      break;
    case "token":
      abi = tokenAbi.abi;
      break;
    case "stacking":
      abi = stackingAbi.abi;
      break;
    default:
      throw new Error();
  }

  const contract = new provider.eth.Contract(abi, address);
  contract.defaultBlock = AIRDROP_BLOCK_AT;

  return contract;
};
