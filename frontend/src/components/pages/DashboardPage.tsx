import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { HomePage } from './HomePage';
import { PostDetailModal } from '../modals/PostDetailModal';
import { Post } from '../../types';
import { feedService } from '../../services/feedService';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      console.log('📱 Screen width:', window.innerWidth, 'isMobile:', mobile);
      setIsMobile(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(-1);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  console.log('🎯 DashboardPage render - postId:', postId, 'isMobile:', isMobile);
  console.log('🎯 Posts loaded:', posts.length);

  const fetchPosts = async (tag?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await feedService.getFeedPosts(undefined, 20, tag || undefined);
      setPosts(response.posts || []);
      console.log('📊 DashboardPage fetched posts:', response.posts?.length || 0, 'posts');
      console.log('📊 Post IDs:', response.posts?.map(p => p._id || p.id) || []);
    } catch (error: any) {
      console.error('❌ API error fetching posts:', error);
      setError(error.response?.data?.message || 'Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tagParam = searchParams.get('tag');
    setSelectedTag(tagParam);
  }, [location.search]);

  useEffect(() => {
    console.log('🔄 Fetching posts for tag:', selectedTag);
    fetchPosts(selectedTag || undefined);
  }, [selectedTag]);

  useEffect(() => {
    console.log('🔍 Post modal useEffect - isMobile:', isMobile, 'postId:', postId, 'posts.length:', posts.length);
    
    if (!isMobile) {
      console.log('💻 Desktop mode - handling modal');
      console.log('💻 DashboardPage useEffect - postId:', postId);
      console.log('💻 Available posts:', posts.map(p => p._id || p.id));
      
      if (postId && posts.length > 0) {
        const post = posts.find(p => (p._id || p.id) === postId);
        console.log('💻 Found post:', post);
        
        if (post) {
          setSelectedPost(post);
          setCurrentPostIndex(posts.indexOf(post));
          console.log('💻 Post set, currentPostIndex:', posts.indexOf(post));
        } else {
          console.log('💻 Post not found, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        }
      } else if (!postId) {
        console.log('💻 No postId, clearing selected post');
        setSelectedPost(null);
        setCurrentPostIndex(-1);
      }
    } else {
      console.log('📱 Mobile mode - checking for redirect');
      if (postId) {
        console.log('📱 Mobile redirect to /post/' + postId);
        navigate(`/post/${postId}`, { replace: true });
      }
    }
  }, [postId, navigate, posts, isMobile]);

  const handlePostClick = (post: Post) => {
    console.log('🖱️ Post clicked:', post.id || post._id);
    console.log('🖱️ Full post object:', post);
    console.log('🖱️ Post _id:', post._id);
    console.log('🖱️ Post keys:', Object.keys(post));
    console.log('🖱️ isMobile:', isMobile);
    
    const postId = post._id || post.id;
    console.log('🖱️ Using postId:', postId);
    
    if (postId) {
      if (isMobile) {
        console.log('📱 Mobile navigation to /post/' + postId);
        console.log('📱 Passing post in state:', post.title);
        navigate(`/post/${postId}`, { state: { post } });
      } else {
        console.log('💻 Desktop navigation to /dashboard/post/' + postId);
        navigate(`/dashboard/post/${postId}`, { replace: false });
      }
    } else {
      console.error('❌ No valid ID found for post:', post);
    }
  };

  const handleCloseModal = () => {
    navigate('/dashboard', { replace: false });
  };

  const handlePreviousPost = () => {
    if (currentPostIndex > 0) {
      const previousPost = posts[currentPostIndex - 1];
      const postId = previousPost._id || previousPost.id;
      navigate(`/dashboard/post/${postId}`, { replace: true });
    }
  };

  const handleNextPost = () => {
    if (currentPostIndex < posts.length - 1) {
      const nextPost = posts[currentPostIndex + 1];
      const postId = nextPost._id || nextPost.id;
      navigate(`/dashboard/post/${postId}`, { replace: true });
    }
  };

  const handleEditPost = (post: Post) => {
    console.log('Edit post:', post);
  };

  const handlePostUpdate = (updatedPost: Partial<Post>) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        (post._id || post.id) === (updatedPost._id || updatedPost.id)
          ? { ...post, ...updatedPost }
          : post
      )
    );
    
    if (selectedPost && ((selectedPost._id || selectedPost.id) === (updatedPost._id || updatedPost.id))) {
      setSelectedPost({ ...selectedPost, ...updatedPost });
    }
  };

  const handleRetry = () => {
    fetchPosts(selectedTag || undefined);
  };

  const handleTagClick = (tag: string) => {
    console.log('🏷️ Tag clicked:', tag);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tag', tag);
    navigate(`/dashboard?${searchParams.toString()}`, { replace: true });
  };

  const handleClearTag = () => {
    console.log('🏷️ Clearing tag filter');
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('tag');
    const newSearch = searchParams.toString();
    navigate(`/dashboard${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  return (
    <>
      <HomePage 
        posts={posts}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        onPostClick={handlePostClick} 
        onEditPost={handleEditPost}
        onTagClick={handleTagClick}
        selectedTag={selectedTag}
        onClearTag={handleClearTag}
      />
      
      {/* Only show modal on desktop */}
      {!isMobile && selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={handleCloseModal}
          onPrevious={currentPostIndex > 0 ? handlePreviousPost : undefined}
          onNext={currentPostIndex < posts.length - 1 ? handleNextPost : undefined}
          hasPrevious={currentPostIndex > 0}
          hasNext={currentPostIndex < posts.length - 1}
          onPostUpdate={handlePostUpdate}
        />
      )}
    </>
  );
}; 