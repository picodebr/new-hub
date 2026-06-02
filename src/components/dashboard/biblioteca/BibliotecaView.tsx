import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap, Puzzle, Search } from 'lucide-react';
import { bibliotecaData, Material } from './bibliotecaData';
import PdfReader from './PdfReader';

const tabIcons: Record<string, React.ReactNode> = {
  aluno: <GraduationCap className="w-4 h-4" />,
  professor: <BookOpen className="w-4 h-4" />,
  complementar: <Puzzle className="w-4 h-4" />,
};

const BibliotecaView = () => {
  const [activeTab, setActiveTab] = useState('aluno');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const currentTab = bibliotecaData.find((t) => t.id === activeTab);

  const filteredCollections = currentTab?.collections.map((col) => ({
    ...col,
    materials: col.materials.filter((m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((col) => col.materials.length > 0);

  return (
    <AnimatePresence mode="wait">
      {selectedMaterial ? (
        <PdfReader
          key="pdf-reader"
          material={selectedMaterial}
          onBack={() => setSelectedMaterial(null)}
        />
      ) : (
        <motion.div
          key="biblioteca-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Biblioteca</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse seus livros, guias e materiais didáticos
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Tabs */}
          <div data-tour="biblioteca-tabs" className="glass-card !rounded-2xl p-1.5 inline-flex gap-1">
            {bibliotecaData.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tour={`biblioteca-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {tabIcons[tab.id]}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Collections by year */}
          <div data-tour="biblioteca-books" className="space-y-8">
            {filteredCollections?.map((collection, colIndex) => (
              <motion.div
                key={collection.year}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIndex * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="glass-card !rounded-2xl p-5 md:p-6">
                  <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-primary" />
                    {collection.year}
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {collection.materials.map((material, i) => (
                      <motion.button
                        key={material.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        onClick={() => setSelectedMaterial(material)}
                        className="group text-left"
                      >
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 ring-1 ring-border/30 group-hover:ring-primary/40 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                          <img
                            src={material.cover}
                            alt={material.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="inline-block px-2 py-1 rounded-lg bg-primary/90 text-primary-foreground text-[10px] font-medium">
                              Abrir
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {material.title}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredCollections?.length === 0 && (
            <div className="glass-card !rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum material encontrado</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BibliotecaView;
