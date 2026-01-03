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
    <div className="block-card">
      {/* Block Header */}
      <div className="block-header">
        <div className="block-height">#{block.height}</div>
        <div className="block-time">{timeAgo}</div>
      </div>

      {/* Block Hash */}
      <div className="block-hash" title={block.hash}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <span>{block.hash.slice(0, 8)}...{block.hash.slice(-8)}</span>
      </div>

      {/* Stats Grid */}
      <div className="block-stats">
        <div className="block-stat">
          <span className="block-stat-label">Transactions</span>
          <span className="block-stat-value">{block.nTx.toLocaleString()}</span>
        </div>
        <div className="block-stat">
          <span className="block-stat-label">Size</span>
          <span className="block-stat-value">{prettyBytes(block.size)}</span>
        </div>
        <div className="block-stat">
          <span className="block-stat-label">Weight</span>
          <span className="block-stat-value">{(block.total_weight / 1000).toFixed(1)}K</span>
        </div>
        <div className="block-stat">
          <span className="block-stat-label">Avg Fee</span>
          <span className="block-stat-value">{block.avgfee.toLocaleString()} {smallestUnit}</span>
        </div>
      </div>

      {/* Reward Section */}
      <div className="block-reward">
        <div className="reward-label">Block Reward</div>
        <div className="reward-values">
          <span className="reward-crypto">{reward.toFixed(4)} {unit}</span>
          <span className="reward-usd">${rewardUSD}</span>
        </div>
      </div>

      {/* Fee Range Bar */}
      <div className="fee-range">
        <div className="fee-range-label">
          <span>Fee Range</span>
          <span>{block.minfeerate} - {block.maxfeerate} {smallestUnit}/vB</span>
        </div>
        <div className="fee-range-bar">
          <div className="fee-range-fill" style={{ width: `${Math.min((block.medianfee / block.maxfeerate) * 100, 100)}%` }}></div>
        </div>
      </div>

      {/* Miner */}
      <div className="block-miner" title={block.miner}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
        </svg>
        <span className="miner-address">
          {block.miner !== 'Unknown' 
            ? `${block.miner.slice(0, 12)}...${block.miner.slice(-8)}` 
            : 'Unknown Miner'}
        </span>
      </div>
    </div>
  );
};

export default BlockItem;
