const Web3 = require("web3");
const { AIRDROP_BLOCK_AT, getContract } = require("../get-contract");
const ObjectsToCsv = require("objects-to-csv");
const csv = require("csv-parser");
const fs = require("fs");

(async () => {
  const provider = new Web3(
    new Web3.providers.HttpProvider("https://api.avax.network/ext/bc/C/rpc")
  );

  const wallets = [];
  const airdropRows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream("wallets.csv")
      .pipe(csv())
      .on("data", (data) => wallets.push(data.wallet))
      .on("end", () => {
        resolve();
      });
  });

  const sRGK = getContract({
    address: "0xeff46B56Fb421bC0B6438DC4AE84d945573C0D6D",
    provider,
    type: "token",
  });

  const RGK = getContract({
    address: "0x46fCCf447f74ec97a521615fcE111118597071f7",
    provider,
    type: "token",
  });

  const Staking = getContract({
    address: "0xeb6B44834E002ECDEAdF9E61448B21cCc33284ca",
    provider,
    type: "stacking",
  });

  const MIMBond = getContract({
    address: "0x4E6Bfc87322974C2Ac04a66A29a212ae5cEcA451",
    provider,
    type: "stable-bond",
  });

  const MIMRGKBond = getContract({
    address: "0xc26f1b62f59CD066b4Fb6c52D387792EA8F35926",
    provider,
    type: "lp-bond",
  });

  const USDCBond = getContract({
    address: "0x72b87ae6566CFD27DeeAAcAa48B79B50eE050D93",
    provider,
    type: "stable-bond",
  });

  const OLDMIMBond = getContract({
    address: "0x8c42Fe3c8DF7E0e2d41e1FAAa75511c22F17aF0f",
    provider,
    type: "stable-bond",
  });

  const OLDMIMRGKBond = getContract({
    address: "0x0f11DEbabD1131970E1E93d07eB4427FAA5D5691",
    provider,
    type: "lp-bond",
  });

  const PrivatePresale = getContract({
    address: "0x1b2e6E462ddE881376D366C66cC0C072f0183740",
    provider,
    type: "presale",
  });

  const PublicPresale = getContract({
    address: "0x3D7b923763455557f3939eB506F0D4Dcf14d3d9b",
    provider,
    type: "presale",
  });

  var fetch = async (addr) => {
    const [
      rawSRGKAmount,
      rawRGKAmount,
      warmupInfo,
      rawMIMBondValue,
      rawMIMRGKBondValue,
      rawUSDCBondValue,
      rawOldMimBondValue,
      rawOldMimRgkBondValue,
      PrivateBuyData,
      PrivateRate,
      PrivateDecimals,
      PublicBuyData,
      PublicRate,
      PublicDecimals,
    ] = await Promise.all([
      sRGK.methods.balanceOf(addr).call(),
      RGK.methods.balanceOf(addr).call(),
      Staking.methods.warmupInfo(addr).call(),
      MIMBond.methods.pendingPayoutFor(addr).call(),
      MIMRGKBond.methods.pendingPayoutFor(addr).call(),
      USDCBond.methods.pendingPayoutFor(addr).call(),
      OLDMIMBond.methods.pendingPayoutFor(addr).call(),
      OLDMIMRGKBond.methods.pendingPayoutFor(addr).call(),
      PrivatePresale.methods.preBuys(addr).call(),
      PrivatePresale.methods.rate().call(),
      PrivatePresale.methods.RATE_DECIMALS().call(),
      PublicPresale.methods.preBuys(addr).call(),
      PublicPresale.methods.rate().call(),
      PublicPresale.methods.RATE_DECIMALS().call(),
    ]);

    var sRGKAmount = rawSRGKAmount / 1e9;
    var RGKAmount = rawRGKAmount / 1e9;
    var warmupValue = warmupInfo.gons;
    warmupValue = (await sRGK.methods.balanceForGons(warmupValue).call()) / 1e9;

    // bond value

    var MIMBONDvalue = rawMIMBondValue / 1e9;
    var MIMRGKBONDvalue = rawMIMRGKBondValue / 1e9;
    var USDCvalue = rawUSDCBondValue / 1e9;
    var OLDMIMBONDvalue = rawOldMimBondValue / 1e9;
    var OLDMIMRGKBONDvalue = rawOldMimRgkBondValue / 1e9;

    // private presale
    var PrivatePresaleValue =
      (PrivateBuyData.mimAmount * PrivateRate) / PrivateDecimals / 10 ** 9;
    PrivatePresaleValue -= PrivateBuyData.rgkClaimedAmount / 10 ** 9;

    // public presale

    var PublicPresaleValue =
      (PublicBuyData.mimAmount * PublicRate) / PublicDecimals / 10 ** 9;
    PublicPresaleValue -= PublicBuyData.rgkClaimedAmount / 10 ** 9;

    var varTotal =
      parseFloat(warmupValue) +
      parseFloat(sRGKAmount) +
      parseFloat(RGKAmount) +
      (parseFloat(MIMBONDvalue) +
        parseFloat(MIMRGKBONDvalue) +
        parseFloat(USDCvalue) +
        parseFloat(OLDMIMBONDvalue) +
        parseFloat(OLDMIMRGKBONDvalue)) +
      parseFloat(PrivatePresaleValue) +
      parseFloat(PublicPresaleValue);

    return {
      sRGKAmount,
      RGKAmount,
      warmupValue,
      MIMBONDvalue,
      MIMRGKBONDvalue,
      USDCvalue,
      OLDMIMBONDvalue,
      OLDMIMRGKBONDvalue,
      PrivatePresaleValue,
      PublicPresaleValue,
      total: varTotal,
    };
  };

  let i = 1;
  for await (let wallet of wallets) {
    console.log(`[${i++}/${wallets.length}] Fetching ${wallet}`);
    const datas = await fetch(wallet);
    airdropRows.push({
      wallet,
      ...datas,
    });

    if (i % 10 == 0) {
      const csv = new ObjectsToCsv(airdropRows);
      await csv.toDisk("airdrop.csv");
    }
  }
})();
