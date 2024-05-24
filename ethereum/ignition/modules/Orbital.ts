import { ethers } from 'ethers';
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-ignition-ethers";
import PriceFeedsModule from "./PriceFeeds";
import BTCModule from "./BTC";
import USDTModule from "./USDT";

const OrbitalModule = buildModule("OrbitalModule", (m) => {
  const account = m.getAccount(0);

  const { priceFeeds } = m.useModule(PriceFeedsModule);

  const wormhole = "0x7bbcE28e64B3F8b84d876Ab298393c38ad7aac4C";

  const AddressToBytes32 = m.library("AddressToBytes32");

  const orbital = m.contract("Orbital", [priceFeeds, wormhole], {
    from: account,
    libraries: {
      AddressToBytes32: AddressToBytes32,
    },
  });

  const { btc } = m.useModule(BTCModule);
  const { usdt } = m.useModule(USDTModule);

  const add1 = m.call(orbital, "addSupportedToken", [btc], { id: "BTC", from: account });

  const add2 = m.call(orbital, "addSupportedToken", [usdt], { id: "USDT", from: account });

  const approve = m.call(btc, "approve", [orbital, ethers.parseEther("1")], {
    from: account
  });

  const SUI_CHAIN_ID = 21;
  const SUI_ORBITAL_ID = "0xba2ec7f4380343fe672a76fe0f334e4dc26e125f617d8e0a32d46c1ef36923bd";

  m.call(orbital, "addForeignOrbital", [SUI_CHAIN_ID, SUI_ORBITAL_ID], {
    from: account,
  });

  // m.call(orbital, "borrow", [
  //   SUI_CHAIN_ID,
  //   "0x00000000000000000000000081297d0e83488A4eFC074041488bB4a9B5713a0E",
  //   "0x000000000000000000000000e61C27B23970D90Bb6A0425498D41cC990B8F517",
  //   ethers.parseEther("0.001"),
  //   SUI_ORBITAL_ID
  // ], {
  //   after: [add1, add2, approve],
  //   from: account,
  // });

  return { orbital };
});

export default OrbitalModule;
