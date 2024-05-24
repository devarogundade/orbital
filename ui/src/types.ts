export type Loan = {
    amountIn: number | undefined;
    amountOut: number | undefined;
    tokenType: number;
    fromChainId: number;
    toChainId: number;
    collateral: string;
    principal: string;
    interchange: boolean;
    interestRate: number | undefined;
    startSecs: number | undefined;
};

export interface Message {
    title: string;
    description: string;
    category: string;
    linkTitle?: string;
    linkUrl?: string;
}
