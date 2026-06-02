import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { availableTurmas, Turma } from './turmasData';
import TurmasList from './TurmasList';
import TurmaDetail from './TurmaDetail';
import AddTurmaDialog from './AddTurmaDialog';

const TurmasView = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [addedTurmaIds, setAddedTurmaIds] = useState<string[]>(
    availableTurmas.map(t => t.id)
  );
  const [showAddDialog, setShowAddDialog] = useState(false);

  const addedTurmas = availableTurmas.filter(t => addedTurmaIds.includes(t.id));

  const handleSelectTurma = (turma: Turma) => {
    setSelectedTurma(turma);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedTurma(null);
  };

  const handleToggleTurma = (id: string) => {
    setAddedTurmaIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = (selectAll: boolean) => {
    setAddedTurmaIds(selectAll ? availableTurmas.map(t => t.id) : []);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <TurmasList
            key="list"
            turmas={addedTurmas}
            onSelectTurma={handleSelectTurma}
            onAddTurma={() => setShowAddDialog(true)}
          />
        ) : selectedTurma ? (
          <TurmaDetail key="detail" turma={selectedTurma} onBack={handleBack} />
        ) : null}
      </AnimatePresence>

      <AddTurmaDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        allTurmas={availableTurmas}
        addedIds={addedTurmaIds}
        onToggle={handleToggleTurma}
        onToggleAll={handleToggleAll}
      />
    </>
  );
};

export default TurmasView;
