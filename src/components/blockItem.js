import { useEffect, useState } from 'react';
import prettyBytes from 'pretty-bytes';
import fromnow from 'fromnow';
import { getCryptoUnit, getSmallestUnit } from '@/utils/cryptoUnits';

const BlockItem = ({ block }) => {
  const [timeAgo, setTimeAgo] = useState('');
  const unit = getCryptoUnit();
  const smallestUnit = getSmallestUnit();

  useEffect(() => {
    // Set initial value on client side only
    setTimeAgo(fromnow(block.time * 1000, { suffix: true }));

    const interval = setInterval(() => {
      setTimeAgo(fromnow(block.time * 1000, { suffix: true }));
    }, 60000); // Update every minute

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [block.time]);

  return (
    <li className="min-w-[350px]">
      <div className="text-lg text-center text-cyan-500">{block.height}</div>
      <div className=" p-4 rounded-lg shadow-md bg-gradient-to-b from-purple-600 to-indigo-700">
        <div className="text-sm" title={block.hash}>
          Hash: {block.hash.slice(0, 6)}...{block.hash.slice(-7)}
        </div>
        <div className="text-sm">Number of Transactions: {block.nTx}</div>
        <div className="text-sm">
          Total Size: {prettyBytes(block.size, { maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm">Time: {timeAgo}</div>
        <div className="text-sm">Weight: {block.total_weight} WU</div>
        <div className="text-sm">
          Fee Span: {block.minfeerate} - {block.maxfeerate} {smallestUnit}/vB
        </div>
        <div className="text-sm">
          Median Fee: {block.medianfee} {smallestUnit} ={' '}
          {block.medianfee / 100000000} {unit}
        </div>
        <div className="text-sm">
          Average Fee: {block.avgfee} {smallestUnit} ={' '}
          {block.avgfee / 100000000} {unit}
        </div>
        <div className="text-sm">
          Total Fee: {block.totalfee} {smallestUnit} ={' '}
          {block.totalfee / 100000000} {unit}
        </div>
        <div className="text-sm">
          Subsidy + Fee: {block.subsidy + block.totalfee} {smallestUnit} ={' '}
          {(block.subsidy + block.totalfee) / 100000000} {unit}
        </div>
        <div className="text-sm">
          Total Value: {block.total_out} {smallestUnit} ={' '}
          {block.total_out / 100000000} {unit}
        </div>
        <div className="text-sm" title={block.miner}>
          Miner:{' '}
          {block.miner !== 'Unknown'
            ? block.miner?.slice(0, 6) + '...' + block.miner?.slice(-7)
            : block.miner}
        </div>
        <div className="text-sm">
          Price: 1 {unit} = {block.price} USD
        </div>
      </div>
    </li>
  );
};

export default BlockItem;
