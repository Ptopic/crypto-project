'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import io from 'socket.io-client';
import { getCryptoUnit, getSmallestUnit } from '@/utils/cryptoUnits';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Lazy load components
const Chart = dynamic(() => import('@/components/chart'), { ssr: false });
const BlockItem = dynamic(() => import('@/components/blockItem'), { ssr: false });
const LoadingSpinner = dynamic(() => import('@/components/loadingSpinner'), { ssr: false });

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  {
    id: 'uniqueID',
    afterDraw: function (chart, easing) {
      if (chart.tooltip._active && chart.tooltip._active.length) {
        const activePoint = chart.tooltip._active[0];
        const ctx = chart.ctx;
        const x = activePoint.element.x;
        const topY = chart.scales.y.top;
        const bottomY = chart.scales.y.bottom;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#bababa';
        ctx.stroke();
        ctx.restore();
      }
    },
  }
);

export default function Home() {
  const unit = getCryptoUnit();
  const smallestUnit = getSmallestUnit();

  const [blocks, setBlocks] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [view, setView] = useState(unit);

  const fetchBlocks = useCallback(async (range, page) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/blocks?timeRange=${range}&page=${page}&limit=10`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        if (data.length < 10) {
          setHasMore(false);
        }
        setBlocks((prevBlocks) => {
          const allBlocks = [...prevBlocks, ...data];
          allBlocks.sort((a, b) => a.height - b.height);
          return allBlocks;
        });
        if (data.length === 10) {
          fetchBlocks(range, page + 1);
        }
      } else {
        console.error('Data is not an array:', data);
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setBlocks([]);
    setPage(1);
    setHasMore(true);
    fetchBlocks(timeRange, 1);
  }, [timeRange, fetchBlocks]);

  useEffect(() => {
    // Initialize socket endpoint first
    fetch('/api/socket').catch(console.error);

    const socket = io({
      path: '/api/socket.io',
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('newBlock', (newBlock) => {
      setBlocks((prevBlocks) => {
        if (!prevBlocks.some((block) => block.hash === newBlock.hash)) {
          return [...prevBlocks, newBlock];
        }
        return prevBlocks;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const chartBlockFeeRates = {
    labels: blocks.map((block) => block.height),
    datasets: [
      {
        label: 'Min',
        data: blocks.map((block) => block.minfeerate),
        backgroundColor: 'rgba(216, 27, 96, 1)',
      },
      {
        label: '10th Percentile',
        data: blocks.map((block) => block.feerate_percentiles[0]),
        backgroundColor: 'rgba(142, 36, 170, 1)',
      },
      {
        label: '25th Percentile',
        data: blocks.map((block) => block.feerate_percentiles[1]),
        backgroundColor: 'rgba(30, 136, 229, 1)',
      },
      {
        label: 'Median',
        data: blocks.map((block) => block.feerate_percentiles[2]),
        backgroundColor: 'rgba(124, 179, 66, 1)',
      },
      {
        label: '75th Percentile',
        data: blocks.map((block) => block.feerate_percentiles[3]),
        backgroundColor: 'rgba(253, 216, 53, 1)',
      },
      {
        label: '90th Percentile',
        data: blocks.map((block) => block.feerate_percentiles[4]),
        backgroundColor: 'rgba(109, 76, 65, 1)',
      },
      {
        label: 'Max',
        data: blocks.map((block) => block.maxfeerate),
        backgroundColor: 'rgba(110, 112, 121, 1)',
        hidden: true,
      },
    ],
  };

  const optionsBlockFeeRates = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Block Fee Rates',
      },
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ` ${smallestUnit}/vB`;
            }
            return label;
          },
          afterLabel: function (context) {
            const block = blocks[context.dataIndex];
            if (block) {
              return `Time: ${new Date(block.time * 1000).toLocaleString()}`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Block Height',
        },
        stacked: true,
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: `Fee Rate (${smallestUnit}oshis per virtual byte)`,
        },
        stacked: true,
        min: 0,
      },
    },
  };

  const datasetBlockFeeVsSubsidy = [
    {
      label: 'Subsidy',
      data: blocks.map((block) => block.subsidy / 100000000),
      backgroundColor: 'rgba(255, 159, 0, 1)',
      view: unit,
    },
    {
      label: 'Fees',
      data: blocks.map((block) => block.totalfee / 100000000),
      backgroundColor: 'rgba(10, 171, 41, 1)',
      view: unit,
    },
    {
      label: 'Subsidy (%)',
      data: blocks.map(
        (block) => (block.subsidy / (block.subsidy + block.totalfee)) * 100
      ),
      backgroundColor: 'rgba(255, 159, 0, 1)',
      view: 'Percentage',
    },
    {
      label: 'Fees (%)',
      data: blocks.map(
        (block) => (block.totalfee / (block.subsidy + block.totalfee)) * 100
      ),
      backgroundColor: 'rgba(10, 171, 41, 1)',
      view: 'Percentage',
    },
  ];

  const chartBlockFeeVsSubsidy = {
    labels: blocks.map((block) => block.height),
    datasets: datasetBlockFeeVsSubsidy.filter(
      (dataset) => dataset.view === view
    ),
  };

  const optionsBlockFeeVsSubsidy = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Block Fees Vs Subsidy',
      },
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + (view === unit ? ` ${unit}` : ' %');
            }
            return label;
          },
          afterLabel: function (context) {
            const block = blocks[context.dataIndex];
            if (block) {
              return `Time: ${new Date(block.time * 1000).toLocaleString()}`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Block Height',
        },
        stacked: true,
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: view === unit ? `Value (${unit})` : 'Percentage of Reward (%)',
        },
        stacked: true,
        min: 0,
        max: view === unit ? undefined : 100,
      },
    },
  };

  const chartBlockRewards = {
    labels: blocks.map((block) => block.height),
    datasets: [
      {
        label: `Rewards (${unit})`,
        data: blocks.map(
          (block) => (block.subsidy + block.totalfee) / 100000000
        ),
        borderColor: 'rgba(255, 159, 0, 1)',
        backgroundColor: 'rgba(255, 159, 0, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Rewards (USD)',
        data: blocks.map((block) =>
          (
            block.price *
            ((block.subsidy + block.totalfee) / 100000000)
          ).toFixed(2)
        ),
        borderColor: 'rgba(10, 171, 41, 1)',
        backgroundColor: 'rgba(10, 171, 41, 0.5)',
        yAxisID: 'y1',
      },
      {
        label: `Block Value (${unit})`,
        data: blocks.map((block) => block.total_out / 100000000),
        borderColor: 'rgb(70, 70, 70)',
        backgroundColor: 'rgba(70, 70, 70, 0.5)',
        hidden: true,
      },
    ],
  };

  const optionsBlockRewards = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Block Rewards',
      },
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label.includes('USD')) {
                label += context.parsed.y + ' USD';
              } else {
                label += context.parsed.y + ` ${unit}`;
              }
            }
            return label;
          },
          afterLabel: function (context) {
            const block = blocks[context.dataIndex];
            if (block) {
              return `Time: ${new Date(block.time * 1000).toLocaleString()}`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Block Height',
        },
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: `Value (${unit})`,
        },
        position: 'left',
      },
      y1: {
        type: 'linear',
        title: {
          display: true,
          text: 'Value (USD)',
        },
        position: 'right',
      },
    },
    datasets: {
      line: {
        pointRadius: 0,
      },
    },
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">crypto-project</h1>
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          onClick={() => setTimeRange('24h')}
          className="px-4 py-2 text-sm font-medium uppercase text-gray-900 bg-white border border-gray-200 rounded-s-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
        >
          24h
        </button>
        <button
          onClick={() => setTimeRange('3d')}
          className="px-4 py-2 text-sm font-medium uppercase text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
        >
          3d
        </button>
        <button
          onClick={() => setTimeRange('1w')}
          className="px-4 py-2 text-sm font-medium uppercase text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
        >
          1w
        </button>
        <button
          onClick={() => setTimeRange('1m')}
          className="px-4 py-2 text-sm font-medium uppercase text-gray-900 bg-white border border-gray-200 rounded-e-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
        >
          1m
        </button>
      </div>
      <div className="mt-4 mb-8 overflow-x-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ul className="flex space-x-4">
          {blocks
            .slice()
            .reverse()
            .map((block, index) => (
              <BlockItem key={index} block={block} />
            ))}
        </ul>
      </div>
      {loading && <LoadingSpinner />}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Block Fee Rates</h2>
        <p className="mb-4">
          The fee rate is the total fees divided by the block size in virtual
          bytes.
        </p>
        <Chart
          type="bar"
          data={chartBlockFeeRates}
          options={optionsBlockFeeRates}
        />
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Block Fees Vs Subsidy</h2>
        <p className="mb-4">
          The block subsidy is the amount of new bitcoins awarded to the miner
          for each block. The total fees are the sum of all transaction fees in
          the block.
        </p>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setView(unit)}
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-s-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
          >
            {unit} View
          </button>
          <button
            onClick={() => setView('Percentage')}
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-e-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
          >
            Percentage View
          </button>
        </div>
        <Chart
          type="bar"
          data={chartBlockFeeVsSubsidy}
          options={optionsBlockFeeVsSubsidy}
        />
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Block Rewards</h2>
        <p className="mb-4">
          The block reward is the sum of the block subsidy and the total fees.
        </p>
        <Chart
          type="line"
          data={chartBlockRewards}
          options={optionsBlockRewards}
        />
      </div>
    </div>
  );
}
