'use client';;
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
  Filler,
} from 'chart.js';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useRef } from 'react';

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
  Filler,
  {
    id: 'uniqueID',
    afterDraw: function (chart, easing) {
      if (chart.tooltip && chart.tooltip._active && chart.tooltip._active.length) {
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
        ctx.strokeStyle = 'rgba(139, 141, 147, 0.5)';
        ctx.stroke();
        ctx.restore();
      }
    },
  }
);

export default function Home() {
  const unit = getCryptoUnit();
  const smallestUnit = getSmallestUnit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialTimeRange = searchParams.get('timeRange') ?? '24h';
  const [blocks, setBlocks] = useState([]);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [view, setView] = useState(unit);
  const timeRangeRef = useRef(initialTimeRange);

  useEffect(() => {
    const paramRange = searchParams.get('timeRange') ?? '24h';
    setTimeRange(paramRange);
  }, [searchParams]);

  useEffect(() => {
    timeRangeRef.current = timeRange;
  }, [timeRange]);

  const handleTimeRangeChange = (newRange) => {
    if (!newRange || newRange === timeRangeRef.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('timeRange', newRange);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setTimeRange(newRange);
  };

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
        if (range !== timeRangeRef.current) {
          return;
        }
        setBlocks((prevBlocks) => {
          const allBlocks = [...prevBlocks, ...data];
          allBlocks.sort((a, b) => a.height - b.height);
          return allBlocks;
        });
        if (data.length === 10 && range === timeRangeRef.current) {
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

  // Dark theme chart defaults
  const chartTheme = {
    color: '#8b8d93',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    titleColor: '#ffffff',
    gridColor: 'rgba(255, 255, 255, 0.06)',
  };

  const createBarGradient = (r, g, b) => {
    return (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;
      
      if (!chartArea) {
        return `rgba(${r}, ${g}, ${b}, 1)`;
      }
      
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, `rgba(${Math.floor(r * 0.3)}, ${Math.floor(g * 0.3)}, ${Math.floor(b * 0.3)}, 1)`);
      gradient.addColorStop(0.5, `rgba(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)}, 1)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 1)`);
      return gradient;
    };
  };

  const chartBlockFeeRates = {
    labels: blocks.map((block) => block.height),
    datasets: [
      {
        label: 'Min',
        data: blocks.map((block) => block.minfeerate),
        backgroundColor: createBarGradient(255, 59, 92),
      },
      {
        label: '10th Percentile',
        data: blocks.map((block) => block.feerate_percentiles[0]),
        backgroundColor: createBarGradient(190, 75, 255),
      },
      {
        label: '25th Percentile',
        data: blocks.map((block) => block.feerate_percentiles[1]),
        backgroundColor: createBarGradient(59, 170, 255),
      },
      {
        label: 'Median',
        data: blocks.map((block) => block.feerate_percentiles[2]),
        backgroundColor: createBarGradient(0, 255, 136),
      },
      {
        label: '75th Percentile',
        data: blocks.map((block) => block.feerate_percentiles[3]),
        backgroundColor: createBarGradient(255, 140, 50),
      },
      {
        label: '90th Percentile',
        data: blocks.map((block) => block.feerate_percentiles[4]),
        backgroundColor: createBarGradient(255, 220, 40),
      },
      {
        label: 'Max',
        data: blocks.map((block) => block.maxfeerate),
        backgroundColor: createBarGradient(180, 190, 210),
        hidden: true,
      },
    ],
  };

  const optionsBlockFeeRates = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        labels: {
          color: chartTheme.color,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(19, 22, 27, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#8b8d93',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
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
          color: chartTheme.color,
        },
        stacked: true,
        ticks: { color: chartTheme.color },
        grid: { color: chartTheme.gridColor },
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: `Fee Rate (${smallestUnit}/vB)`,
          color: chartTheme.color,
        },
        stacked: true,
        min: 0,
        ticks: { color: chartTheme.color },
        grid: { color: chartTheme.gridColor },
      },
    },
  };

  const datasetBlockFeeVsSubsidy = [
    {
      label: 'Subsidy',
      data: blocks.map((block) => block.subsidy / 100000000),
      backgroundColor: createBarGradient(255, 140, 50),
      view: unit,
    },
    {
      label: 'Fees',
      data: blocks.map((block) => block.totalfee / 100000000),
      backgroundColor: createBarGradient(0, 255, 136),
      view: unit,
    },
    {
      label: 'Subsidy (%)',
      data: blocks.map(
        (block) => (block.subsidy / (block.subsidy + block.totalfee)) * 100
      ),
      backgroundColor: createBarGradient(255, 140, 50),
      view: 'Percentage',
    },
    {
      label: 'Fees (%)',
      data: blocks.map(
        (block) => (block.totalfee / (block.subsidy + block.totalfee)) * 100
      ),
      backgroundColor: createBarGradient(0, 255, 136),
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
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        labels: {
          color: chartTheme.color,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(19, 22, 27, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#8b8d93',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
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
          color: chartTheme.color,
        },
        stacked: true,
        ticks: { color: chartTheme.color },
        grid: { color: chartTheme.gridColor },
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: view === unit ? `Value (${unit})` : 'Percentage of Reward (%)',
          color: chartTheme.color,
        },
        stacked: true,
        min: 0,
        max: view === unit ? undefined : 100,
        ticks: { color: chartTheme.color },
        grid: { color: chartTheme.gridColor },
      },
    },
  };

  const createGradient = (r, g, b) => {
    return (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;
      if (!chartArea) {
        return `rgba(${r}, ${g}, ${b}, 0.3)`;
      }
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.15)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      return gradient;
    };
  };

  const chartBlockRewards = {
    labels: blocks.map((block) => block.height),
    datasets: [
      {
        label: `Rewards (${unit})`,
        data: blocks.map(
          (block) => (block.subsidy + block.totalfee) / 100000000
        ),
        borderColor: 'rgba(255, 140, 50, 1)',
        backgroundColor: createGradient(255, 140, 50),
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgba(255, 140, 50, 1)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
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
        borderColor: 'rgba(0, 255, 136, 1)',
        backgroundColor: createGradient(0, 255, 136),
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgba(0, 255, 136, 1)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        yAxisID: 'y1',
      },
      {
        label: `Block Value (${unit})`,
        data: blocks.map((block) => block.total_out / 100000000),
        borderColor: 'rgba(100, 200, 255, 1)',
        backgroundColor: createGradient(100, 200, 255),
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        hidden: true,
      },
    ],
  };

  const optionsBlockRewards = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        labels: {
          color: chartTheme.color,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(19, 22, 27, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#8b8d93',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
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
          color: chartTheme.color,
        },
        ticks: { color: chartTheme.color },
        grid: { color: chartTheme.gridColor },
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: `Value (${unit})`,
          color: chartTheme.color,
        },
        position: 'left',
        ticks: { color: chartTheme.color },
        grid: { color: chartTheme.gridColor },
      },
      y1: {
        type: 'linear',
        title: {
          display: true,
          text: 'Value (USD)',
          color: chartTheme.color,
        },
        position: 'right',
        ticks: { color: chartTheme.color },
        grid: { display: false },
      },
    },
    datasets: {
      line: {
        pointRadius: 0,
        borderWidth: 2,
      },
    },
  };

  // Calculate summary stats
  const totalBlocks = blocks.length;
  const avgReward = totalBlocks > 0 
    ? (blocks.reduce((sum, b) => sum + (b.subsidy + b.totalfee) / 100000000, 0) / totalBlocks).toFixed(4)
    : 0;
  const latestBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;

  return (
    <div className="w-screen h-screen overflow-hidden bg-[radial-gradient(ellipse_80%_50%_at_20%_10%,rgba(34,197,94,0.08)_0%,transparent_50%),radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(59,130,246,0.06)_0%,transparent_50%),radial-gradient(ellipse_50%_30%_at_50%_50%,rgba(168,85,247,0.04)_0%,transparent_50%)] bg-[#0d0f12]">
      {/* Main Content */}
      <main className="w-full h-screen overflow-y-auto px-8 py-6 flex flex-col gap-6">
        {/* Header */}
        <header className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-white m-0">Dashboard</h1>
            <p className="text-sm text-[#8b8d93] mt-1 mb-0">Real-time blockchain analytics</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {['24h', '3d', '1w', '1m'].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  timeRange === range
                    ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e] border-[#22c55e]'
                    : 'bg-transparent text-[#8b8d93] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-[rgba(19,22,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl backdrop-blur-xl flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(34,197,94,0.15)] text-[#22c55e]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-[#8b8d93]">Total Blocks</span>
              <span className="text-xl font-semibold text-white">{totalBlocks}</span>
            </div>
          </div>

          <div className="bg-[rgba(19,22,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl backdrop-blur-xl flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(249,115,22,0.15)] text-[#f97316]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-[#8b8d93]">Avg Reward</span>
              <span className="text-xl font-semibold text-white">{avgReward} {unit}</span>
            </div>
          </div>

          <div className="bg-[rgba(19,22,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl backdrop-blur-xl flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(59,130,246,0.15)] text-[#3b82f6]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-[#8b8d93]">Latest Block</span>
              <span className="text-xl font-semibold text-white">{latestBlock ? `#${latestBlock.height}` : '-'}</span>
            </div>
          </div>

          <div className="bg-[rgba(19,22,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl backdrop-blur-xl flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(168,85,247,0.15)] text-[#a855f7]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-[#8b8d93]">Time Range</span>
              <span className="text-xl font-semibold text-white">{timeRange.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Blocks Scroll Section */}
        <section id="blocks" className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white m-0">Recent Blocks</h2>
            <span className="bg-[rgba(34,197,94,0.15)] text-[#22c55e] text-xs font-medium px-2.5 py-1 rounded-xl">
              {blocks.length} blocks
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto py-4 px-1 -mx-1">
            {blocks
              .slice()
              .reverse()
              .map((block, index) => (
                <BlockItem key={index} block={block} />
              ))}
          </div>
        </section>

        {/* Charts Section */}
        <section id="charts" className="flex flex-col gap-4">
          <div className="flex flex-col gap-5">
            {/* Fee Rates Chart */}
            <div id="fee-rates" className="bg-[rgba(19,22,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl backdrop-blur-xl p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-base font-semibold text-white m-0 mb-1">Block Fee Rates</h3>
                  <p className="text-[13px] text-[#8b8d93] m-0">Fee rate distribution per block ({smallestUnit}/vB)</p>
                </div>
              </div>
              <Chart
                type="bar"
                data={chartBlockFeeRates}
                options={optionsBlockFeeRates}
              />
            </div>

            {/* Fees vs Subsidy Chart */}
            <div className="bg-[rgba(19,22,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl backdrop-blur-xl p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-base font-semibold text-white m-0 mb-1">Fees vs Subsidy</h3>
                  <p className="text-[13px] text-[#8b8d93] m-0">Block subsidy compared to transaction fees</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setView(unit)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      view === unit
                        ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e] border-[#22c55e]'
                        : 'bg-transparent text-[#8b8d93] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                    }`}
                  >
                    {unit}
                  </button>
                  <button
                    onClick={() => setView('Percentage')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      view === 'Percentage'
                        ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e] border-[#22c55e]'
                        : 'bg-transparent text-[#8b8d93] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
              <Chart
                type="bar"
                data={chartBlockFeeVsSubsidy}
                options={optionsBlockFeeVsSubsidy}
              />
            </div>

            {/* Rewards Chart */}
            <div id="rewards" className="bg-[rgba(19,22,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl backdrop-blur-xl p-6 lg:col-span-2">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-base font-semibold text-white m-0 mb-1">Block Rewards</h3>
                  <p className="text-[13px] text-[#8b8d93] m-0">Total miner rewards over time ({unit} and USD)</p>
                </div>
              </div>
              <Chart
                type="line"
                data={chartBlockRewards}
                options={optionsBlockRewards}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
