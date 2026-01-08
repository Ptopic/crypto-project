import { useEffect, useState } from 'react';
import prettyBytes from 'pretty-bytes';
import fromnow from 'fromnow';
import { getCryptoUnit, getSmallestUnit } from '@/utils/cryptoUnits';

const BlockItem = ({ block }) => {
  const [timeAgo, setTimeAgo] = useState('');
  const unit = getCryptoUnit();
  const smallestUnit = getSmallestUnit();

  useEffect(() => {
    setTimeAgo(fromnow(block.time * 1000, { suffix: true }));

    const interval = setInterval(() => {
      setTimeAgo(fromnow(block.time * 1000, { suffix: true }));
    }, 60000);

    return () => clearInterval(interval);
  }, [block.time]);

  const reward = (block.subsidy + block.totalfee) / 100000000;
  const rewardUSD = (reward * block.price).toFixed(2);

  return (
    <div className="min-w-[300px] max-w-[300px] bg-[rgba(19,22,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 transition-all duration-300 flex-shrink-0 hover:border-[rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:-translate-y-0.5">
      {/* Block Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold text-[#22c55e]">#{block.height}</div>
        <div className="text-xs text-[#8b8d93] bg-[rgba(255,255,255,0.05)] px-2.5 py-1 rounded-xl">{timeAgo}</div>
      </div>

      {/* Block Hash */}
      <div className="flex items-center gap-2 text-xs text-[#8b8d93] mb-4 px-3 py-2.5 bg-[rgba(255,255,255,0.03)] rounded-lg" title={block.hash}>
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <span>{block.hash.slice(0, 8)}...{block.hash.slice(-8)}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-[#8b8d93] uppercase tracking-wide">Transactions</span>
          <span className="text-sm font-semibold text-white">{block.nTx.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-[#8b8d93] uppercase tracking-wide">Size</span>
          <span className="text-sm font-semibold text-white">{prettyBytes(block.size)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-[#8b8d93] uppercase tracking-wide">Weight</span>
          <span className="text-sm font-semibold text-white">{(block.total_weight / 1000).toFixed(1)}K</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-[#8b8d93] uppercase tracking-wide">Avg Fee</span>
          <span className="text-sm font-semibold text-white">{block.avgfee.toLocaleString()} {smallestUnit}</span>
        </div>
      </div>

      {/* Reward Section */}
      <div className="bg-gradient-to-br from-[rgba(34,197,94,0.1)] to-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.2)] rounded-xl p-3 mb-4">
        <div className="text-[11px] text-[#8b8d93] mb-1">Block Reward</div>
        <div className="flex justify-between items-baseline">
          <span className="text-base font-bold text-[#22c55e]">{reward.toFixed(4)} {unit}</span>
          <span className="text-sm text-[#8b8d93]">${rewardUSD}</span>
        </div>
      </div>

      {/* Fee Range Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] text-[#8b8d93] mb-1.5">
          <span>Fee Range</span>
          <span>{block.minfeerate} - {block.maxfeerate} {smallestUnit}/vB</span>
        </div>
        <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#22c55e] to-[#f97316] rounded-sm transition-all duration-300"
            style={{ width: `${Math.min((block.medianfee / block.maxfeerate) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Miner */}
      <div className="flex items-center gap-2 text-xs text-[#8b8d93] overflow-hidden" title={block.miner}>
        <svg className="w-3.5 h-3.5 text-[#f97316] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
        </svg>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {block.miner !== 'Unknown'
            ? `${block.miner.slice(0, 12)}...${block.miner.slice(-8)}`
            : 'Unknown Miner'}
        </span>
      </div>
    </div>
  );
};

export default BlockItem;
