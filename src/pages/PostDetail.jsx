import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // AI Summary State
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    fetchSessionAndData();
  }, [id]);

  const fetchSessionAndData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postError) {
      navigate('/');
      return;
    }

    setPost(postData);
    setEditTitle(postData.title);
    setEditContent(postData.content || '');
    setEditImageUrl(postData.image_url || '');

    const { data: commentData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentData) setComments(commentData);
    setIsLoading(false);
  };

  // --- INTERACTION LOGIC ---
  const handleUpvote = async () => {
    const newUpvotes = post.upvotes + 1;
    setPost({ ...post, upvotes: newUpvotes });
    await supabase.from('posts').update({ upvotes: newUpvotes }).eq('id', id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: id, content: newComment, user_id: currentUser.id }])
      .select();

    if (!error && data) {
      setComments([...comments, data[0]]);
      setNewComment('');
    }
  };

  // --- CRUD LOGIC ---
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('posts')
      .update({ title: editTitle, content: editContent, image_url: editImageUrl })
      .eq('id', id);

    if (!error) {
      setPost({ ...post, title: editTitle, content: editContent, image_url: editImageUrl });
      setIsEditing(false);
    }
  };

  const handleDeletePost = async () => {
    const confirmDelete = window.confirm("Are you sure you want to scrap this post?");
    if (!confirmDelete) return;

    await supabase.from('posts').delete().eq('id', id);
    navigate('/');
  };

  // --- LLM GENERATION LOGIC ---
  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Compile data for the prompt
      const commentText = comments.map(c => c.content).join(" | ");
      const prompt = `
        You are an expert sports car forum moderator. Provide a brief, engaging summary of the following forum post and the community's reaction based on the comments and upvotes. 
        Title: ${post.title}
        Description: ${post.content || "No textual description provided."}
        Upvotes: ${post.upvotes}
        Comments: ${commentText || "No comments yet."}
      `;

      const result = await model.generateContent(prompt);
      setAiSummary(result.response.text());
    } catch (error) {
      console.error("Error generating summary:", error);
      setAiSummary("Engine stall: Failed to generate summary. Please check your API key.");
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) return <div className="text-center text-xl text-gray-400 mt-20">Loading Post...</div>;
  if (!post) return null;

  const isAuthor = currentUser && currentUser.id === post.user_id;

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8">
      {/* POST CONTAINER */}
      <div className="bg-carbon-light p-8 rounded-xl border border-carbon-lighter shadow-2xl">
        {isEditing ? (
          <form onSubmit={handleUpdatePost} className="space-y-4">
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-3 bg-carbon border border-gray-700 rounded text-white focus:border-racing-red outline-none" required />
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows="4" className="w-full p-3 bg-carbon border border-gray-700 rounded text-white focus:border-racing-red outline-none" />
            <input type="url" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="w-full p-3 bg-carbon border border-gray-700 rounded text-white focus:border-racing-red outline-none" />
            <div className="flex gap-4">
              <button type="submit" className="px-6 py-2 bg-racing-red text-white font-bold rounded hover:bg-racing-redHover">Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-500">Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-4xl font-bold text-white">{post.title}</h1>
              {isAuthor && (
                <div className="flex gap-3">
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-gray-400 hover:text-white transition">Edit</button>
                  <button onClick={handleDeletePost} className="text-sm font-bold text-racing-red hover:text-racing-redHover transition">Delete</button>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-400 mb-6">Posted on {new Date(post.created_at).toLocaleString()}</p>

            {post.content && <p className="text-lg text-gray-200 mb-6 whitespace-pre-wrap">{post.content}</p>}
            
            {post.image_url && <img src={post.image_url} alt="Post" className="w-full max-h-[500px] object-cover rounded-lg border border-gray-700 mb-6" />}

            <div className="border-t border-gray-700 pt-6 mt-6">
              <button onClick={handleUpvote} className="flex items-center gap-2 px-6 py-3 bg-carbon border border-racing-red text-racing-red font-bold rounded-lg hover:bg-racing-red hover:text-white transition group">
                <span className="text-xl group-hover:scale-125 transition-transform">🔥</span> 
                Upvote ({post.upvotes})
              </button>
            </div>
          </>
        )}
      </div>

      {/* AI SUMMARY SECTION */}
      <div className="bg-gradient-to-br from-carbon-lighter to-carbon border border-blue-900 rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-400">🤖</span> AI Pit Stop Summary
          </h3>
          {!aiSummary && (
            <button 
              onClick={handleGenerateSummary} 
              disabled={isSummarizing}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition disabled:opacity-50 text-sm"
            >
              {isSummarizing ? 'Analyzing Telemetry...' : 'Generate AI Summary'}
            </button>
          )}
        </div>
        {aiSummary && (
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap mt-4 p-4 bg-carbon rounded border border-gray-800">
            {aiSummary}
          </div>
        )}
      </div>

      {/* COMMENTS SECTION */}
      <div className="bg-carbon-light p-8 rounded-xl border border-carbon-lighter shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Comments ({comments.length})</h3>
        
        <div className="space-y-4 mb-8">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 bg-carbon rounded-lg border border-gray-800">
              <p className="text-gray-300">{comment.content}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date(comment.created_at).toLocaleString()}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-gray-500 italic">No comments yet. Be the first to rev the engine!</p>}
        </div>

        {currentUser ? (
          <form onSubmit={handleAddComment} className="flex gap-4">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Leave a comment..." className="flex-grow p-3 bg-carbon border border-gray-700 rounded text-white focus:outline-none focus:border-racing-red transition" required />
            <button type="submit" className="px-6 py-3 font-bold text-white bg-racing-red rounded hover:bg-racing-redHover transition">Post</button>
          </form>
        ) : (
          <p className="text-racing-red text-sm">You must be logged in to leave a comment.</p>
        )}
      </div>
    </div>
  );
}