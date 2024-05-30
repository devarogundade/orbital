// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDT is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {
        _mint(msg.sender, 50_000_000 * 10 ** decimals());
        _mint(address(this), 50_000_000 * 10 ** decimals());
    }

    function mint(address receiver) external {
        _transfer(address(this), receiver, 100 * 10 ** decimals());
    }
}
