'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AttendanceChartProps {
  present: number;
  absent: number;
  total: number;
}

export default function AttendanceChart({ present, absent, total }: AttendanceChartProps) {
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  const data = [
    { name: 'Present', value: present },
    { name: 'Remaining', value: absent },
  ];

  const COLORS = ['#4e73df', '#e8eaf6'];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">출석 현황</h3>
        <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 text-gray-800 font-medium">
          <option>전체 반</option>
          <option>1반</option>
          <option>2반</option>
          <option>3반</option>
        </select>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{percentage}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-around">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">출석</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{present}명</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
            <span className="text-sm text-gray-600">결석</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{absent}명</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">전체 학생:</span>
          <span className="font-bold text-gray-800">{total}명</span>
        </div>
      </div>
    </div>
  );
}
