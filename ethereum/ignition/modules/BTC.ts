import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-ignition-ethers";

const BTCModule = buildModule("BTCModule", (m) => {
  const account = m.getAccount(0);

  const btc = m.contract("BTC", [], { from: account });

  return { btc };
});

export default BTCModule;
