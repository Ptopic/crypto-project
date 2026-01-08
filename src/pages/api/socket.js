import { Server } from 'socket.io';
import {
  getBestBlockHash,
  getBlock,
  getBlockStats,
  getMinerFromCoinbase,
} from '@/services/rpc';
import { getCryptoUnit } from '@/utils/cryptoUnits';

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server, {
      path: '/api/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected');

      let lastBlockHash = null;

      const sendNewBlock = async () => {
        const bestBlockHash = await getBestBlockHash();

        if (bestBlockHash !== lastBlockHash) {
          const unit = getCryptoUnit();
          const block = await getBlock(bestBlockHash);
          const blockStats = await getBlockStats(bestBlockHash);
          // Extract the coinbase transaction
          const coinbaseTx = block.tx[0];
          const miner = await getMinerFromCoinbase(coinbaseTx, bestBlockHash);

          // Get historical price data
          const apiUrlBase =
            unit === 'LTC'
              ? 'https://litecoinspace.org/api/v1'
              : 'https://mempool.space/api/v1';
          const priceResponse = await fetch(
            `${apiUrlBase}/historical-price?currency=USD&timestamp=${block.time}`
          );
          const priceData = await priceResponse.json();
          socket.emit('newBlock', {
            ...block,
            ...blockStats,
            miner,
            price: priceData?.prices?.[0]?.USD || 0,
          });
          lastBlockHash = bestBlockHash;
        }
      };

      // Send new blocks to the client
      setInterval(sendNewBlock, 60000); // Check for new blocks every 60 seconds

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  } else {
    console.log('Socket is already running');
  }
  res.end();
};

export default SocketHandler;
