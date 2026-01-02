import { Line, Bar } from 'react-chartjs-2';

const Chart = ({ type, data, options }) => {
  if (type === 'line') {
    return <Line data={data} options={options} />;
  }
  if (type === 'bar') {
    return <Bar data={data} options={options} />;
  }
  return null;
};

export default Chart;
