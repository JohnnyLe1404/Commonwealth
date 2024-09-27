
import { NextResponse } from 'next/server';
import axios from 'axios';

interface WalletResult {
  walletAddress: string;
  balance: number;
  claim: boolean;
}

interface ApiResponse {
  code: number;
  message: string;
  data: {
    balance: number;
    multiplier: number;
    extra: number;
    rules: Record<string, number>;
    claim: boolean;
  };
}

interface ProcessedResponse {
  filteredWallets: WalletResult[];
  totalBalance: number;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { wallets } = body;

    if (!Array.isArray(wallets)) {
      return NextResponse.json({ message: 'Invalid input format' }, { status: 400 });
    }

    const isValidWallet = (wallet: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(wallet);

    const validWallets: string[] = wallets.filter(isValidWallet);

    if (validWallets.length === 0) {
      return NextResponse.json({ message: 'No valid wallets provided' }, { status: 400 });
    }

    const getAirdropBalance = async (walletAddress: string): Promise<WalletResult | null> => {
      const url = `https://api.commonwealth4.com/airdrop_balance?user=${walletAddress}`;
      try {
        const response = await axios.get<ApiResponse>(url);
        const data = response.data;

        if (data && data.data) {
          const { balance, claim } = data.data;
          return { walletAddress, balance, claim };
        } else {
          console.error(`Invalid data structure for wallet ${walletAddress}`);
          return null;
        }
      } catch (error: any) {
        console.error(`Error fetching balance for wallet ${walletAddress}:`, error.message);
        return null;
      }
    };

    const promises: Promise<WalletResult | null>[] = validWallets.map(wallet => getAirdropBalance(wallet));
    const results = await Promise.all(promises);

    const validResults: WalletResult[] = results.filter(
      (result): result is WalletResult => result !== null
    );

    const filteredWallets: WalletResult[] = validResults.filter(
      wallet => wallet.balance > 1 && wallet.claim === false
    );

    const totalBalance: number = filteredWallets.reduce((acc, wallet) => acc + wallet.balance, 0);

    const response: ProcessedResponse = { filteredWallets, totalBalance };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('Error processing wallets:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
