// SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.24;

library IntConversion {
    function int64ToUint64(int64 _value) internal pure returns (uint64) {
        require(_value >= 0, "Value must be non-negative");
        return uint64(_value);
    }

    function uint64ToInt64(uint64 _value) internal pure returns (int64) {
        return int64(_value);
    }
}
