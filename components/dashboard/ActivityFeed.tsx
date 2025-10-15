'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'assignment' | 'praise' | 'point' | 'goal' | 'coupon';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      assignment: '📝',
      praise: '💝',
      point: '💰',
      goal: '🎯',
      coupon: '🎫',
    };
    return icons[type] || '📌';
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      assignment: 'bg-blue-100 text-blue-700',
      praise: 'bg-pink-100 text-pink-700',
      point: 'bg-yellow-100 text-yellow-700',
      goal: 'bg-green-100 text-green-700',
      coupon: 'bg-purple-100 text-purple-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-[500px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">최근 활동</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          전체 보기 →
        </button>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">최근 활동이 없습니다.</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: ko })}
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
