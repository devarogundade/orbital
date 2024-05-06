// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

library AddressToBytes32 {
    function addressToBytes32(address _address) public pure returns (bytes32) {
        return bytes32(uint256(uint160(_address)));
    }

    function bytes32ToAddress(bytes32 _bytes) public pure returns (address) {
        return address(uint160(uint256(_bytes)));
    }
}
