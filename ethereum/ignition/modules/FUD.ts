import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-ignition-ethers";

const FUDModule = buildModule("FUDModule", (m) => {
  const account = m.getAccount(0);

  const fud = m.contract("FUD", [], { from: account });

  return { fud };
});

export default FUDModule;
