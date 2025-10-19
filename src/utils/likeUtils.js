// Utility functions for handling likes consistently across the app

/**
 * Check if a user has liked a post or comment
 * @param {Object} item - Post or comment object
 * @param {string|number} userId - Current user's ID
 * @returns {boolean} - Whether the user has liked the item
 */
export const isLikedByUser = (item, userId) => {
  if (!item || !userId || !Array.isArray(item.recentLikedBy)) {
    return false;
  }

  const validItems = item.recentLikedBy.filter((like) => like != null);
  
  // If it's an array of IDs (strings or numbers)
  if (validItems.every((like) => typeof like === 'string' || typeof like === 'number')) {
    return validItems.some((like) => String(like) === String(userId));
  }

  // If it's an array of objects with `id` property
  if (validItems.every((like) => like && typeof like === 'object' && like.id)) {
    return validItems.some((like) => String(like.id) === String(userId));
  }

  return false;
};

/**
 * Get the count of likes for a post or comment
 * @param {Object} item - Post or comment object
 * @returns {number} - Number of likes
 */
export const getLikeCount = (item) => {
  if (!item || typeof item.totalLikes !== 'number') {
    return 0;
  }

  return item.totalLikes;
};

/**
 * Create optimistic like state update
 * @param {Object} item - Post or comment object
 * @param {string|number} userId - Current user's ID
 * @param {boolean} isLiked - Whether the user is currently liking the item
 * @returns {Object} - Updated item with new like state
 */
export const createOptimisticLikeUpdate = (item, userId, isLiked) => {
  if (!item || !userId || typeof item.totalLikes !== 'number' || !Array.isArray(item.recentLikedBy)) {
    return item;
  }

  const currentTotalLikes = item.totalLikes;
  const currentRecentLikedBy = item.recentLikedBy.filter((like) => like != null);
  
  let newTotalLikes;
  let newRecentLikedBy;
  
  if (isLiked) {
    // Remove user from likes
    newRecentLikedBy = currentRecentLikedBy.filter((like) => {
      if (typeof like === 'string' || typeof like === 'number') {
        return String(like) !== String(userId);
      }
      if (like && typeof like === 'object' && like.id) {
        return String(like.id) !== String(userId);
      }
      return true;
    });
    newTotalLikes = Math.max(currentTotalLikes - 1, 0);
  } else {
    // Add user to likes
    const userAlreadyLiked = currentRecentLikedBy.some((like) => {
      if (typeof like === 'string' || typeof like === 'number') {
        return String(like) === String(userId);
      }
      if (like && typeof like === 'object' && like.id) {
        return String(like.id) === String(userId);
      }
      return false;
    });

    if (!userAlreadyLiked) {
      // Add user to recent liked by (keep only recent 5)
      newRecentLikedBy = [String(userId), ...currentRecentLikedBy].slice(0, 5);
      newTotalLikes = currentTotalLikes + 1;
    } else {
      newRecentLikedBy = currentRecentLikedBy;
      newTotalLikes = currentTotalLikes;
    }
  }

  return {
    ...item,
    totalLikes: newTotalLikes,
    recentLikedBy: newRecentLikedBy
  };
};

