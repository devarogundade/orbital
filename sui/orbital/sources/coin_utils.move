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
}