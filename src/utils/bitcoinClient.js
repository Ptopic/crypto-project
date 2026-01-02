import Client from 'bitcoin-core';

const rawHost = process.env.RPC_HOST;
const rawPort = process.env.RPC_PORT;
const password = process.env.RPC_PASS;
const port = Number(rawPort);
const rpcHost = `${rawHost}:${port}`;

const client = new Client({
  host: rpcHost,
  username: process.env.RPC_USER,
  password,
  timeout: 60000,
});

export default client;
