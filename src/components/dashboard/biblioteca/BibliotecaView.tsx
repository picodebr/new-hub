import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap, Puzzle, Search, Play, Download, Video, Loader2 } from 'lucide-react';
import { IHubBook, IHubBookCategory } from '@/_base/interfaces/book';
import { IHubVideo, IHubVideoCategory } from '@/_base/interfaces/video';
import { listBookCategories } from '@/_base/services/book';
import { listVideoCategories } from '@/_base/services/video';
import { formatClassGrade, sortGrades } from '@/_base/utils';
import PdfReader from './PdfReader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const tabIcons: Record<string, React.ReactNode> = {
  aluno: <GraduationCap className="w-4 h-4" />,
  professor: <BookOpen className="w-4 h-4" />,
  complementar: <Puzzle className="w-4 h-4" />,
};

const BibliotecaView = () => {
  const [searchParams] = useSearchParams();
  const autoBookId = searchParams.get('id');

  const [bookCategories, setBookCategories] = useState<IHubBookCategory[]>([]);
  const [videoCategories, setVideoCategories] = useState<IHubVideoCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<IHubBook | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<IHubVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const [bookRes, videoRes] = await Promise.all([
          listBookCategories().catch(() => ({ results: [] as IHubBookCategory[] })),
          listVideoCategories().catch(() => ({ results: [] as IHubVideoCategory[] })),
        ]);

        if (isMounted) {
          const books = Array.isArray(bookRes) ? bookRes : (bookRes?.results || (bookRes as any)?.data || []);
          const videos = Array.isArray(videoRes) ? videoRes : (videoRes?.results || (videoRes as any)?.data || []);
          setBookCategories(books);
          setVideoCategories(videos);


          if (books.length > 0) {
            // Check if there's an autoBookId to select
            let foundBook: IHubBook | null = null;
            let foundCatId = books[0].id;

            if (autoBookId) {
              for (const cat of books) {
                const b = (cat.books || []).find((item) => item.id === autoBookId);
                if (b) {
                  foundBook = b;
                  foundCatId = cat.id;
                  break;
                }
              }
            }

            setActiveCategoryId(foundCatId);
            if (foundBook) {
              setSelectedBook(foundBook);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load library categories:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [autoBookId]);

  const hasRealData = bookCategories.length > 0;

  // Active book category
  const activeBookCategory = useMemo(() => {
    return bookCategories.find((cat) => cat.id === activeCategoryId) || bookCategories[0] || null;
  }, [bookCategories, activeCategoryId]);

  // Corresponding video category
  const activeVideoCategory = useMemo(() => {
    if (!activeBookCategory) return null;
    return videoCategories.find((v) => v.display_name === activeBookCategory.display_name) || null;
  }, [videoCategories, activeBookCategory]);

  // Group books by grade
  const booksByGrade = useMemo<Record<string, IHubBook[]>>(() => {
    if (!activeBookCategory?.books) return {};
    return activeBookCategory.books.reduce((acc, book) => {
      const grades = book.grades && book.grades.length > 0 ? book.grades : ['Geral'];
      grades.forEach((grade) => {
        if (!acc[grade]) acc[grade] = [];
        acc[grade].push(book);
      });
      return acc;
    }, {} as Record<string, IHubBook[]>);
  }, [activeBookCategory]);

  // Group videos by grade
  const videosByGrade = useMemo<Record<string, IHubVideo[]>>(() => {
    if (!activeVideoCategory?.videos) return {};
    return activeVideoCategory.videos.reduce((acc, video) => {
      const grades = video.grades && video.grades.length > 0 ? video.grades : ['Geral'];
      grades.forEach((grade) => {
        if (!acc[grade]) acc[grade] = [];
        acc[grade].push(video);
      });
      return acc;
    }, {} as Record<string, IHubVideo[]>);
  }, [activeVideoCategory]);

  // All distinct grades
  const availableGrades = useMemo(() => {
    const allGrades = Array.from(
      new Set([...Object.keys(booksByGrade), ...Object.keys(videosByGrade)])
    );
    return sortGrades(allGrades);
  }, [booksByGrade, videosByGrade]);

  return (
    <AnimatePresence mode="wait">
      {selectedBook ? (
        <PdfReader
          key="pdf-reader"
          book={selectedBook}
          onBack={() => setSelectedBook(null)}
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
                  Acesse seus livros, guias, vídeos e materiais didáticos
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
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm">Carregando acervo...</span>
            </div>
          ) : hasRealData ? (
            <div data-tour="biblioteca-tabs" className="glass-card !rounded-2xl p-1.5 inline-flex flex-wrap gap-1">
              {bookCategories.map((cat) => {
                const isActive = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    data-tour={`biblioteca-tab-${cat.id}`}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{cat.display_name}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Content */}
          {isLoading ? null : !hasRealData ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum material disponível na biblioteca no momento.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {availableGrades.map((grade) => {
                const books = (booksByGrade[grade] || []).filter((b) =>
                  b.title?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const videos = (videosByGrade[grade] || []).filter((v) =>
                  v.title?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (books.length === 0 && videos.length === 0) return null;

                return (
                  <motion.div
                    key={grade}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <h2 className="text-lg font-bold text-foreground">
                        {formatClassGrade(grade) || grade}
                      </h2>
                    </div>

                    {/* Books Grid */}
                    {books.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {books.map((book) => (
                          <motion.button
                            key={book.id}
                            whileHover={{ y: -4 }}
                            onClick={() => setSelectedBook(book)}
                            className="group text-left"
                          >
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 ring-1 ring-border/30 group-hover:ring-primary/40 transition-all duration-300 shadow-sm group-hover:shadow-lg bg-card">
                              {book.thumbnail ? (
                                <img
                                  src={book.thumbnail}
                                  alt={book.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-primary/5">
                                  <BookOpen className="w-8 h-8 text-primary/40 mb-2" />
                                  <span className="text-[11px] font-semibold text-foreground/80 line-clamp-3">
                                    {book.title}
                                  </span>
                                </div>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {book.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {book.description || 'Material pedagógico'}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Videos Grid */}
                    {videos.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Video className="w-3.5 h-3.5" />
                          <span>Vídeos de Apoio</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {videos.map((vid) => (
                            <motion.div
                              key={vid.id}
                              whileHover={{ y: -2 }}
                              onClick={() => setSelectedVideo(vid)}
                              className="glass-card !rounded-xl p-3 cursor-pointer group hover:border-primary/40 transition-all"
                            >
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-black/80 mb-2 flex items-center justify-center">
                                {vid.thumbnail ? (
                                  <img
                                    src={vid.thumbnail}
                                    alt={vid.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Play className="w-8 h-8 text-white/80 group-hover:scale-110 transition-transform" />
                                )}
                              </div>
                              <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {vid.title}
                              </h4>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Video Player Modal */}
          <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
            <DialogContent className="max-w-3xl glass-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  {selectedVideo?.title}
                </DialogTitle>
              </DialogHeader>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/90">
                {selectedVideo?.file ? (
                  <video
                    src={selectedVideo.file}
                    controls
                    autoPlay
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Vídeo indisponível
                  </div>
                )}
              </div>
              {selectedVideo?.description && (
                <p className="text-sm text-muted-foreground mt-2">{selectedVideo.description}</p>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BibliotecaView;
