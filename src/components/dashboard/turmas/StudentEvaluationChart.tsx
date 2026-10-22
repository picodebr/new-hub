import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IHubFormClassUser } from '@/_base/interfaces/form/IHubFormClassUser';

interface StudentEvaluationChartProps {
  forms: IHubFormClassUser[];
  bgCard?: string;
  borderColor?: string;
  showLegend?: boolean;
}

const COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // emerald
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg p-2.5 shadow-md text-popover-foreground">
        <p className="text-xs font-semibold">{data.name}</p>
        <p className="text-sm font-bold mt-1 text-primary">
          {data.value?.toFixed ? data.value.toFixed(1) : data.value}
        </p>
      </div>
    );
  }
  return null;
};

export const StudentEvaluationChart: React.FC<StudentEvaluationChartProps> = ({ forms, showLegend = true }) => {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  const chartData = useMemo(() => {
    if (!forms || forms.length === 0) {
      return { data: [], questionsMap: new Map<string, { color: string; title: string }>() };
    }

    const questionsMap = new Map<string, { color: string; title: string }>();
    let colorIndex = 0;

    forms.forEach((form) => {
      form.hub_form_class?.form?.questions?.forEach((question) => {
        if (!questionsMap.has(question.id)) {
          questionsMap.set(question.id, {
            color: COLORS[colorIndex % COLORS.length],
            title: question.title,
          });
          colorIndex++;
        }
      });
    });

    const data = forms.map((form) => {
      const dataPoint: any = {
        date: new Date(form.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        }),
        timestamp: new Date(form.created_at).getTime(),
      };

      form.questions?.forEach((answer) => {
        dataPoint[answer.question_id] = answer.score;
      });

      return dataPoint;
    });

    data.sort((a, b) => a.timestamp - b.timestamp);

    return { data, questionsMap };
  }, [forms]);

  useEffect(() => {
    if (selectedQuestions.size === 0 && chartData.questionsMap.size > 0) {
      setSelectedQuestions(new Set(chartData.questionsMap.keys()));
    }
  }, [chartData.questionsMap.size]);

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const toggleAllQuestions = () => {
    if (selectedQuestions.size === chartData.questionsMap.size) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(chartData.questionsMap.keys()));
    }
  };

  if (chartData.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-card rounded-2xl border border-border/60 p-8 text-center">
        <p className="text-base font-semibold text-muted-foreground">Sem avaliações disponíveis</p>
        <p className="text-sm text-muted-foreground/80 mt-1">
          As avaliações aparecerão aqui quando forem registradas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-lg font-bold text-foreground">Desempenho em Avaliações</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Evolução das notas por questão ao longo do tempo
        </p>
      </div>

      {/* Filter categories */}
      <div className="bg-muted/40 border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Filtrar Categorias</span>
          <button
            type="button"
            onClick={toggleAllQuestions}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {selectedQuestions.size === chartData.questionsMap.size ? 'Limpar' : 'Todas'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {Array.from(chartData.questionsMap.entries()).map(([questionId, questionData]) => (
            <label
              key={questionId}
              className="flex items-center gap-2 cursor-pointer select-none text-xs text-foreground/80 hover:text-foreground"
            >
              <input
                type="checkbox"
                checked={selectedQuestions.has(questionId)}
                onChange={() => toggleQuestion(questionId)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-muted-foreground/30"
              />
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: questionData.color }}
              />
              <span className="truncate">{questionData.title}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '1rem', fontSize: '12px' }} />}
            {Array.from(chartData.questionsMap.entries()).map(([questionId, questionData]) =>
              selectedQuestions.has(questionId) ? (
                <Bar
                  key={questionId}
                  dataKey={questionId}
                  fill={questionData.color}
                  name={questionData.title}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              ) : null
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StudentEvaluationChart;
