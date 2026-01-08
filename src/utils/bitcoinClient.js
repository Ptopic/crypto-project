import Client from 'bitcoin-core';

// Old version (for traditional RPC servers)
// const rawHost = process.env.RPC_HOST;
// const rawPort = process.env.RPC_PORT;
// const password = process.env.RPC_PASS;
// const port = Number(rawPort);
// const rpcHost = `${rawHost}:${port}`;
//
// const client = new Client({
//   host: rpcHost,
//   username: process.env.RPC_USER,
//   password,
//   timeout: 60000,
// });

// New version (supports both GetBlock.io and traditional RPC)
const rawHost = process.env.RPC_HOST;
const rawPort = process.env.RPC_PORT;
const password = process.env.RPC_PASS;
const username = process.env.RPC_USER;

// Handle GetBlock.io format (URL includes API key, no port needed)
// vs traditional RPC (host:port with username/password)
const isGetBlock = rawHost && !rawHost.includes('blockchain.oss.unist.hr');

const clientConfig = {
  timeout: 60000,
};

if (isGetBlock) {
  // GetBlock.io: API key is in URL, no separate auth needed
  clientConfig.host = rawHost;
  clientConfig.username = username || 'user';
  clientConfig.password = password || 'pass';
} else {
  // Traditional RPC: host:port with username/password
  const port = Number(rawPort);
  clientConfig.host = `${rawHost}:${port}`;
  clientConfig.username = username;
  clientConfig.password = password;
}

const client = new Client(clientConfig);

export default client;
