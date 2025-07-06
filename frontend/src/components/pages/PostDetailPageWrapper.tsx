import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { PostDetailPage } from './PostDetailPage';
import { mockPosts } from '../../data/mockPosts';
import { tweetService } from '../../services/tweetService';
import { Post } from '../../types';

export const PostDetailPageWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  const initialPost = (location.state as any)?.post as Post | undefined;
  const [post, setPost] = useState<Post | null>(initialPost || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    console.log('🔍 useEffect triggered with id:', id);
    
    if (!id) {
      console.log('❌ No id provided, returning early');
      return;
    }

    if (post) {
      console.log('✅ Post already set from initial state:', post.title);
      return;
    }

    const statePost = (location.state as any)?.post as Post | undefined;
    console.log('📦 State post from navigation:', statePost);
    
    if (statePost) {
      console.log('✅ Using post from navigation state:', statePost.title);
      setPost(statePost);
      return;
    }

    const mockPost = mockPosts.find(p => p._id === id || p.id === id);
    console.log('🎭 Searching mock posts for id:', id);
    console.log('🎭 Mock posts available:', mockPosts.map(p => ({ id: p.id, _id: p._id, title: p.title })));
    console.log('🎭 Found mock post:', mockPost);
    
    if (mockPost) {
      console.log('✅ Using mock post:', mockPost.title);
      setPost(mockPost as unknown as Post);
      return;
    }

    console.log('🌐 Fetching from API for id:', id);
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        console.log('⏳ Starting API fetch...');
        const response = await tweetService.getTweet(id);
        console.log('✅ API response:', response);
        setPost(response.data as unknown as Post);
      } catch (err: any) {
        console.error('❌ Failed to fetch post:', err);
        console.log('❌ Error details:', err.response?.data);
        setError(err.response?.data?.message || 'Post not found');
      } finally {
        setIsLoading(false);
        console.log('🏁 API fetch completed');
      }
    };

    fetchPost();
  }, [id, post]); // Added post as dependency

  const handleEditPost = (editedPost: Post) => {
    console.log('✏️ Edit post:', editedPost);
  };

  console.log('🎯 Rendering decision - isLoading:', isLoading, 'error:', error, 'post:', !!post);

  if (isLoading) {
    console.log('⏳ Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    console.log('❌ Rendering error state, redirecting to dashboard. Error:', error);
    return <Navigate to="/dashboard" replace />;
  }

  if (!post) {
    console.log('❌ No post found, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ Rendering PostDetailPage with post:', post.title);
  return <PostDetailPage post={post} onEditPost={handleEditPost} />;
}; 