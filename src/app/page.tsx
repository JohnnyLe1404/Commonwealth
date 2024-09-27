"use client";

import { useState, FormEvent, useEffect } from "react";
import axios from "axios";

interface WalletResult {
  walletAddress: string;
  balance: number;
  claim: boolean;
}

const useDisableDevTools = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
};

const Home: React.FC = () => {
  useDisableDevTools();

  const [walletsInput, setWalletsInput] = useState<string>("");
  const [results, setResults] = useState<WalletResult[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    setTotalBalance(0);

    const wallets = walletsInput
      .split("\n")
      .map((wallet) => wallet.trim())
      .filter((wallet) => wallet !== "");

    if (wallets.length === 0) {
      setError("Vui lòng nhập ít nhất một địa chỉ ví.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/process-wallets", { wallets });
      const { filteredWallets, totalBalance } = response.data;
      setResults(filteredWallets);
      setTotalBalance(totalBalance);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Đã xảy ra lỗi khi xử lý các địa chỉ ví."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Commonwealth's Airdrop Checker - By Johnny Le
      </h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <label htmlFor="wallets" className="block mb-2 font-semibold">
          Nhập danh sách địa chỉ ví (mỗi ví trên một dòng):
        </label>
        <textarea
          id="wallets"
          value={walletsInput}
          onChange={(e) => setWalletsInput(e.target.value)}
          rows={10}
          className="w-full p-2 border bg-gray-500 border-gray-300 rounded mb-4"
          placeholder={`Ví dụ\n0x.....\n0x....`}
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Kiểm Tra"}
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Kết Quả</h2>
          <table className="min-w-full bg-gray-500 border">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Wallet</th>
                <th className="py-2 px-4 border">Balance</th>
              </tr>
            </thead>
            <tbody>
              {results.map((wallet, index) => (
                <tr key={index} className="text-center">
                  <td className="py-2 px-4 border break-all">
                    {wallet.walletAddress}
                  </td>
                  <td className="py-2 px-4 border">{wallet.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-semibold">Tổng Boxes: {totalBalance}</p>
        </div>
      )}
    </div>
  );
};

export default Home;
