export function parseSuiOnRepayHex(hex: string) {
    let hexString = hex;

    if (hexString.startsWith('0x')) {
        hexString = hexString.substring(2);
    }

    const method = "0x" + hexString.substring(0, 30);
    const loanId = "0x" + hexString.substring(30, 94);
    const fromChainId = "0x" + hexString.substring(94, 98);
    const fromContractId = "0x" + hexString.substring(98, 162);
    const toContractId = "0x" + hexString.substring(162, 226);

    const result = {
        method,
        loanId,
        fromChainId,
        fromContractId,
        toContractId
    };

    return result;
}