import { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { likePost, likeComment } from '../state/Post/post.action';
import { isLikedByUser, createOptimisticLikeUpdate, getLikeCount } from '../utils/likeUtils';

/**
 * Custom hook for managing like functionality with optimistic updates
 * @param {Object} item - Post or comment object
 * @param {string} type - 'post' or 'comment'
 * @returns {Object} - Like state and handlers
 */
export const useLike = (item, type = 'post') => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticState, setOptimisticState] = useState(null);
  const abortControllerRef = useRef(null);

  // Get current like state (optimistic or actual)
  const currentItem = optimisticState || item;
  const isLiked = isLikedByUser(currentItem, currentUser?.id);
  const likeCount = getLikeCount(currentItem);

  const handleLike = useCallback(async () => {
    if (!item || !currentUser?.id || isSubmitting) {
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsSubmitting(true);

    // Create optimistic update
    const optimisticUpdate = createOptimisticLikeUpdate(currentItem, currentUser.id, isLiked);
    setOptimisticState(optimisticUpdate);

    try {
      let result;
      if (type === 'post') {
        result = await dispatch(likePost(item.id));
      } else if (type === 'comment') {
        result = await dispatch(likeComment(item.id));
      }

      if (result.type.endsWith('fulfilled')) {
        // Success - clear optimistic state to use server data
        setOptimisticState(null);
      } else if (result.type.endsWith('rejected')) {
        // Failed - revert optimistic state
        setOptimisticState(null);
        console.error(`Error liking ${type}:`, result.payload);
      }
    } catch (error) {
      // Network error or other exception - revert optimistic state
      setOptimisticState(null);
      console.error(`Error liking ${type}:`, error);
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  }, [item, currentUser?.id, isLiked, isSubmitting, dispatch, type, currentItem]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isLiked,
    likeCount,
    isSubmitting,
    handleLike,
    cleanup
  };
};
