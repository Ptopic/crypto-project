import bitcoinClient from '@/utils/bitcoinClient';
import { getCryptoUnit } from '@/utils/cryptoUnits';

export const getBlockCount = async () => {
  return bitcoinClient.getBlockCount();
};

export const getBestBlockHash = async () => {
  return bitcoinClient.getBestBlockHash();
};

export const getBlock = async (blockHash) => {
  return bitcoinClient.getBlock(blockHash);
};

export const getBlockHash = async (blockHeight) => {
  return bitcoinClient.getBlockHash(blockHeight);
};

export const getBlockStats = async (blockHash) => {
  return bitcoinClient.getBlockStats(blockHash);
};

export const fetchBlocks = async (start, end, startTime) => {
  const unit = getCryptoUnit();
  const blocks = [];

  for (let i = start; i > end && i > 0; i--) {
    try {
      const blockHash = await getBlockHash(i);
      const block = await getBlock(blockHash);
      if (block.time < startTime) break;
      const blockStats = await getBlockStats(blockHash);

      // Extract the coinbase transaction
      const coinbaseTx = block.tx[0];
      const miner = await getMinerFromCoinbase(coinbaseTx, blockHash);

      // Get historical price data with timeout
      const apiUrlBase =
        unit === 'LTC'
          ? 'https://litecoinspace.org/api/v1'
          : 'https://mempool.space/api/v1';

      let price = 0;
      try {
        const priceResponse = await Promise.race([
          fetch(`${apiUrlBase}/historical-price?currency=USD&timestamp=${block.time}`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Price fetch timeout')), 5000))
        ]);
        const priceData = await priceResponse.json();
        price = priceData?.prices?.[0]?.USD || 0;
      } catch (priceError) {
        console.warn(`Failed to fetch price for block ${i}:`, priceError.message);
      }

      const blockData = {
        ...blockStats,
        ...block,
        miner,
        price,
      };

      blocks.unshift(blockData);
    } catch (error) {
      console.error(`Error fetching block ${i}:`, error.message);
      // Continue with next block instead of failing completely
      continue;
    }
  }

  return blocks;
};

export const getMinerFromCoinbase = async (coinbaseTx, blockHash) => {
  const tx = await getRawTransaction(coinbaseTx, true, blockHash);
  const miner =
    tx?.vout?.[0]?.scriptPubKey?.address ||
    tx?.vout?.[0]?.scriptPubKey?.addresses?.[0] ||
    'Unknown';
  return miner;
};

export const getRawTransaction = async (txid, verbose = true, blockHash) => {
  return bitcoinClient.getRawTransaction(txid, verbose, blockHash);
};

export const getTimeRangeBlocks = async (timeRange, page = 1, limit = 10) => {
  const now = Math.floor(Date.now() / 1000);
  let startTime;

  switch (timeRange) {
    case '24h':
      startTime = now - 24 * 60 * 60;
      break;
    case '3d':
      startTime = now - 3 * 24 * 60 * 60;
      break;
    case '1w':
      startTime = now - 7 * 24 * 60 * 60;
      break;
    case '1m':
      startTime = now - 30 * 24 * 60 * 60;
      break;
    default:
      startTime = now - 24 * 60 * 60;
  }

  const blockCount = await getBlockCount();
  const start = (page - 1) * limit;
  const end = start + limit;

  const blocks = await fetchBlocks(
    blockCount - start,
    blockCount - end,
    startTime
  );

  return blocks;
};
