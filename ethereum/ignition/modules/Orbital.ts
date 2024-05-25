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

  m.call(orbital, "addSupportedToken", [btc], { id: "BTC", from: account });

  m.call(orbital, "addSupportedToken", [usdt], { id: "USDT", from: account });

  const SUI_CHAIN_ID = 21;
  const SUI_ORBITAL_ID = "0xd32d534df7c7f0e9ce67e682c70decdb67f8b17224c824f9722ab752a648b798";

  m.call(orbital, "addForeignOrbital", [SUI_CHAIN_ID, SUI_ORBITAL_ID], {
    from: account,
  });

  return { orbital };
});

export default OrbitalModule;
