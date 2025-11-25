"use client";
import { useEffect, useState } from "react";
import { api } from "../../api.js";
import "@/assets/css/bootstrap.min.css";
import "@/assets/css/common.css";
import "@/assets/css/main.css";
import "@/assets/css/responsive.css";

export default function feed() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const loadPosts = async () => {
    const res = await api.get("/posts");
    setPosts(res.data.posts);
  };

  useEffect(() => { loadPosts(); }, []);

  const createPost = async () => {
    const fd = new FormData();
    fd.append("content", content);
    fd.append("isPrivate", String(isPrivate));
    if (image) fd.append("image", image);

    await api.post("/posts", fd);
    setContent("");
    setImage(null);
    setIsPrivate(false);
    loadPosts();
  };

  const toggleLike = async (targetType, targetId) => {
    await api.post("/likes/toggle", { targetType, targetId });
    loadPosts();
  };

  const addComment = async (postId, text) => {
    await api.post("/comments", { postId, content: text });
    loadPosts();
  };

  const addReply = async (commentId, text) => {
    await api.post("/replies", { commentId, content: text });
    loadPosts();
  };

  return (
    <div className="_layout _layout_main_wrapper">
      <div className="container _custom_container">
        {/* Post box */}
        <div className="_feed_inner_text_area _padd_b24 _feed_inner_area">
          <textarea
            className="form-control"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e)=>setContent(e.target.value)}
          />
          <div className="d-flex gap-3 mt-2 align-items-center">
            <input type="file" onChange={(e)=>setImage(e.target.files?.[0])} />
            <label className="d-flex align-items-center gap-1">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e)=>setIsPrivate(e.target.checked)}
              />
              Private
            </label>
            <button className="_btn1" onClick={createPost}>Post</button>
          </div>
        </div>

        {/* Feed list */}
        <div className="_feed_post_list">
          {posts.map((p) => (
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

function PostCard({ post, onLike, onComment, onReply, onLikeItem }) {
  const [commentText, setCommentText] = useState("");

  return (
    <div className="_feed_inner_area _mar_t20 p-3" style={{border:"1px solid #eee"}}>
      <div className="d-flex justify-content-between">
        <div>
          <b>{post.author.firstName} {post.author.lastName}</b>
          {post.isPrivate && <span className="ms-2 badge bg-secondary">Private</span>}
        </div>
        <small>{new Date(post.createdAt).toLocaleString()}</small>
      </div>

      <p className="mt-2">{post.content}</p>
      {post.imageUrl && <img src={post.imageUrl} alt="" style={{maxWidth:"100%"}} />}

      <div className="mt-2 d-flex gap-2 align-items-center">
        <button onClick={onLike}>
          Like ({post.likes.length})
        </button>
        <LikeListButton targetType="POST" targetId={post.id} />
      </div>

      {/* Comments */}
      <div className="mt-3">
        {post.comments.map((c) => (
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
            onChange={(e)=>setCommentText(e.target.value)}
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

function CommentBlock({ comment, onReply, onLikeItem }) {
  const [replyText, setReplyText] = useState("");

  return (
    <div className="mt-2 ps-2" style={{borderLeft:"2px solid #ddd"}}>
      <div>
        <b>{comment.author.firstName} {comment.author.lastName}</b>
        <p>{comment.content}</p>
      </div>

      <div className="d-flex gap-2">
        <button onClick={() => onLikeItem("COMMENT", comment.id)}>
          Like ({comment.likes.length})
        </button>
        <LikeListButton targetType="COMMENT" targetId={comment.id} />
      </div>

      {/* Replies */}
      <div className="mt-2 ps-3">
        {comment.replies.map((r) => (
          <div key={r.id} className="mt-1">
            <b>{r.author.firstName} {r.author.lastName}</b>
            <p>{r.content}</p>
            <button onClick={() => onLikeItem("REPLY", r.id)}>
              Like ({r.likes.length})
            </button>
            <LikeListButton targetType="REPLY" targetId={r.id} />
          </div>
        ))}

        <div className="d-flex gap-2 mt-2">
          <input
            className="form-control"
            placeholder="Reply..."
            value={replyText}
            onChange={(e)=>setReplyText(e.target.value)}
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

function LikeListButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false);
  const [likes, setLikes] = useState([]);

  const loadLikes = async () => {
    const res = await api.get(`/likes?targetType=${targetType}&targetId=${targetId}`);
    setLikes(res.data.likes);
  };

  return (
    <div>
      <button onClick={async ()=>{
        await loadLikes();
        setOpen(!open);
      }}>
        Who liked?
      </button>

      {open && (
        <div style={{background:"#fff", border:"1px solid #ddd", padding:8}}>
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