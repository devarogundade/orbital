import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-ignition-ethers";

const PriceFeedsModule = buildModule("PriceFeedsModule", (m) => {
  const account = m.getAccount(0);

  const sValueFeed = "0xfA84fCE7aCa79c50216aac58b0669d48743a17a2";

  const priceFeeds = m.contract("PriceFeeds", [sValueFeed], { from: account });

  const update1 = m.call(priceFeeds, "updateFeedId", ["0x000000000000000000000000bDD5A6fD93267B9dc3943361f6cF162bC201F6F7", 18], {
    id: "BTC",
    from: account
  });

  const update2 = m.call(priceFeeds, "updateFeedId", ["0x000000000000000000000000FD132250838394168dFC2Da524C5Ee612715c431", 48], {
    id: "USDT",
    from: account
  });

  m.call(priceFeeds, "getPrice", [
    "0x000000000000000000000000bDD5A6fD93267B9dc3943361f6cF162bC201F6F7"
  ], {
    after: [update1, update2],
    from: account
  });

  return { priceFeeds };
});

export default PriceFeedsModule;
