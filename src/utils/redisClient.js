import { createClient } from 'redis';

const redisClient = createClient().on('error', (err) =>
  console.log('Redis Client Error', err)
);

await redisClient.connect();

export const setBlockData = async (unit, hash, data) => {
  const key = `${unit}:${hash}`;
  await redisClient.set(key, JSON.stringify(data));
};

export const getBlockData = async (unit, hash) => {
  const key = `${unit}:${hash}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export default redisClient;
