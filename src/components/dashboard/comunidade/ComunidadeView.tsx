import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Image as ImageIcon,
  X,
  Plus,
  ThumbsUp,
  Heart,
  Star,
  HandMetal,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Reply,
} from 'lucide-react';
import { initialPosts, initialStories, Post, Story, Reaction, Comment } from './comunidadeData';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const reactionIcons: Record<string, { icon: typeof ThumbsUp; color: string }> = {
  like: { icon: ThumbsUp, color: 'text-blue-500' },
  heart: { icon: Heart, color: 'text-red-500' },
  star: { icon: Star, color: 'text-yellow-500' },
  clap: { icon: HandMetal, color: 'text-green-500' },
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const getAvatarColor = (name: string) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500', 'bg-cyan-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const StoriesBar = ({
  stories,
  onAddStory,
  onViewStory,
}: {
  stories: Story[];
  onAddStory: () => void;
  onViewStory: (s: Story, index: number) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [stories.length]);

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background/90 shadow-md backdrop-blur transition-colors hover:bg-accent xl:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex flex-wrap gap-x-2 gap-y-3 py-2 sm:gap-x-3 xl:flex-nowrap xl:overflow-x-auto xl:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stories.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => (i === 0 ? onAddStory() : onViewStory(s, i))}
            className="flex w-[calc(25%-6px)] min-w-[60px] flex-col items-center gap-1.5 sm:w-[calc(20%-10px)] xl:w-auto xl:min-w-0 xl:flex-shrink-0"
          >
            <div
              className={`h-14 w-14 rounded-full p-[2.5px] sm:h-16 sm:w-16 ${
                i === 0
                  ? 'border-2 border-dashed border-primary'
                  : s.viewed
                    ? 'border-2 border-muted-foreground/30'
                    : 'bg-gradient-to-br from-primary via-blue-400 to-cyan-400'
              }`}
            >
              <div
                className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full ${getAvatarColor(s.author)} text-xs font-bold text-white`}
              >
                {i === 0 ? <Plus className="h-5 w-5" /> : getInitials(s.author)}
              </div>
            </div>
            <span className="w-full truncate text-center text-[10px] text-muted-foreground sm:text-[11px]">{s.author}</span>
          </motion.button>
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background/90 shadow-md backdrop-blur transition-colors hover:bg-accent xl:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const ReactionBar = ({ reactions, onReact }: { reactions: Reaction[]; onReact: (type: string) => void }) => (
  <div className="flex max-w-full flex-wrap items-center gap-1">
    {reactions.map((r) => {
      const cfg = reactionIcons[r.type];
      const Icon = cfg.icon;
      return (
        <button
          key={r.type}
          onClick={() => onReact(r.type)}
          className={`flex items-center gap-1 rounded-full px-1.5 py-1 text-[11px] font-medium transition-all sm:px-2.5 sm:text-xs ${
            r.reacted ? `bg-accent ${cfg.color}` : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{r.count}</span>
        </button>
      );
    })}
  </div>
);

const CommentItem = ({
  comment,
  onReact,
  onReply,
}: {
  comment: Comment;
  onReact: (id: string, type: string) => void;
  onReply: (id: string, text: string) => void;
}) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className="space-y-2 overflow-hidden">
      <div className="flex gap-2 sm:gap-3">
        <div
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white sm:h-9 sm:w-9 sm:text-xs ${getAvatarColor(comment.author)}`}
        >
          {getInitials(comment.author)}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="glass-card !rounded-2xl overflow-hidden p-3">
            <p className="truncate text-sm font-semibold text-primary">{comment.author}</p>
            <p className="truncate text-xs text-muted-foreground">{comment.institution}</p>
            <p className="mt-1.5 break-words text-sm text-foreground">{comment.text}</p>
          </div>

          <div className="mt-1.5 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{comment.timeAgo}</span>
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                <Reply className="h-3 w-3" /> Responder
              </button>
            </div>
            <ReactionBar reactions={comment.reactions} onReact={(type) => onReact(comment.id, type)} />
          </div>

          {showReply && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escreva uma resposta..."
                className="min-w-0 flex-1 rounded-full border border-border/50 bg-accent/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 sm:px-4 sm:text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyText.trim()) {
                    onReply(comment.id, replyText);
                    setReplyText('');
                    setShowReply(false);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (replyText.trim()) {
                    onReply(comment.id, replyText);
                    setReplyText('');
                    setShowReply(false);
                  }
                }}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-2 ml-1 space-y-3 overflow-hidden border-l-2 border-border/50 pl-3 sm:ml-2">
              <button onClick={() => setShowReplies(!showReplies)} className="text-xs text-muted-foreground hover:text-foreground">
                {showReplies ? '▾' : '▸'} {comment.replies.length} resposta{comment.replies.length > 1 ? 's' : ''}
              </button>
              {showReplies && comment.replies.map((r) => <CommentItem key={r.id} comment={r} onReact={onReact} onReply={onReply} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard = ({
  post,
  onReact,
  onComment,
  onCommentReact,
  onCommentReply,
}: {
  post: Post;
  onReact: (postId: string, type: string) => void;
  onComment: (postId: string, text: string) => void;
  onCommentReact: (postId: string, commentId: string, type: string) => void;
  onCommentReply: (postId: string, commentId: string, text: string) => void;
}) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card !rounded-2xl max-w-full overflow-hidden">
      <div className="flex items-center gap-2.5 p-3 pb-2 sm:gap-3 sm:p-4 sm:pb-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm ${getAvatarColor(post.author)}`}
        >
          {getInitials(post.author)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary">{post.author}</p>
          <p className="truncate text-xs text-muted-foreground">{post.institution}</p>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">{post.timeAgo}</span>
      </div>

      <div className="overflow-hidden px-3 pb-2 sm:px-4 sm:pb-3">
        <p className="break-words text-xs leading-relaxed text-foreground sm:text-sm">{post.text}</p>
      </div>

      {post.images.length > 0 && (
        <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.images.map((img, i) => (
            <img key={i} src={img} alt="" className="block h-36 w-full min-w-0 object-cover sm:h-56 md:h-64" onClick={() => setExpandedImage(img)} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border/30 p-3 pb-2 sm:p-4 sm:pb-3">
        <ReactionBar reactions={post.reactions} onReact={(type) => onReact(post.id, type)} />
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments.length} comentário{post.comments.length !== 1 ? 's' : ''}</span>
        </button>
      </div>

      <div className="flex gap-2 px-3 pb-3 sm:px-4">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Faça um comentário"
          className="min-w-0 flex-1 rounded-full border border-border/50 bg-accent/50 px-3 py-2 text-xs transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30 sm:px-4 sm:py-2.5 sm:text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && commentText.trim()) {
              onComment(post.id, commentText);
              setCommentText('');
            }
          }}
        />
        <button
          onClick={() => {
            if (commentText.trim()) {
              onComment(post.id, commentText);
              setCommentText('');
            }
          }}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 sm:h-10 sm:w-10"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {showComments && post.comments.length > 0 && (
        <div className="space-y-3 overflow-hidden px-3 pb-4 sm:px-4">
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-xs text-muted-foreground">
            Comentários <span className="text-[10px]">▾</span>
          </button>
          {post.comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onReact={(cId, type) => onCommentReact(post.id, cId, type)}
              onReply={(cId, text) => onCommentReply(post.id, cId, text)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-[95vw] !rounded-2xl border-none bg-black/90 p-0 overflow-hidden sm:max-w-3xl">
          {expandedImage && <img src={expandedImage} alt="" className="max-h-[85vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const StoryViewer = ({
  stories,
  startIndex,
  onClose,
}: {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}) => {
  const [index, setIndex] = useState(startIndex);
  const story = stories[index];

  const next = () => {
    if (index < stories.length - 1) setIndex(index + 1);
    else onClose();
  };
  const prev = () => {
    if (index > 0) setIndex(index - 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  if (!story) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] !rounded-2xl border-none bg-black p-0 overflow-hidden sm:max-w-md">
        <div className="relative overflow-hidden">
          <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
            {stories.map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                {i === index && (
                  <motion.div
                    key={`bar-${index}`}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                    className="h-full rounded-full bg-white"
                    onAnimationComplete={next}
                  />
                )}
                {i < index && <div className="h-full w-full rounded-full bg-white" />}
              </div>
            ))}
          </div>
          <div className="absolute left-3 top-5 z-10 flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(story.author)}`}>
              {getInitials(story.author)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{story.author}</p>
              <p className="text-[10px] text-white/60">{story.createdAt}</p>
            </div>
          </div>

          <img src={story.imageUrl} alt="" className="h-[60vh] w-full object-cover sm:h-[70vh]" />

          {/* Tap zones */}
          <button
            onClick={prev}
            className="absolute left-0 top-0 z-20 h-full w-1/3 cursor-pointer focus:outline-none"
            aria-label="Story anterior"
          />
          <button
            onClick={next}
            className="absolute right-0 top-0 z-20 h-full w-1/3 cursor-pointer focus:outline-none"
            aria-label="Próximo story"
          />

          {/* Visible arrows */}
          {index > 0 && (
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < stories.length - 1 && (
            <button
              onClick={next}
              className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ComunidadeView = () => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [stories] = useState<Story[]>(initialStories);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddPost = () => {
    if (!newPostText.trim() && newPostImages.length === 0) return;
    const post: Post = {
      id: Date.now().toString(),
      author: 'João Ênfáse',
      avatar: '',
      institution: 'Escola PiCode',
      text: newPostText,
      images: newPostImages,
      timeAgo: 'agora',
      reactions: [
        { type: 'like', count: 0, reacted: false },
        { type: 'heart', count: 0, reacted: false },
        { type: 'star', count: 0, reacted: false },
        { type: 'clap', count: 0, reacted: false },
      ],
      comments: [],
    };
    setPosts([post, ...posts]);
    setNewPostText('');
    setNewPostImages([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setNewPostImages((prev) => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const toggleReaction = (postId: string, type: string) => {
    setPosts((prev) => prev.map((p) => p.id !== postId ? p : {
      ...p,
      reactions: p.reactions.map((r) => r.type !== type ? r : { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 }),
    }));
  };

  const addComment = (postId: string, text: string) => {
    const c: Comment = {
      id: Date.now().toString(),
      author: 'João Ênfáse',
      avatar: '',
      institution: 'Escola PiCode',
      text,
      timeAgo: 'agora',
      reactions: [
        { type: 'like', count: 0, reacted: false },
        { type: 'heart', count: 0, reacted: false },
        { type: 'star', count: 0, reacted: false },
        { type: 'clap', count: 0, reacted: false },
      ],
      replies: [],
    };
    setPosts((prev) => prev.map((p) => (p.id !== postId ? p : { ...p, comments: [...p.comments, c] })));
  };

  const toggleCommentReaction = (postId: string, commentId: string, type: string) => {
    setPosts((prev) => prev.map((p) => p.id !== postId ? p : {
      ...p,
      comments: p.comments.map((c) => c.id !== commentId ? c : {
        ...c,
        reactions: c.reactions.map((r) => r.type !== type ? r : { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 }),
      }),
    }));
  };

  const addReply = (postId: string, commentId: string, text: string) => {
    const reply: Comment = {
      id: Date.now().toString(),
      author: 'João Ênfase',
      avatar: '',
      institution: 'Escola PiCode',
      text,
      timeAgo: 'agora',
      reactions: [
        { type: 'like', count: 0, reacted: false },
        { type: 'heart', count: 0, reacted: false },
        { type: 'star', count: 0, reacted: false },
        { type: 'clap', count: 0, reacted: false },
      ],
      replies: [],
    };
    setPosts((prev) => prev.map((p) => p.id !== postId ? p : {
      ...p,
      comments: p.comments.map((c) => c.id !== commentId ? c : { ...c, replies: [...c.replies, reply] }),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-2xl space-y-3 overflow-x-hidden sm:space-y-5"
    >
      <div className="glass-card !rounded-2xl overflow-hidden p-3 sm:p-4">
        <StoriesBar stories={stories} onAddStory={() => {}} onViewStory={(_s, i) => setStoryIndex(i - 1)} />
      </div>

      <div className="glass-card !rounded-2xl space-y-3 overflow-hidden p-3 sm:p-4">
        <textarea
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="Comece uma publicação"
          className="min-h-[80px] w-full resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none sm:min-h-[100px] sm:text-sm"
        />

        {newPostImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {newPostImages.map((img, i) => (
              <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <img src={img} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => setNewPostImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border/30 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-2">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent sm:px-3 sm:py-2 sm:text-xs"
            >
              <ImageIcon className="h-4 w-4 shrink-0" /> <span className="truncate">Anexar imagem</span>
            </button>
          </div>
          <button
            onClick={handleAddPost}
            disabled={!newPostText.trim() && newPostImages.length === 0}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <Send className="h-4 w-4" /> Enviar
          </button>
        </div>
      </div>

      <div className="space-y-4 overflow-x-hidden sm:space-y-5">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onReact={toggleReaction}
            onComment={addComment}
            onCommentReact={toggleCommentReaction}
            onCommentReply={addReply}
          />
        ))}
      </div>

      <AnimatePresence>
        {storyIndex !== null && (
          <StoryViewer stories={stories.slice(1)} startIndex={storyIndex} onClose={() => setStoryIndex(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ComunidadeView;
