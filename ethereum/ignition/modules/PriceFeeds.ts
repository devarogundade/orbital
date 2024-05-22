import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-ignition-ethers";

const PriceFeedsModule = buildModule("PriceFeedsModule", (m) => {
  const account = m.getAccount(0);

  const sValueFeed = "0xfA84fCE7aCa79c50216aac58b0669d48743a17a2";

  const priceFeeds = m.contract("PriceFeeds", [sValueFeed], { from: account });

  const update1 = m.call(priceFeeds, "updateFeedId", ["0x00000000000000000000000081297d0e83488A4eFC074041488bB4a9B5713a0E", 18], {
    id: "BTC",
    from: account
  });

  const update2 = m.call(priceFeeds, "updateFeedId", ["0x000000000000000000000000e61C27B23970D90Bb6A0425498D41cC990B8F517", 48], {
    id: "USDT",
    from: account
  });

  m.call(priceFeeds, "getPrice", [
    "0x00000000000000000000000081297d0e83488A4eFC074041488bB4a9B5713a0E"
  ], {
    after: [update1, update2],
    from: account
  });

  return { priceFeeds };
});

export default PriceFeedsModule;
