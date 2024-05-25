import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-ignition-ethers";
import BTCModule from "./BTC";
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

  const { btc } = m.useModule(BTCModule);
  const { usdt } = m.useModule(USDTModule);

  m.call(priceFeeds, "updateFeedId", [btc, 18], { id: "BTC", from: account });

  m.call(priceFeeds, "updateFeedId", [usdt, 48], { id: "USDT", from: account });

  return { priceFeeds };
});

export default PriceFeedsModule;
