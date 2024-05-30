import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-ignition-ethers";
import FUDModule from "./FUD";
import USDTModule from "./USDT";

const PriceFeedsModule = buildModule("PriceFeedsModule", (m) => {
  const account = m.getAccount(0);

  const sValueFeed = "0xfA84fCE7aCa79c50216aac58b0669d48743a17a2";

  const AddressToBytes32 = m.library("AddressToBytes32");

  const priceFeeds = m.contract("PriceFeeds", [sValueFeed], {
    from: account,
    libraries: {
      AddressToBytes32: AddressToBytes32,
    },
  });

  const { fud } = m.useModule(FUDModule);
  const { usdt } = m.useModule(USDTModule);

  m.call(priceFeeds, "updateFeedId", [fud, 200], { id: "FUD", from: account }); // FUD_SUI

  m.call(priceFeeds, "updateFeedId", [usdt, 90], { id: "USDT", from: account }); // USDT_SUI

  return { priceFeeds };
});

export default PriceFeedsModule;
