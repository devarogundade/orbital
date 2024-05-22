import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-ignition-ethers";

const USDTModule = buildModule("USDTModule", (m) => {
  const account = m.getAccount(0);

  const usdt = m.contract("USDT", [], { from: account });

  return { usdt };
});

export default USDTModule;
