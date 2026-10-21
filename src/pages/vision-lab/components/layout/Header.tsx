'use client';

import { useState, useRef } from 'react';
import { Rocket, Pencil, Check } from 'lucide-react';

export function VisionLabHeader() {
  const [projectName, setProjectName] = useState('Meu Projeto');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const confirmEdit = () => {
    setEditing(false);
    if (!projectName.trim()) setProjectName('Meu Projeto');
  };

  return (
    <header className="bg-white shadow-sm px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-20 relative">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="bg-[var(--color-vlab-pi-blue)] p-1.5 sm:p-2 rounded-xl text-white shadow-lg shadow-blue-200">
          <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-vlab-pi-blue)] tracking-tight leading-none">PiCode</h1>
          <p className="text-[0.65rem] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Vision Lab</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              ref={inputRef}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={confirmEdit}
              onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
              className="text-sm sm:text-base font-bold text-slate-700 border-b-2 border-[var(--color-vlab-pi-blue)] bg-transparent outline-none text-center w-40 sm:w-56"
              maxLength={40}
            />
            <button onClick={confirmEdit} className="text-[var(--color-vlab-pi-blue)] hover:opacity-70 transition-opacity">
              <Check className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm sm:text-base font-bold text-slate-700">{projectName}</span>
            <button onClick={startEdit} className="text-slate-400 hover:text-[var(--color-vlab-pi-blue)] transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
