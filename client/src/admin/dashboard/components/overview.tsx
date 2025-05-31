import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

// Detection success rate data (percentage of undetected sessions)
const data = [
  {
    name: 'Jan',
    success: 92,
    attempts: 120,
  },
  {
    name: 'Feb',
    success: 94,
    attempts: 150,
  },
  {
    name: 'Mar',
    success: 95,
    attempts: 180,
  },
  {
    name: 'Apr',
    success: 97,
    attempts: 200,
  },
  {
    name: 'May',
    success: 98,
    attempts: 220,
  },
  {
    name: 'Jun',
    success: 99,
    attempts: 250,
  },
  {
    name: 'Jul',
    success: 99.5,
    attempts: 300,
  },
  {
    name: 'Aug',
    success: 99.7,
    attempts: 320,
  },
  {
    name: 'Sep',
    success: 99.8,
    attempts: 350,
  },
  {
    name: 'Oct',
    success: 99.9,
    attempts: 380,
  },
  {
    name: 'Nov',
    success: 99.9,
    attempts: 400,
  },
  {
    name: 'Dec',
    success: 99.9,
    attempts: 450,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
          domain={[90, 100]}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Success Rate']}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Legend />
        <Bar
          name="Undetected Sessions"
          dataKey='success'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
