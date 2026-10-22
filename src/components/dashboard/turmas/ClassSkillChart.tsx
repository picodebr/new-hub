import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export interface IDailySkillAverage {
  date: string;
  média: number;
}

interface IClassSkillChartProps {
  skillName: string;
  data: IDailySkillAverage[];
}

export const ClassSkillChart: React.FC<IClassSkillChartProps> = ({ skillName, data }) => {
  return (
    <div className="flex flex-col h-[300px] w-full p-4 rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm">
      <div
        className="font-bold text-sm text-foreground mb-3 pb-1 truncate"
        title={skillName}
      >
        {skillName}
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={{ stroke: '#A0AEC0' }} />
            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} axisLine={{ stroke: '#A0AEC0' }} />
            <Tooltip
              formatter={(value: any) => [`${Number(value).toFixed(2)}`, 'Média']}
              labelFormatter={(label) => `Data: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Bar
              dataKey="média"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={45}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ClassSkillChart;
