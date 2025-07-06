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


  const fetchPosts = async (tag?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await feedService.getFeedPosts(undefined, 20, tag || undefined);
      setPosts(response.posts || []);
    } catch (error: any) {
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
    fetchPosts(selectedTag || undefined);
  }, [selectedTag]);

  useEffect(() => {
    
    if (!isMobile) {
      
      if (postId && posts.length > 0) {
        const post = posts.find(p => (p._id || p.id) === postId);
        
        if (post) {
          setSelectedPost(post);
          setCurrentPostIndex(posts.indexOf(post));
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else if (!postId) {
        setSelectedPost(null);
        setCurrentPostIndex(-1);
      }
    } else {
      if (postId) {
        navigate(`/post/${postId}`, { replace: true });
      }
    }
  }, [postId, navigate, posts, isMobile]);

  const handlePostClick = (post: Post) => {
    const postId = post._id || post.id;
    
    if (postId) {
      if (isMobile) {
        navigate(`/post/${postId}`, { state: { post } });
      } else {
        navigate(`/dashboard/post/${postId}`, { replace: false });
      }
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
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tag', tag);
    navigate(`/dashboard?${searchParams.toString()}`, { replace: true });
  };

  const handleClearTag = () => {
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