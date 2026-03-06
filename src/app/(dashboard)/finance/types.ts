export type TransactionStatus = 'Successful' | 'Pending' | 'Failed';

export interface Transaction {
  id: string;
  transactionId: string;
  description: string;
  amount: number;
  asset: 'USDT' | 'ETH' | 'BTC' | 'KES';
  status: TransactionStatus;
  timestamp: string; 
}