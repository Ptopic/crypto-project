export const getCryptoUnit = () => {
  const unit = process.env.NEXT_PUBLIC_CRYPTO_UNIT || 'BTC';
  return unit === 'LTC' ? 'LTC' : 'BTC';
};

export const getSmallestUnit = () => {
  const unit = process.env.NEXT_PUBLIC_CRYPTO_UNIT || 'BTC';
  return unit === 'LTC' ? 'lit' : 'sat';
};
