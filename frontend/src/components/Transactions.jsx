import { useEffect, useState } from "react";
import api from "../service/api";
import { TableSkeleton } from "./Skeleton";
import CoinIcon from "./CoinIcon";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await api.get("/transactions/history");
        setTransactions(res.data.payload || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) return <div className="p-10"><TableSkeleton rows={10} /></div>;

  const filteredTransactions = transactions.filter(tx => 
    tx.stockSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.transactionType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-10 animate-fade-in pb-20">
      <header className="text-left max-w-xl">
        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Transaction History</h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">Keep track of all your simulated trading activity with full transactional logs.</p>
      </header>

      <section className="glass-card bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm w-full">
        <div className="p-6 border-b border-slate-100 bg-white">
          <input
            type="text"
            placeholder="Search by asset or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:bg-white focus:border-indigo-500"
          />
        </div>
        <div className="overflow-x-auto max-h-[640px] custom-scrollbar relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md">
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quantity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td className="px-8 py-12 text-center text-slate-400 font-medium" colSpan="6">
                    No trading activity found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        tx.transactionType === "BUY" ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-rose-50 text-rose-600 border-rose-100/50"
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${tx.transactionType === "BUY" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        {tx.transactionType}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 uppercase tracking-wide">{tx.stockSymbol}</p>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-800">{tx.quantity}</td>
                    <td className="px-8 py-6 text-right font-medium text-slate-500">
                      ${tx.pricePerShare?.toFixed(2)}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-900">
                      ${tx.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-8 py-6 text-right font-medium text-slate-500 text-sm">
                      <span className="text-slate-700 font-semibold">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Transactions;
