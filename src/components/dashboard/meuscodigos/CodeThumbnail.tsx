import { useMemo } from 'react';

interface CodeThumbnailProps {
  lines: string[];
  variant?: 'card' | 'large';
}

const KEYWORDS = ['void', 'int', 'float', 'char', 'bool', 'if', 'else', 'for', 'while', 'return', 'true', 'false', '#include'];
const FUNCTIONS = ['setup', 'loop', 'pinMode', 'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite', 'Serial', 'begin', 'print', 'println', 'delay', 'attach', 'write'];

const tokenize = (line: string) => {
  // Comments first
  if (line.trim().startsWith('//')) {
    return [{ text: line, color: 'text-emerald-500/70 dark:text-emerald-400/70' }];
  }
  if (line.trim().startsWith('#')) {
    return [{ text: line, color: 'text-pink-500 dark:text-pink-400' }];
  }

  const tokens: { text: string; color: string }[] = [];
  // Split on word boundaries while keeping delimiters
  const parts = line.split(/(\s+|[(){};,.])/);
  for (const p of parts) {
    if (!p) continue;
    if (KEYWORDS.includes(p)) {
      tokens.push({ text: p, color: 'text-violet-500 dark:text-violet-400 font-semibold' });
    } else if (FUNCTIONS.includes(p)) {
      tokens.push({ text: p, color: 'text-sky-500 dark:text-sky-400' });
    } else if (/^\d+$/.test(p)) {
      tokens.push({ text: p, color: 'text-amber-500 dark:text-amber-400' });
    } else if (/^[A-Z_][A-Z0-9_]+$/.test(p)) {
      tokens.push({ text: p, color: 'text-rose-500 dark:text-rose-400' });
    } else if (/^\".*\"$/.test(p) || /^'.*'$/.test(p)) {
      tokens.push({ text: p, color: 'text-emerald-500 dark:text-emerald-400' });
    } else {
      tokens.push({ text: p, color: 'text-foreground/70' });
    }
  }
  return tokens;
};

const CodeThumbnail = ({ lines, variant = 'card' }: CodeThumbnailProps) => {
  const visibleLines = useMemo(() => lines.slice(0, variant === 'large' ? 10 : 7), [lines, variant]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {/* Editor top bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-background/50 backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-red-400/80" />
        <span className="w-2 h-2 rounded-full bg-amber-400/80" />
        <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-[9px] font-mono text-muted-foreground/70 truncate">main.ino</span>
      </div>

      {/* Code body */}
      <div className="px-2.5 py-2.5 space-y-0.5">
        {visibleLines.map((line, idx) => {
          const tokens = tokenize(line);
          return (
            <div key={idx} className="flex items-start gap-2 leading-tight">
              <span className="text-[9px] font-mono text-muted-foreground/40 w-3 text-right select-none flex-shrink-0">
                {idx + 1}
              </span>
              <div className="text-[10px] font-mono whitespace-pre overflow-hidden truncate flex-1">
                {tokens.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  tokens.map((t, i) => (
                    <span key={i} className={t.color}>{t.text}</span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 via-background/20 to-transparent pointer-events-none" />
    </div>
  );
};

export default CodeThumbnail;
