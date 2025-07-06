import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CollectionsPage } from './CollectionsPage';
import { PostDetailModal } from '../modals/PostDetailModal';
import { Post } from '../../types';
import { bookmarkService } from '../../services/bookmarkService';

// Custom hook to detect mobile screen
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

export const CollectionsPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(-1);
  const [posts, setPosts] = useState<Post[]>([]);

  // Fetch bookmarked posts for modal navigation
  const fetchBookmarkedPosts = async () => {
    try {
      const response = await bookmarkService.getUserBookmarkedPosts(undefined, 50); // Get more for navigation
      setPosts(response.tweets || []);
    } catch (error) {
      console.error('Failed to fetch bookmarked posts for navigation:', error);
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchBookmarkedPosts();
  }, []);

  // Handle post modal based on URL - only for desktop
  useEffect(() => {
    // Only show modal on desktop screens
    if (!isMobile) {
      if (postId && posts.length > 0) {
        const post = posts.find(p => (p._id || p.id) === postId);
        
        if (post) {
          setSelectedPost(post);
          setCurrentPostIndex(posts.indexOf(post));
        } else {
          // Post not found, redirect to collections
          navigate('/saved', { replace: true });
        }
      } else if (!postId) {
        setSelectedPost(null);
        setCurrentPostIndex(-1);
      }
    } else {
      // On mobile, if there's a postId in saved route, redirect to dedicated post page
      if (postId) {
        navigate(`/post/${postId}`, { replace: true });
      }
    }
  }, [postId, navigate, posts, isMobile]);

  const handlePostClick = (post: Post) => {
    const postId = post._id || post.id;
    
    if (postId) {
      if (isMobile) {
        // On mobile, navigate to dedicated post page and pass post data in state
        navigate(`/post/${postId}`, { state: { post } });
      } else {
        // On desktop, show modal by updating URL
        navigate(`/saved/post/${postId}`, { replace: false });
      }
    }
  };

  const handleCloseModal = () => {
    // Navigate back to collections without the post ID
    navigate('/saved', { replace: false });
  };

  const handlePreviousPost = () => {
    if (currentPostIndex > 0) {
      const previousPost = posts[currentPostIndex - 1];
      const postId = previousPost._id || previousPost.id;
      navigate(`/saved/post/${postId}`, { replace: true });
    }
  };

  const handleNextPost = () => {
    if (currentPostIndex < posts.length - 1) {
      const nextPost = posts[currentPostIndex + 1];
      const postId = nextPost._id || nextPost.id;
      navigate(`/saved/post/${postId}`, { replace: true });
    }
  };

  const handleEditPost = (post: Post) => {
    console.log('Edit post:', post);
  };

  const handlePostUpdate = (updatedPost: Partial<Post>) => {
    // Update the specific post in the posts array
    setPosts(prevPosts => 
      prevPosts.map(post => 
        (post._id || post.id) === (updatedPost._id || updatedPost.id)
          ? { ...post, ...updatedPost }
          : post
      )
    );
    
    // Also update the selected post if it's the same post
    if (selectedPost && ((selectedPost._id || selectedPost.id) === (updatedPost._id || updatedPost.id))) {
      setSelectedPost({ ...selectedPost, ...updatedPost });
    }
  };

  const handleTagClick = (tag: string) => {
    // Navigate to dashboard with tag filter
    navigate(`/dashboard?tag=${tag}`, { replace: false });
  };

  return (
    <>
      <CollectionsPage 
        onPostClick={handlePostClick} 
        onEditPost={handleEditPost}
        onTagClick={handleTagClick}
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