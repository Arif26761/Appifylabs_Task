"use client";
import { useEffect, useState, useRef } from "react";
import { api } from "../../api.js";
import "@/assets/css/bootstrap.min.css";
import "@/assets/css/common.css";
import "@/assets/css/main.css";
import "@/assets/css/responsive.css";
import "@/assets/css/feed-enhancements.css";  //added extra for better clearity on feeds 

export default function FeedPage() {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false); // skeleton / spinner
    const [uploadProgress, setUploadProgress] = useState(0);
    const loadPostsRef = useRef(null);

    loadPostsRef.current = async () => {
        setLoading(true);
        try {
        const res = await api.get("/posts");
        // defensive: ensure arrays exist
        const normalized = (res.data.posts || []).map(p => ({
            ...p,
            likes: p.likes || [],
            comments: (p.comments || []).map(c => ({
            ...c,
            likes: c.likes || [],
            replies: c.replies || []
            }))
        }));
        setPosts(normalized);
        } catch (err) {
        console.error("loadPosts error:", err);
        // show a tiny toast using browser alert fallback
        alert("Failed to load posts. See console.");
        } finally {
        setLoading(false);
        }
    };

    // expose for enhancements / infinite scroll fallback
    useEffect(() => {
        window.loadPosts = loadPostsRef.current;
    }, []);

    useEffect(() => {
        loadPostsRef.current();
    }, []);

    // ---- Create post with upload progress and preview ----
    const createPost = async () => {
        if (!content.trim() && !image) {
            return alert("Write something or attach an image.");
        }

        const fd = new FormData();
        fd.append("content", content);
        fd.append("isPrivate", String(isPrivate));
        if (image) fd.append("image", image); // must match backend multer key 'image'

        try {
            setUploadProgress(0);

            // IMPORTANT: don't set Content-Type here — let browser set boundary automatically
            const res = await api.post("/posts", fd, {
            // ensure axios instance has withCredentials:true (or pass here)
            withCredentials: true,
            onUploadProgress: (progressEvent) => {
                if (!progressEvent.total) return;
                const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(pct);
            },
            });

            // success handling: prefer server-returned post
            if (res?.data?.post) {
            setPosts(prev => [res.data.post, ...prev]);
            } else {
            await loadPostsRef.current();
            }

            // reset composer
            setContent("");
            setImage(null);
            setImagePreview(null);
            setIsPrivate(false);
            setUploadProgress(0);
        } catch (err) {
            console.error("createPost error:", err);

            // show helpful server info
            if (err.response) {
            // server responded (4xx / 5xx)
            const serverMsg = err.response.data?.message || JSON.stringify(err.response.data);
            alert("Server error: " + serverMsg);
            console.error("Server full response:", err.response.data);
            } else if (err.request) {
            // request made but no response
            alert("No response from server. Is backend running?");
            console.error("No response (request):", err.request);
            } else {
            // other client error
            alert("Error: " + err.message);
            }

            setUploadProgress(0);
        }
    };

    // ---- Like toggles: optimistic update (UI-first, rollback on failure) ----
    const toggleLike = async (targetType, targetId) => {
        // find item in posts/comments/replies and toggle locally
        const applyOptimistic = () => {
        setPosts(prev =>
            prev.map(post => {
            if (targetType === "POST" && post.id === targetId) {
                const liked = post._optimLiked ? false : true;
                const count = post.likes?.length || 0;
                return {
                ...post,
                _optimLiked: liked,
                likes: liked ? [...(post.likes || []), { __optim: true }] : (post.likes || []).slice(0, Math.max(0, count - 1))
                };
            }
            // comments
            const comments = (post.comments || []).map(c => {
                if (targetType === "COMMENT" && c.id === targetId) {
                const liked = c._optimLiked ? false : true;
                const count = c.likes?.length || 0;
                return { ...c, _optimLiked: liked, likes: liked ? [...(c.likes || []), { __optim: true }] : (c.likes || []).slice(0, Math.max(0, count - 1)) };
                }
                // replies
                const replies = (c.replies || []).map(r => {
                if (targetType === "REPLY" && r.id === targetId) {
                    const liked = r._optimLiked ? false : true;
                    const count = r.likes?.length || 0;
                    return { ...r, _optimLiked: liked, likes: liked ? [...(r.likes || []), { __optim: true }] : (r.likes || []).slice(0, Math.max(0, count - 1)) };
                }
                return r;
                });
                return { ...c, replies };
            });
            return { ...post, comments };
            })
        );
        };

        applyOptimistic();

        try {
        await api.post("/likes/toggle", { targetType, targetId });
        // sync from server instead of relying on optimistic forever
        loadPostsRef.current();
        } catch (err) {
        console.error("toggleLike error:", err);
        alert("Failed to toggle like");
        // rollback by reloading
        loadPostsRef.current();
        }
    };

    // ---- comment / reply with immediate UI feedback ----
    const addComment = async (postId, text) => {
        if (!text.trim()) return;
        try {
        // optimistic local add
        const tempId = `temp-${Date.now()}`;
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { id: tempId, content: text, author: { firstName: "You", lastName: "" }, replies: [], likes: [] }] } : p));
        await api.post("/comments", { postId, content: text });
        loadPostsRef.current();
        } catch (err) {
        console.error("addComment error:", err);
        alert("Failed to add comment");
        loadPostsRef.current();
        }
    };

    const addReply = async (commentId, text) => {
        if (!text.trim()) return;
        try {
        const tempId = `temp-${Date.now()}`;
        setPosts(prev => prev.map(post => ({
            ...post,
            comments: (post.comments || []).map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), { id: tempId, content: text, author: { firstName: "You", lastName: "" }, likes: [] }] } : c)
        })));
        await api.post("/replies", { commentId, content: text });
        loadPostsRef.current();
        } catch (err) {
        console.error("addReply error:", err);
        alert("Failed to add reply");
        loadPostsRef.current();
        }
    };

    // ---- image input helpers ----
    const onImageChange = (e) => {
        const f = e.target.files?.[0] ?? null;
        setImage(f);
        if (f) {
        const url = URL.createObjectURL(f);
        setImagePreview(url);
        // revoke later
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
        setImagePreview(null);
        }
    };

    // small skeleton UI while loading
    const renderSkeletons = () => (
        <>
        <div className="skeleton-card feed-skeleton" style={{height:140}} />
        <div className="skeleton-card feed-skeleton" style={{height:140}} />
        <div className="skeleton-card feed-skeleton" style={{height:140}} />
        </>
    );

    return (
        <div className="_layout _layout_main_wrapper">
        <div className="container _custom_container">
            {/* Post composer */}
            <div className="_feed_inner_text_area _padd_b24 _feed_inner_area">
            <textarea
                className="form-control"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                // Enter submits, Shift+Enter newline
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    createPost();
                }
                }}
            />
            <div className="d-flex gap-3 mt-2 align-items-center">
                <input type="file" onChange={onImageChange} />
                {imagePreview && <img src={imagePreview} className="_image-preview" alt="preview" />}
                <label className="d-flex align-items-center gap-1">
                <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Private
                </label>
                <button className="_btn1" onClick={createPost}>
                {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Post"}
                </button>
            </div>

            {uploadProgress > 0 && (
                <div style={{marginTop:8, background:"#eef2ff", borderRadius:6, overflow:"hidden"}}>
                <div className="_upload_progress" style={{width:`${uploadProgress}%`}} />
                </div>
            )}
            </div>

            {/* Feed list */}
            <div className="_feed_post_list">
            {loading ? renderSkeletons() : posts.map((p) => (
                <PostCard
                key={p.id}
                post={p}
                onLike={() => toggleLike("POST", p.id)}
                onComment={addComment}
                onReply={addReply}
                onLikeItem={toggleLike}
                />
            ))}
            </div>
        </div>
        </div>
    );
    }

    /* ---------- PostCard (unchanged structure, enhanced behavior) ---------- */
    function PostCard({ post, onLike, onComment, onReply, onLikeItem }) {
        const [commentText, setCommentText] = useState("");
        const postDate = new Date(post.createdAt).toLocaleString();

        return (
            <div className="_feed_inner_area _mar_t20 p-3" style={{border:"1px solid #eee"}} data-post-id={post.id}>
            <div className="d-flex justify-content-between">
                <div>
                <b>{post.author.firstName} {post.author.lastName}</b>
                {post.isPrivate && <span className="ms-2 badge bg-secondary">Private</span>}
                </div>
                <small className="meta-row">{postDate}</small>
            </div>

            <p className="mt-2">{post.content}</p>
            {post.imageUrl && <img src={post.imageUrl} alt="" className="_feed_post_image" loading="lazy" />}

            <div className="mt-2 d-flex gap-2 align-items-center">
                <button onClick={onLike} className={post._optimLiked ? "liked like-hit" : ""}>
                Like ({post.likes?.length || 0})
                </button>
                <LikeListButton targetType="POST" targetId={post.id} />
            </div>

            {/* Comments */}
            <div className="mt-3">
                {(post.comments || []).map((c) => (
                <CommentBlock
                    key={c.id}
                    comment={c}
                    onReply={onReply}
                    onLikeItem={onLikeItem}
                />
                ))}

                <div className="d-flex gap-2 mt-2">
                <input
                    className="form-control"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!commentText.trim()) return;
                        onComment(post.id, commentText);
                        setCommentText("");
                    }
                    }}
                />
                <button onClick={() => {
                    if (!commentText.trim()) return;
                    onComment(post.id, commentText);
                    setCommentText("");
                }}>
                    Comment
                </button>
                </div>
            </div>
            </div>
        );
    }

    /* ---------- CommentBlock ---------- */
    function CommentBlock({ comment, onReply, onLikeItem }) {
    const [replyText, setReplyText] = useState("");

    return (
        <div className="mt-2 ps-2" style={{borderLeft:"2px solid #ddd"}}>
        <div>
            <b>{comment.author.firstName} {comment.author.lastName}</b>
            <p className={comment.content && comment.content.length > 280 ? "comment-collapsed" : ""}>{comment.content}</p>
        </div>

        <div className="d-flex gap-2">
            <button onClick={() => onLikeItem("COMMENT", comment.id)}>
            Like ({comment.likes?.length || 0})
            </button>
            <LikeListButton targetType="COMMENT" targetId={comment.id} />
        </div>

        {/* Replies */}
        <div className="mt-2 ps-3">
            {(comment.replies || []).map((r) => (
            <div key={r.id} className="mt-1">
                <b>{r.author.firstName} {r.author.lastName}</b>
                <p>{r.content}</p>
                <button onClick={() => onLikeItem("REPLY", r.id)}>
                Like ({r.likes?.length || 0})
                </button>
                <LikeListButton targetType="REPLY" targetId={r.id} />
            </div>
            ))}

            <div className="d-flex gap-2 mt-2">
            <input
                className="form-control"
                placeholder="Reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!replyText.trim()) return;
                    onReply(comment.id, replyText);
                    setReplyText("");
                }
                }}
            />
            <button onClick={() => {
                if (!replyText.trim()) return;
                onReply(comment.id, replyText);
                setReplyText("");
            }}>
                Reply
            </button>
            </div>
        </div>
        </div>
    );
    }

    /* ---------- LikeListButton (unchanged API usage but added defensive code) ---------- */
    function LikeListButton({ targetType, targetId }) {
    const [open, setOpen] = useState(false);
    const [likes, setLikes] = useState([]);

    const loadLikes = async () => {
        try {
        const res = await api.get(`/likes?targetType=${targetType}&targetId=${targetId}`);
        setLikes(res.data.likes || []);
        } catch (err) {
        console.error("loadLikes error:", err);
        alert("Failed to load likes");
        }
    };

    return (
        <div style={{position:"relative", display:"inline-block"}}>
        <button onClick={async () => {
            await loadLikes();
            setOpen(o => !o);
        }}>
            Who liked?
        </button>

        {open && (
            <div className="like-popover" style={{right:0, top:"110%"}}>
            {likes.length === 0 && <div>No likes yet</div>}
            {likes.map(l => (
                <div key={l.id}>
                {l.user.firstName} {l.user.lastName}
                </div>
            ))}
            </div>
        )}
        </div>
    );
}