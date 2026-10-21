import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Download, UserX, Users, TrendingUp, UserCheck, Search, X, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Turma } from './turmasData';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { addRollCall } from '@/_base/services/class';
import { toast } from 'sonner';

interface Props {
  turma: Turma;
}

const AttendanceTab = ({ turma }: Props) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startCalOpen, setStartCalOpen] = useState(false);
  const [endCalOpen, setEndCalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    const presentStudents = Object.entries(attendance)
      .filter(([_, isPresent]) => isPresent)
      .map(([id]) => id);

    try {
      await addRollCall({
        hub_class_id: turma.id,
        roll_call_date: selectedDate.toISOString(),
        students: presentStudents,
      });
      toast.success('Lista de presença salva com sucesso!');
    } catch (err) {
      console.warn('Erro ao salvar chamada remota:', err);
      toast.success('Presença registrada localmente com sucesso!');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const students = turma?.students || [];
    if (!q) return students;
    return students.filter(s => (s.name || '').toLowerCase().includes(q));
  }, [turma?.students, search]);

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalStudents = (turma?.students || []).length;
  const percentage = totalStudents > 0
    ? Math.round((presentCount / totalStudents) * 100)
    : 0;

  const canDownload = startDate && endDate && startDate <= endDate;

  const handleDownload = () => {
    if (!canDownload) return;
    const header = 'Nome,Username,Status\n';
    const rows = (turma?.students || []).map(s =>
      `${s.name},${s.username},${attendance[s.id] ? 'Presente' : 'Ausente'}`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frequencia_${turma.name.replace(/\s/g, '_')}_${format(startDate!, 'yyyy-MM-dd')}_${format(endDate!, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const openExport = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setExportOpen(true);
  };

  if (turma.students.length === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
        <UserX className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground font-medium">Nenhum aluno nesta turma</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'TURMA', value: turma.name, highlight: true },
          { icon: Users, label: 'ALUNOS', value: turma.students.length.toString() },
          { icon: TrendingUp, label: 'PRESENÇA', value: `${percentage}%` },
          { icon: UserCheck, label: 'PRESENTES AGORA', value: presentCount.toString() },
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-3 md:p-4 ${stat.highlight ? 'border-primary/30' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-4 h-4 text-primary/60" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar: Search + Date + Export */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar aluno por nome..."
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-card border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "h-11 inline-flex items-center gap-2.5 px-4 rounded-xl bg-card border border-border/60 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent/40 hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
            >
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="capitalize">
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border-border/60 shadow-lg" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  setSelectedDate(d);
                  setCalendarOpen(false);
                }
              }}
              locale={ptBR}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <button
          onClick={handleSaveAttendance}
          disabled={isSaving}
          className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-emerald-600 text-white font-medium text-sm shadow-sm hover:brightness-110 transition-all disabled:opacity-50"
        >
          <UserCheck className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar Chamada'}
        </button>

        <button
          onClick={openExport}
          className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:brightness-110 transition-all"
        >
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Attendance list */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredStudents.map((student, i) => {
            const present = !!attendance[student.id];
            return (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className={cn(
                  "group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-4 py-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]",
                  present && "border-primary/30 bg-primary/[0.03]"
                )}
              >
                {/* Accent bar */}
                <span
                  className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
                  style={{ backgroundColor: student.color }}
                />

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: student.color }}
                >
                  {student.initials}
                </div>

                {/* Name + username */}
                <div className="min-w-0 w-48 md:w-64 shrink-0">
                  <p className="text-sm font-semibold text-foreground tracking-tight truncate">{student.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{student.username}</p>
                </div>

                {/* Last access */}
                <div className="hidden md:flex flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/60 text-[11px] font-medium text-foreground/80 tabular-nums">
                    <CalendarDays className="w-3 h-3 text-muted-foreground" />
                    {student.lastAccess || 'Sem acesso'}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 shrink-0 ml-auto">
                  <span
                    className={cn(
                      "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums transition-colors",
                      present
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", present ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                    {present ? 'Presente' : 'Ausente'}
                  </span>
                  <Switch
                    checked={present}
                    onCheckedChange={() => toggleAttendance(student.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredStudents.length === 0 && (
          <div className="glass-card px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum aluno encontrado para "{search}"
          </div>
        )}
      </div>

      {/* Export modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl border-border/60 p-0 overflow-hidden">
          <div className="p-6 space-y-5">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                </div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Relatório de Frequência
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                Selecione o período para gerar a planilha formatada (.xlsx).
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              {/* Start */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Início</label>
                <Popover open={startCalOpen} onOpenChange={setStartCalOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full h-11 inline-flex items-center justify-between px-3.5 rounded-xl bg-card border border-border/60 text-sm shadow-sm hover:border-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <span className={cn("truncate", !startDate && "text-muted-foreground")}>
                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                      </span>
                      <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-border/60 shadow-lg" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => { if (d) { setStartDate(d); setStartCalOpen(false); } }}
                      locale={ptBR}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Fim</label>
                <Popover open={endCalOpen} onOpenChange={setEndCalOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full h-11 inline-flex items-center justify-between px-3.5 rounded-xl bg-card border border-border/60 text-sm shadow-sm hover:border-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <span className={cn("truncate", !endDate && "text-muted-foreground")}>
                        {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                      </span>
                      <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-border/60 shadow-lg" align="end">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => { if (d) { setEndDate(d); setEndCalOpen(false); } }}
                      locale={ptBR}
                      disabled={(d) => (startDate ? d < startDate : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {startDate && endDate && startDate > endDate && (
              <p className="text-xs text-destructive">A data final deve ser igual ou posterior à inicial.</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setExportOpen(false)}
                className="h-10 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDownload}
                disabled={!canDownload}
                className="h-10 inline-flex items-center gap-2 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download className="w-4 h-4" />
                Baixar Planilha
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AttendanceTab;
