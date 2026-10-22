import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Download,
  Users,
  TrendingUp,
  UserCheck,
  Search,
  X,
  FileSpreadsheet,
  Save,
  Loader2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  format,
  isWeekend,
  isAfter,
  startOfDay,
  differenceInMonths,
  eachDayOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Turma } from './turmasData';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { addRollCall } from '@/_base/services/class';
import { IHubClass } from '@/_base/interfaces/class';
import { toast } from 'sonner';

interface Props {
  turma: Turma;
  hubClass?: IHubClass | null;
}

const AttendanceTab = ({ turma, hubClass }: Props) => {
  const today = startOfDay(new Date());

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [search, setSearch] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize attendanceMap from real hub_class.roll_calls
  const effectiveClass = hubClass || turma.raw;
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string[]>>(() => {
    const initialMap: Record<string, string[]> = {};
    if (effectiveClass?.roll_calls) {
      effectiveClass.roll_calls.forEach((rollCall: any) => {
        const dateKey = rollCall.roll_call_date.split('T')[0];
        const studentIds = (rollCall.students_roll_calls || []).map(
          (studentCall: any) => studentCall.hub_user_id
        );
        initialMap[dateKey] = studentIds;
      });
    }
    return initialMap;
  });

  const dateKey = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const presentIds = attendanceMap[dateKey] ?? [];

  const studentsList = useMemo(() => {
    return effectiveClass?.students || turma.students || [];
  }, [effectiveClass?.students, turma.students]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return studentsList;
    return studentsList.filter((s: any) =>
      (s.name || s.display_name || '').toLowerCase().includes(q)
    );
  }, [studentsList, search]);

  const totalStudents = studentsList.length;
  const attendancePercent =
    totalStudents > 0 ? Math.round((presentIds.length / totalStudents) * 100) : 0;

  // Toggle single student presence
  const toggleAttendance = useCallback(
    (studentId: string) => {
      setAttendanceMap((prev) => {
        const current = [...(prev[dateKey] ?? [])];
        if (current.includes(studentId)) {
          current.splice(current.indexOf(studentId), 1);
        } else {
          current.push(studentId);
        }
        return { ...prev, [dateKey]: current };
      });
      setHasUnsavedChanges(true);
    },
    [dateKey]
  );

  // Manual save handler
  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      await addRollCall({
        hub_class_id: effectiveClass?.id || turma.id,
        roll_call_date: selectedDate.toISOString(),
        students: attendanceMap[dateKey] || [],
      });
      setHasUnsavedChanges(false);
      toast.success('Lista de presença salva com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar chamada remota:', err);
      toast.error('Erro ao sincronizar chamada com o servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save (2000ms)
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(async () => {
      try {
        await addRollCall({
          hub_class_id: effectiveClass?.id || turma.id,
          roll_call_date: selectedDate.toISOString(),
          students: attendanceMap[dateKey] || [],
        });
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Erro no auto-save da chamada:', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [attendanceMap, dateKey, hasUnsavedChanges, effectiveClass?.id, turma.id, selectedDate]);

  // Export to professional Excel (.xlsx) using xlsx library
  const handleExportXLSX = () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error('Selecione as datas de início e fim.');
      return;
    }

    const start = startOfDay(new Date(exportStartDate));
    const end = startOfDay(new Date(exportEndDate));

    if (start > end) {
      toast.error('A data inicial não pode ser posterior à data final.');
      return;
    }

    if (differenceInMonths(end, start) > 6) {
      toast.warning('O limite máximo para exportação do relatório é de 6 meses.');
      return;
    }

    // 1. Working days interval
    const daysInterval = eachDayOfInterval({ start, end }).filter((day) => !isWeekend(day));

    if (daysInterval.length === 0) {
      toast.warning('Nenhum dia útil encontrado no período selecionado.');
      return;
    }

    // 2. Header: ['Data', Aluno 1, Aluno 2, ...]
    const header = ['Data', ...studentsList.map((s: any) => s.name || s.display_name || 'Aluno')];

    // 3. Matrix rows: ['dd/MM/yyyy', 'P' | 'F', ...]
    const rows = daysInterval.map((day) => {
      const currentKey = format(day, 'yyyy-MM-dd');
      const presentInThisDay = attendanceMap[currentKey] || [];
      const rowData = [format(day, 'dd/MM/yyyy')];

      studentsList.forEach((s: any) => {
        rowData.push(presentInThisDay.includes(s.id) ? 'P' : 'F');
      });

      return rowData;
    });

    // 4. Generate Workbook
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chamada');

    // Auto-fit column widths
    const colWidths = header.map((h) => ({ wch: Math.max(h.length + 4, 12) }));
    worksheet['!cols'] = colWidths;

    // 5. Save file
    const safeName = (turma.name || 'Turma').replace(/[\s/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(workbook, `Chamada_${safeName}_Relatorio.xlsx`);

    setExportOpen(false);
    toast.success('Planilha Excel (.xlsx) gerada com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Turma
            </p>
            <p className="text-xl font-extrabold text-foreground mt-1 truncate max-w-[180px]">
              {turma.name}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Alunos
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{totalStudents}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Presença
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{attendancePercent}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Presentes Agora
            </p>
            <p className="text-2xl font-extrabold text-primary mt-1">{presentIds.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Date Picker Popover */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-sm font-semibold text-foreground shadow-sm transition-colors"
              >
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border border-border" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                disabled={(date) => isWeekend(date) || isAfter(startOfDay(date), today)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/80 bg-background text-xs font-medium focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-end">
          <button
            type="button"
            disabled={!hasUnsavedChanges || isSaving}
            onClick={handleSaveAttendance}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
              hasUnsavedChanges
                ? 'bg-primary text-primary-foreground hover:brightness-105 animate-pulse'
                : 'bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/50'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Salvar Chamada</span>
          </button>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-accent/60 text-foreground font-bold text-xs shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Relatório XLSX</span>
          </button>
        </div>
      </div>

      {/* Attendance List Table */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between text-xs font-bold text-muted-foreground">
          <div className="w-12 text-center">#</div>
          <div className="flex-1">Aluno</div>
          <div className="w-32 text-center">Último Acesso</div>
          <div className="w-28 text-right pr-4">Presença</div>
        </div>

        <div className="divide-y divide-border/40">
          {filteredStudents.map((student: any, idx: number) => {
            const isPresent = presentIds.includes(student.id);
            const lastAccessRaw = student.metadata?.last_access || student.lastAccess;
            const lastAccessFormatted = lastAccessRaw
              ? !isNaN(new Date(lastAccessRaw).getTime())
                ? format(new Date(lastAccessRaw), 'dd/MM/yy')
                : lastAccessRaw
              : '-';

            return (
              <div
                key={student.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  isPresent ? 'bg-primary/5' : 'hover:bg-accent/30'
                }`}
              >
                <div className="w-12 text-center text-xs font-mono font-bold text-muted-foreground">
                  {idx + 1}
                </div>

                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: student.color || 'hsl(var(--primary))' }}
                  >
                    {student.initials ||
                      (student.name || 'AL')
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.username || `@${student.id}`}
                    </p>
                  </div>
                </div>

                <div className="w-32 text-center text-xs font-medium text-muted-foreground">
                  {lastAccessFormatted}
                </div>

                <div className="w-28 flex items-center justify-end pr-4 gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isPresent ? 'text-primary' : 'text-muted-foreground/60'
                    }`}
                  >
                    {isPresent ? 'Presente' : 'Ausente'}
                  </span>
                  <Switch
                    checked={isPresent}
                    onCheckedChange={() => toggleAttendance(student.id)}
                  />
                </div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="p-12 text-center text-muted-foreground italic text-sm">
              Nenhum aluno encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Export Frequency Modal (.xlsx) */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Relatório de Frequência</DialogTitle>
                <DialogDescription>
                  Gere a planilha Excel (.xlsx) com a frequência diária dos alunos
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Data Inicial</label>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Data Final</label>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              * Apenas dias úteis serão incluídos na planilha. O intervalo máximo permitido é de 6 meses.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setExportOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExportXLSX}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:brightness-105"
            >
              <Download className="w-4 h-4" />
              Gerar Excel (.xlsx)
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceTab;
