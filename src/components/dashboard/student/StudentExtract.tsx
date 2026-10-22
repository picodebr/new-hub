import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Receipt, Wallet, Loader2 } from 'lucide-react';
import { getStudentExtract, IStudentExtract } from '@/_base/services/user';
import { formatCoin } from '@/_base/utils';

interface StudentExtractProps {
  balance?: number;
}

export const StudentExtract = ({ balance = 0 }: StudentExtractProps) => {
  const [extractList, setExtractList] = useState<IStudentExtract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentExtract()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setExtractList(data);
        } else {
          setExtractList([]);
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar extrato:', err);
        setExtractList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPositive = extractList
    .filter((e) => e.type === 'plus')
    .reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0);

  const totalNegative = extractList
    .filter((e) => e.type === 'minor')
    .reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card flex h-full flex-col overflow-hidden p-5 md:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <Receipt className="h-[18px] w-[18px] text-amber-500" />
          </div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Meu Extrato</h2>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Wallet className="h-3.5 w-3.5" />
          {formatCoin(balance)}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Recebido</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            +{formatCoin(totalPositive)}
          </p>
        </div>

        <div className="p-3 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center gap-1.5 mb-1 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Gasto</span>
          </div>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
            -{formatCoin(totalNegative)}
          </p>
        </div>
      </div>

      {/* Extract List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-64 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : extractList.length > 0 ? (
          extractList.map((t, i) => {
            const isPlus = t.type === 'plus';
            const val = parseFloat(t.value) || 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-3.5 py-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-sm"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isPlus ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {isPlus ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      isPlus
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isPlus ? '+' : '-'} {formatCoin(val)}
                  </span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground text-xs">
            Nenhuma transação encontrada
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StudentExtract;
