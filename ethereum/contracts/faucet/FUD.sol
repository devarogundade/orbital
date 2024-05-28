// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FUD is ERC20 {
    constructor() ERC20("Fud the Pug", "FUD") {
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
    }

    function mint() external {
        _mint(msg.sender, 1 * 10 ** decimals());
    }
}
