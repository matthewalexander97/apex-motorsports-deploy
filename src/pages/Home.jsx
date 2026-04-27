import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at' or 'upvotes'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, created_at, upvotes')
      .order(sortBy, { ascending: false }); // Sorts highest to lowest / newest to oldest

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data);
    }
    setIsLoading(false);
  };

  // Filter posts based on the search query
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {/* Search and Sort Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-carbon-light p-4 rounded-xl border border-carbon-lighter shadow-lg">
        <input
          type="text"
          placeholder="Search posts by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/2 p-2 bg-carbon border border-gray-700 rounded text-white focus:outline-none focus:border-racing-red transition"
        />
        
        <div className="flex gap-2">
          <span className="text-gray-400 self-center mr-2 text-sm font-bold uppercase tracking-wider">Sort By:</span>
          <button 
            onClick={() => setSortBy('created_at')}
            className={`px-4 py-2 rounded font-bold transition ${sortBy === 'created_at' ? 'bg-racing-red text-white' : 'bg-carbon border border-gray-600 text-gray-400 hover:text-white'}`}
          >
            Newest
          </button>
          <button 
            onClick={() => setSortBy('upvotes')}
            className={`px-4 py-2 rounded font-bold transition ${sortBy === 'upvotes' ? 'bg-racing-red text-white' : 'bg-carbon border border-gray-600 text-gray-400 hover:text-white'}`}
          >
            Most Popular
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      {isLoading ? (
        <div className="text-center text-xl text-gray-400 mt-20">Loading Feed...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center text-xl text-gray-400 mt-20">No posts found in the garage.</div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <Link to={`/post/${post.id}`} key={post.id} className="block group">
              <div className="p-6 bg-carbon-light rounded-xl border border-carbon-lighter shadow-md hover:border-racing-red transition duration-300 relative overflow-hidden">
                {/* Red accent line on hover */}
                <div className="absolute top-0 left-0 w-1 h-full bg-racing-red transform -translate-x-full group-hover:translate-x-0 transition duration-300"></div>
                
                <div className="pl-4">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-racing-red transition">{post.title}</h3>
                  <div className="flex gap-6 text-sm text-gray-400 font-medium">
                    <span>🕒 {new Date(post.created_at).toLocaleString()}</span>
                    <span className="text-racing-red">🔥 {post.upvotes} Upvotes</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}