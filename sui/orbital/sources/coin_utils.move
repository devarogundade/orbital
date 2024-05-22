// SPDX-License-Identifier: UNLICENSED
#[allow(unused_const,unused_variable,duplicate_alias,unused_type_parameter,unused_function)]
module orbital::coin_utils {
    use std::ascii::into_bytes;
    use std::type_name::{get, into_string};
    use std::string::{Self, String};

    public fun get_coin_id<T>(): String {
        let mut coin_id = string::utf8(b"");

        string::append_utf8(&mut coin_id, b"coin_id_");

        string::append_utf8(&mut coin_id, into_bytes(into_string(get<T>())));

        coin_id
    }

    public fun bytes_to_hex_string(
        bytes: &vector<u8>
    ): String {
        use std::vector;

        let length = vector::length(bytes);
        let hex_symbols: vector<u8> = b"0123456789abcdef";
        let mut buffer = b"0x";

        let mut i: u64 = 0;
        while (i < length) {
            // little endian
            let byte = *vector::borrow(bytes, length - i - 1);

            vector::push_back(&mut buffer, *vector::borrow(&hex_symbols, (byte >> 4 & 0xf as u64)));
            vector::push_back(&mut buffer, *vector::borrow(&hex_symbols, (byte & 0xf as u64)));

            i = i + 1;
        };
        string::utf8(buffer)
    }
}