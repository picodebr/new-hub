import { useEffect, useState } from 'react';
import { ClassSkillChart } from '@/components/dashboard/turmas/ClassSkillChart';

export default function ExportPdfClassForms() {
  const [fullClassData, setFullClassData] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('pdf_export_data');
    if (data) {
      try {
        setFullClassData(JSON.parse(data));
      } catch (err) {
        console.error('Erro ao ler pdf_export_data:', err);
      }
      const timer = setTimeout(() => setIsReady(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!fullClassData.length) return null;

  return (
    <div className="p-6 bg-white min-h-screen text-slate-900 font-sans">
      {isReady && <div id="pdf-ready" style={{ display: 'none' }} />}

      {fullClassData.map((hubClass, index) => {
        const allEvaluations =
          hubClass?.form_links?.reduce((acc: any, form_link: any) => {
            const exams: any[] = [];
            form_link.student_relations?.forEach((studentRel: any) => {
              studentRel.questions?.forEach((q: any) => {
                exams.push({
                  category: form_link.form?.questions?.find((e: any) => e.id === q.question_id)?.title || 'Habilidade Desconhecida',
                  score: q.score,
                  student_id: studentRel.hub_user_id,
                  created_at: form_link.finished_at || new Date().toISOString(),
                });
              });
            });
            acc.push(...exams);
            return acc;
          }, []) || [];
        const uniqueSkills = Array.from(new Set(allEvaluations.map((e: any) => e.category))).filter(Boolean) as string[];

        return (
          <div
            key={`export-${hubClass.id || index}`}
            style={{
              pageBreakAfter: index === fullClassData.length - 1 ? 'auto' : 'always',
              breakAfter: index === fullClassData.length - 1 ? 'auto' : 'page',
            }}
            className="mb-8"
          >
            <h1 className="text-xl font-bold text-slate-800 pb-4">
              {hubClass.display_name} - Histórico de Avaliações
            </h1>

            {uniqueSkills.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {uniqueSkills.map((skillName) => {
                  const skillEvals = allEvaluations.filter((e: any) => e.category === skillName);
                  const dailyMap = new Map<string, { sum: number; count: number }>();

                  skillEvals.forEach((ev: any) => {
                    const exactDay = new Date(ev.created_at).toLocaleDateString('pt-BR');
                    const current = dailyMap.get(exactDay) || { sum: 0, count: 0 };
                    dailyMap.set(exactDay, {
                      sum: current.sum + Number(ev.score || 0),
                      count: current.count + 1,
                    });
                  });

                  const chartData = Array.from(dailyMap.entries())
                    .map(([date, { sum, count }]) => ({
                      date,
                      média: count > 0 ? Number((sum / count).toFixed(2)) : 0,
                    }))
                    .sort((a, b) => {
                      const [dA, mA, yA] = a.date.split('/').map(Number);
                      const [dB, mB, yB] = b.date.split('/').map(Number);
                      return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
                    });

                  return <ClassSkillChart key={skillName} skillName={skillName} data={chartData} />;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
