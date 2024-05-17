module orbital::vault {
    use sui::transfer::{Self};
    use sui::coin::{Self, Coin};

    public fun transfer_coins<T>(
        coin: Coin<T>,
        receiver: address
    ) {
        transfer::public_transfer(coin, receiver);
    }

}