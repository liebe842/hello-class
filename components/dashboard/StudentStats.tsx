'use client';

interface StatItem {
  label: string;
  value: number;
  max: number;
  color: string;
}

interface StudentStatsProps {
  stats: StatItem[];
}

export default function StudentStats({ stats }: StudentStatsProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800">학생 순위 (포인트)</h3>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
        {stats.map((stat, index) => {
          const percentage = stat.max > 0 ? (stat.value / stat.max) * 100 : 0;

          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                <span className="text-sm font-bold text-gray-800">{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: stat.color,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">총 포인트:</span>
          <span className="font-bold text-gray-800">
            {stats.reduce((sum, stat) => sum + stat.value, 0)}P
          </span>
        </div>
      </div>
    </div>
  );
}
