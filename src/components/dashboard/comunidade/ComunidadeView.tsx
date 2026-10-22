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
  Sparkles,
  MessageCircle,
  Reply,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { IHubCommunityPost } from '@/_base/interfaces/community';
import {
  listCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  updateCommunityPostReaction,
} from '@/_base/services/community';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { toast } from 'sonner';

interface RawReactionsMap {
  like: string[];
  heart: string[];
  star: string[];
  light: string[];
  [key: string]: string[];
}

interface PostDisplay {
  id: string;
  title?: string;
  author: string;
  avatar: string;
  institution: string;
  text: string;
  images: string[];
  timeAgo: string;
  reactions: { type: string; count: number; reacted: boolean }[];
  rawReactions: RawReactionsMap;
  comments: CommentDisplay[];
  userId?: string;
}

interface CommentDisplay {
  id: string;
  author: string;
  avatar: string;
  institution: string;
  text: string;
  timeAgo: string;
  reactions: { type: string; count: number; reacted: boolean }[];
  rawReactions: RawReactionsMap;
  replies: CommentDisplay[];
  userId?: string;
}

const reactionIcons: Record<string, { icon: typeof ThumbsUp; color: string; label: string }> = {
  like: { icon: ThumbsUp, color: 'text-blue-500', label: 'Curtir' },
  heart: { icon: Heart, color: 'text-red-500', label: 'Amei' },
  star: { icon: Star, color: 'text-yellow-500', label: 'Estrela' },
  light: { icon: Sparkles, color: 'text-amber-500', label: 'Inspirador' },
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

const formatTimeAgo = (dateStr: string | Date) => {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `há ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
  } catch {
    return 'recentemente';
  }
};

const ReactionBar = ({
  reactions,
  onReact,
}: {
  reactions: { type: string; count: number; reacted: boolean }[];
  onReact: (type: string) => void;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((r) => {
        const config = reactionIcons[r.type];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <motion.button
            key={r.type}
            whileTap={{ scale: 0.85 }}
            onClick={() => onReact(r.type)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
              r.reacted
                ? 'bg-primary/10 font-bold ' + config.color
                : 'text-muted-foreground hover:bg-accent/80'
            }`}
            title={config.label}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{r.count}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

const CommentItem = ({
  comment,
  currentUserId,
  onReact,
  onReply,
  onDelete,
}: {
  comment: CommentDisplay;
  currentUserId?: string;
  onReact: (id: string, type: string) => void;
  onReply: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
}) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className="space-y-2 overflow-hidden">
      <div className="flex gap-2 sm:gap-3">
        <div
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white sm:h-9 sm:w-9 sm:text-xs ${getAvatarColor(
            comment.author
          )}`}
        >
          {getInitials(comment.author)}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="glass-card !rounded-2xl overflow-hidden p-3 relative group">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-semibold text-primary">{comment.author}</p>
              {onDelete && (comment.userId === currentUserId || !comment.userId) && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                  title="Excluir resposta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex gap-2"
            >
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
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showReplies ? '▾' : '▸'} {comment.replies.length} resposta
                {comment.replies.length > 1 ? 's' : ''}
              </button>
              {showReplies &&
                comment.replies.map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    currentUserId={currentUserId}
                    onReact={onReact}
                    onReply={onReply}
                    onDelete={onDelete}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard = ({
  post,
  currentUserId,
  onReact,
  onComment,
  onCommentReact,
  onCommentReply,
  onDeletePost,
  onDeleteComment,
}: {
  post: PostDisplay;
  currentUserId?: string;
  onReact: (postId: string, type: string) => void;
  onComment: (postId: string, text: string) => void;
  onCommentReact: (postId: string, commentId: string, type: string) => void;
  onCommentReply: (postId: string, commentId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (commentId: string) => void;
}) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card !rounded-2xl max-w-full overflow-hidden"
    >
      <div className="flex items-center gap-2.5 p-3 pb-2 sm:gap-3 sm:p-4 sm:pb-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm ${getAvatarColor(
            post.author
          )}`}
        >
          {getInitials(post.author)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary">{post.author}</p>
          <p className="truncate text-xs text-muted-foreground">{post.institution}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">{post.timeAgo}</span>
          {(post.userId === currentUserId || !post.userId) && (
            <button
              onClick={() => onDeletePost(post.id)}
              className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
              title="Excluir postagem"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-2">
        {post.title && (
          <h2 className="text-base font-bold text-foreground tracking-tight">{post.title}</h2>
        )}
        <p className="whitespace-pre-wrap text-sm text-foreground">{post.text}</p>
      </div>

      {post.images.length > 0 && (
        <div
          className={`grid gap-1 px-3 pb-3 sm:px-4 sm:pb-4 ${
            post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {post.images.map((img, i) => (
            <div
              key={i}
              onClick={() => setExpandedImage(img)}
              className="overflow-hidden rounded-xl border border-border/40 cursor-pointer aspect-video bg-black/40"
            >
              <img
                src={img.startsWith('http') ? img : `https://hub-files-hml.s3.amazonaws.com/${img}`}
                alt=""
                className="h-full w-full object-cover transition-transform hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      <Dialog open={!!expandedImage} onOpenChange={(open) => !open && setExpandedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-border/40">
          {expandedImage && (
            <img
              src={expandedImage.startsWith('http') ? expandedImage : `https://hub-files-hml.s3.amazonaws.com/${expandedImage}`}
              alt="Visualização"
              className="w-full max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-2 border-t border-border/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <ReactionBar reactions={post.reactions} onReact={(type) => onReact(post.id, type)} />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments.length} comentários</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-border/30 bg-accent/20 p-3 sm:p-4 space-y-4">
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReact={(commentId, type) => onCommentReact(post.id, commentId, type)}
                onReply={(commentId, text) => onCommentReply(post.id, commentId, text)}
                onDelete={onDeleteComment}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="min-w-0 flex-1 rounded-full border border-border/50 bg-background/80 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm"
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
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const ComunidadeView = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<PostDisplay[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostText, setNewPostText] = useState('');
  const [newPostFiles, setNewPostFiles] = useState<File[]>([]);
  const [newPostPreviews, setNewPostPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'post' | 'comment'; id: string } | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // Map API post to display format
  const mapApiPostToDisplay = (apiPost: IHubCommunityPost, currentUserId?: string): PostDisplay => {
    const defaultReactions: RawReactionsMap = { like: [], heart: [], star: [], light: [] };
    const reactionsMap: RawReactionsMap = {
      ...defaultReactions,
      ...(apiPost.metadata?.reactions || {}),
    };

    const reactions = ['like', 'heart', 'star', 'light'].map((type) => {
      const userList = reactionsMap[type] || [];
      return {
        type,
        count: userList.length,
        reacted: currentUserId ? userList.includes(currentUserId) : false,
      };
    });

    const images = (apiPost.metadata?.media || []).map((m) => m.uri).filter(Boolean);

    const comments: CommentDisplay[] = (apiPost.replies || []).map((reply) => {
      const replyReactionsMap: RawReactionsMap = {
        ...defaultReactions,
        ...(reply.metadata?.reactions || {}),
      };

      const replyReactions = ['like', 'heart', 'star', 'light'].map((type) => {
        const uList = replyReactionsMap[type] || [];
        return {
          type,
          count: uList.length,
          reacted: currentUserId ? uList.includes(currentUserId) : false,
        };
      });

      const nestedReplies: CommentDisplay[] = (reply.replies || []).map((subReply) => {
        const subMap: RawReactionsMap = {
          ...defaultReactions,
          ...(subReply.metadata?.reactions || {}),
        };

        return {
          id: subReply.id,
          author: (subReply.user as any)?.display_name || subReply.user?.name || 'Usuário PiCode',
          avatar: subReply.user?.avatar || '',
          institution: subReply.user?.username || 'PiCode',
          text: subReply.content,
          timeAgo: formatTimeAgo(subReply.created_at),
          rawReactions: subMap,
          reactions: ['like', 'heart', 'star', 'light'].map((type) => ({
            type,
            count: (subMap[type] || []).length,
            reacted: currentUserId ? (subMap[type] || []).includes(currentUserId) : false,
          })),
          replies: [],
          userId: subReply.hub_user_id,
        };
      });

      return {
        id: reply.id,
        author: (reply.user as any)?.display_name || reply.user?.name || 'Usuário PiCode',
        avatar: reply.user?.avatar || '',
        institution: reply.user?.username || 'PiCode',
        text: reply.content,
        timeAgo: formatTimeAgo(reply.created_at),
        rawReactions: replyReactionsMap,
        reactions: replyReactions,
        replies: nestedReplies,
        userId: reply.hub_user_id,
      };
    });

    return {
      id: apiPost.id,
      title: apiPost.title,
      author: (apiPost.user as any)?.display_name || apiPost.user?.name || 'Usuário PiCode',
      avatar: apiPost.user?.avatar || '',
      institution: apiPost.user?.username || 'PiCode',
      text: apiPost.content,
      images,
      timeAgo: formatTimeAgo(apiPost.created_at),
      reactions,
      rawReactions: reactionsMap,
      comments,
      userId: apiPost.hub_user_id,
    };
  };

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const apiPosts = await listCommunityPosts();
      if (apiPosts && apiPosts.length > 0) {
        setPosts(apiPosts.map((p) => mapApiPostToDisplay(p, user?.id)));
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Failed to load community posts:', err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user?.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files);
    setNewPostFiles((prev) => [...prev, ...selected]);

    selected.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setNewPostPreviews((prev) => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const handleAddPost = async () => {
    if (!newPostText.trim() && newPostFiles.length === 0) return;
    setIsSending(true);

    try {
      let uploadedMedia: { uri: string; label: string }[] = [];
      if (newPostFiles.length > 0) {
        const presigned = await Promise.all(
          newPostFiles.map((f) =>
            getPresignedUrl(f.type || 'image/png', 'community_posts').then((r) => ({ ...r, file: f }))
          )
        );
        await Promise.all(presigned.map(({ link, file }) => uploadFile(link, file)));
        uploadedMedia = presigned.map(({ path, file }) => ({ uri: path, label: file.name }));
      }

      const created = await createCommunityPost({
        title: newPostTitle.trim() || 'Publicação',
        content: newPostText,
        metadata: {
          media:
            uploadedMedia.length > 0
              ? uploadedMedia
              : newPostPreviews.map((p) => ({ uri: p, label: 'image' })),
        },
      });

      if (created?.id) {
        setPosts((prev) => [mapApiPostToDisplay(created, user?.id), ...prev]);
      } else {
        const localPost: PostDisplay = {
          id: Date.now().toString(),
          title: newPostTitle.trim() || undefined,
          author: user?.name || 'Eu',
          avatar: user?.avatar || '',
          institution: 'PiCode',
          text: newPostText,
          images: newPostPreviews,
          timeAgo: 'agora',
          rawReactions: { like: [], heart: [], star: [], light: [] },
          reactions: [
            { type: 'like', count: 0, reacted: false },
            { type: 'heart', count: 0, reacted: false },
            { type: 'star', count: 0, reacted: false },
            { type: 'light', count: 0, reacted: false },
          ],
          comments: [],
          userId: user?.id,
        };
        setPosts((prev) => [localPost, ...prev]);
      }

      toast.success('Publicação enviada com sucesso!');
      setNewPostTitle('');
      setNewPostText('');
      setNewPostFiles([]);
      setNewPostPreviews([]);
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Erro ao enviar publicação');
    } finally {
      setIsSending(false);
    }
  };

  const toggleReaction = async (postId: string, type: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost || !user?.id) return;

    const currentArray = targetPost.rawReactions[type] || [];
    const hasReacted = currentArray.includes(user.id);
    const updatedArray = hasReacted
      ? currentArray.filter((uid) => uid !== user.id)
      : [...currentArray, user.id];

    const updatedReactions: RawReactionsMap = {
      ...targetPost.rawReactions,
      [type]: updatedArray,
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              rawReactions: updatedReactions,
              reactions: p.reactions.map((r) =>
                r.type !== type
                  ? r
                  : {
                      ...r,
                      reacted: !hasReacted,
                      count: updatedArray.length,
                    }
              ),
            }
      )
    );

    try {
      await updateCommunityPostReaction({ id: postId, reactions: updatedReactions });
    } catch (err) {
      console.warn('Erro ao atualizar reação no servidor:', err);
    }
  };

  const addComment = async (postId: string, text: string) => {
    try {
      const createdReply = await createCommunityPost({
        content: text,
        hub_community_post_id: postId,
      }).catch(() => null);

      const c: CommentDisplay = {
        id: createdReply?.id || Date.now().toString(),
        author: user?.name || 'Eu',
        avatar: user?.avatar || '',
        institution: 'PiCode',
        text,
        timeAgo: 'agora',
        rawReactions: { like: [], heart: [], star: [], light: [] },
        reactions: [
          { type: 'like', count: 0, reacted: false },
          { type: 'heart', count: 0, reacted: false },
          { type: 'star', count: 0, reacted: false },
          { type: 'light', count: 0, reacted: false },
        ],
        replies: [],
        userId: user?.id,
      };

      setPosts((prev) => prev.map((p) => (p.id !== postId ? p : { ...p, comments: [...p.comments, c] })));
      toast.success('Comentário enviado!');
    } catch (err) {
      toast.error('Não foi possível enviar o comentário');
    }
  };

  const addReply = async (postId: string, commentId: string, text: string) => {
    try {
      const createdReply = await createCommunityPost({
        content: text,
        hub_community_post_id: commentId,
      }).catch(() => null);

      const reply: CommentDisplay = {
        id: createdReply?.id || Date.now().toString(),
        author: user?.name || 'Eu',
        avatar: user?.avatar || '',
        institution: 'PiCode',
        text,
        timeAgo: 'agora',
        rawReactions: { like: [], heart: [], star: [], light: [] },
        reactions: [
          { type: 'like', count: 0, reacted: false },
          { type: 'heart', count: 0, reacted: false },
          { type: 'star', count: 0, reacted: false },
          { type: 'light', count: 0, reacted: false },
        ],
        replies: [],
        userId: user?.id,
      };

      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                comments: p.comments.map((c) =>
                  c.id !== commentId ? c : { ...c, replies: [...c.replies, reply] }
                ),
              }
        )
      );
      toast.success('Resposta enviada!');
    } catch (err) {
      toast.error('Não foi possível responder');
    }
  };

  const toggleCommentReaction = async (postId: string, commentId: string, type: string) => {
    if (!user?.id) return;
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    let targetComment: CommentDisplay | undefined = targetPost.comments.find((c) => c.id === commentId);
    let isNested = false;

    if (!targetComment) {
      for (const c of targetPost.comments) {
        const found = c.replies.find((r) => r.id === commentId);
        if (found) {
          targetComment = found;
          isNested = true;
          break;
        }
      }
    }

    if (!targetComment) return;

    const currentArray = targetComment.rawReactions[type] || [];
    const hasReacted = currentArray.includes(user.id);
    const updatedArray = hasReacted
      ? currentArray.filter((uid) => uid !== user.id)
      : [...currentArray, user.id];

    const updatedReactions: RawReactionsMap = {
      ...targetComment.rawReactions,
      [type]: updatedArray,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                rawReactions: updatedReactions,
                reactions: c.reactions.map((r) =>
                  r.type !== type
                    ? r
                    : {
                        ...r,
                        reacted: !hasReacted,
                        count: updatedArray.length,
                      }
                ),
              };
            }
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id === commentId) {
                  return {
                    ...r,
                    rawReactions: updatedReactions,
                    reactions: r.reactions.map((rx) =>
                      rx.type !== type
                        ? rx
                        : {
                            ...rx,
                            reacted: !hasReacted,
                            count: updatedArray.length,
                          }
                    ),
                  };
                }
                return r;
              }),
            };
          }),
        };
      })
    );

    try {
      await updateCommunityPostReaction({ id: commentId, reactions: updatedReactions });
    } catch (err) {
      console.warn('Erro ao sincronizar reação de comentário:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    setDeleteConfirm(null);

    try {
      await deleteCommunityPost(id);
      if (type === 'post') {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success('Publicação excluída com sucesso!');
      } else {
        setPosts((prev) =>
          prev.map((p) => ({
            ...p,
            comments: p.comments
              .filter((c) => c.id !== id)
              .map((c) => ({
                ...c,
                replies: c.replies.filter((r) => r.id !== id),
              })),
          }))
        );
        toast.success('Resposta excluída com sucesso!');
      }
    } catch {
      toast.error('Erro ao excluir item');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-2xl space-y-4 overflow-x-hidden"
    >
      {/* Create Post Box */}
      <div className="glass-card !rounded-2xl space-y-3 overflow-hidden p-4 sm:p-5 border border-border/50">
        <input
          type="text"
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
          placeholder="Título da publicação (opcional)..."
          className="w-full text-sm font-semibold bg-transparent border-b border-border/40 pb-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 transition-colors"
        />

        <textarea
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="Compartilhe suas ideias, projetos ou dúvidas com a comunidade PiCode..."
          className="min-h-[90px] w-full resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none sm:min-h-[110px] sm:text-sm"
        />

        {newPostPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {newPostPreviews.map((img, i) => (
              <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <img src={img} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => {
                    setNewPostPreviews((prev) => prev.filter((_, idx) => idx !== i));
                    setNewPostFiles((prev) => prev.filter((_, idx) => idx !== i));
                  }}
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-accent/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
              <span>Fotos</span>
            </button>
          </div>

          <button
            onClick={handleAddPost}
            disabled={(!newPostText.trim() && newPostFiles.length === 0) || isSending}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:brightness-105 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Publicar</span>
          </button>
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="glass-card !rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Carregando postagens da comunidade...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card !rounded-2xl p-12 text-center text-muted-foreground text-sm">
          Nenhuma publicação encontrada. Seja o primeiro a compartilhar algo!
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onReact={toggleReaction}
            onComment={addComment}
            onCommentReact={toggleCommentReaction}
            onCommentReply={addReply}
            onDeletePost={(id) => setDeleteConfirm({ open: true, type: 'post', id })}
            onDeleteComment={(id) => setDeleteConfirm({ open: true, type: 'comment', id })}
          />
        ))
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm?.open}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="glass-card max-w-sm rounded-3xl border-border/50 p-6">
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Excluir {deleteConfirm?.type === 'post' ? 'publicação' : 'resposta'}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Esta ação não pode ser desfeita e removerá o item permanentemente da comunidade.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="rounded-2xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-2xl text-xs"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ComunidadeView;
