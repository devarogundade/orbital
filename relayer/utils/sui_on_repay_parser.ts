export function parseSuiOnRepayHex(hex: string) {
    let hexString = hex;

    if (hexString.startsWith('0x')) {
        hexString = hexString.substring(2);
    }

    const method = "0x" + hexString.substring(0, 32);
    const loanId = "0x" + hexString.substring(32, 96);
    const fromChainId = "0x" + hexString.substring(96, 100);
    const fromContractId = "0x" + hexString.substring(100, 164);
    const toContractId = "0x" + hexString.substring(164, 228);

    const result = {
        method,
        loanId,
        fromChainId,
        fromContractId,
        toContractId
    };

    return result;
}