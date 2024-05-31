function swapPairs(hexString: string): string {
    // Remove leading zeros
    let trimmedHexString = hexString.replace(/^0+/, '');

    // Ensure the trimmed string has even length for pairing
    if (trimmedHexString.length % 2 !== 0) {
        trimmedHexString = '0' + trimmedHexString;
    }

    // Swap character pairs
    let swappedString = '';
    for (let i = 0; i < trimmedHexString.length; i += 2) {
        swappedString += trimmedHexString[i + 1] + trimmedHexString[i];
    }

    return swappedString;
}

function manipulateHexString(hexString: string): string {
    let result = hexString.split('').reverse().join('');
    result = result.replace(/^0+/, '');
    result = swapPairs(result);
    result = '0x' + result;
    return result;
}

export function parseSuiOnBorrowHex(hex: string) {
    let hexString = hex;

    if (hexString.startsWith('0x')) {
        hexString = hexString.substring(2);
    }

    const method = "0x" + hexString.substring(0, 32);
    const loanId = "0x" + hexString.substring(32, 96);
    const sender = "0x" + hexString.substring(96, 160);
    const receiver = "0x" + hexString.substring(160, 224);
    const toChainId = "0x" + hexString.substring(224, 228);
    const fromContractId = "0x" + hexString.substring(228, 292);
    const toContractId = "0x" + hexString.substring(292, 356);

    let coinInValue = hexString.substring(692, 708);

    coinInValue = manipulateHexString(coinInValue);

    const result = {
        method,
        loanId,
        sender,
        receiver,
        toChainId,
        fromContractId,
        toContractId,
        coinInValue
    };

    return result;
}