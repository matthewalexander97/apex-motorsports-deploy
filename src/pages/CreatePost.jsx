import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Get the current logged-in user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to create a post.");
        return;
      }

      // 2. Insert the post into the database
      const { error } = await supabase
        .from('posts')
        .insert([
          { 
            title: title, 
            content: content || null, 
            image_url: imageUrl || null,
            user_id: user.id 
          }
        ]);

      if (error) throw error;

      // 3. Redirect back to the Home Feed upon success
      navigate('/');
      
    } catch (error) {
      alert("Error creating post: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-carbon-light rounded-xl shadow-2xl border border-carbon-lighter">
      <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-2">
        Park a New <span className="text-racing-red">Post</span>
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-300">Title (Required)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-carbon border border-gray-700 rounded text-white focus:outline-none focus:border-racing-red transition"
            placeholder="e.g., The new Porsche 911 GT3 RS is insane..."
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-300">Text Content (Optional)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="5"
            className="w-full p-3 bg-carbon border border-gray-700 rounded text-white focus:outline-none focus:border-racing-red transition resize-none"
            placeholder="Share your thoughts, specs, or lap times..."
          ></textarea>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-300">Image URL (Optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-3 bg-carbon border border-gray-700 rounded text-white focus:outline-none focus:border-racing-red transition"
            placeholder="https://example.com/my-car-image.jpg"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 font-bold text-white bg-racing-red rounded hover:bg-racing-redHover transition disabled:opacity-50"
        >
          {isSubmitting ? 'Revving up...' : 'Publish Post'}
        </button>
      </form>
    </div>
  );
}