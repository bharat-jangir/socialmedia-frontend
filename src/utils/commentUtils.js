/**
 * Utility functions for comment management with optimistic UI
 */

// Generate temporary ID for optimistic comments
export const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if an ID is temporary
export const isTempId = (id) => {
  return typeof id === 'string' && (id.startsWith('temp_') || id.startsWith('server_'));
};

// Check if an ID is null or invalid
export const isNullId = (id) => {
  return id === null || id === undefined || id === '';
};

// Generate server-side temporary ID for null responses
export const generateServerTempId = () => {
  return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create optimistic comment object
export const createOptimisticComment = (content, currentUser) => {
  const tempId = generateTempId();
  return {
    id: tempId,
    content: content,
    user: {
      id: currentUser.id,
      fname: currentUser.fname,
      lname: currentUser.lname,
      profileImage: currentUser.profileImage || currentUser.profilePicture,
    },
    totalLikes: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
    isOptimistic: true, // Flag to identify optimistic comments
    isPending: true,    // Flag to track pending state
  };
};

// Map temporary ID to real ID
export const mapTempToRealId = (tempId, realId, comments) => {
  return comments.map(comment => {
    if (comment.id === tempId) {
      return {
        ...comment,
        id: realId,
        isOptimistic: false,
        isPending: false,
      };
    }
    return comment;
  });
};

// Remove optimistic comment (for rollback)
export const removeOptimisticComment = (tempId, comments) => {
  return comments.filter(comment => comment.id !== tempId);
};

// Update comment status
export const updateCommentStatus = (commentId, status, comments) => {
  return comments.map(comment => {
    if (comment.id === commentId) {
      return {
        ...comment,
        isPending: status === 'pending',
        isOptimistic: status === 'optimistic',
      };
    }
    return comment;
  });
};

// Check if comment can be deleted (not pending)
export const canDeleteComment = (comment) => {
  return !comment.isPending && !comment.isOptimistic;
};

// Get display status for comment
export const getCommentDisplayStatus = (comment) => {
  if (comment.isPending) {
    return 'pending';
  }
  if (comment.isOptimistic) {
    return 'optimistic';
  }
  return 'confirmed';
};

// Store comment in localStorage
export const storeCommentInLocalStorage = (postId, comment) => {
  try {
    const existingComments = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]');
    const updatedComments = [comment, ...existingComments];
    localStorage.setItem(`comments_${postId}`, JSON.stringify(updatedComments));
    console.log("💾 Comment stored in localStorage:", comment.id);
    return true;
  } catch (error) {
    console.log("⚠️ Failed to store comment in localStorage:", error);
    return false;
  }
};

// Retrieve comments from localStorage
export const getCommentsFromLocalStorage = (postId) => {
  try {
    const comments = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]');
    console.log("📖 Retrieved comments from localStorage:", comments.length);
    return comments;
  } catch (error) {
    console.log("⚠️ Failed to retrieve comments from localStorage:", error);
    return [];
  }
};

// Remove comment from localStorage
export const removeCommentFromLocalStorage = (postId, commentId) => {
  try {
    const existingComments = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]');
    const updatedComments = existingComments.filter(comment => comment.id !== commentId);
    localStorage.setItem(`comments_${postId}`, JSON.stringify(updatedComments));
    console.log("🗑️ Comment removed from localStorage:", commentId);
    return true;
  } catch (error) {
    console.log("⚠️ Failed to remove comment from localStorage:", error);
    return false;
  }
};

// Process comment from API response (use real data only)
export const processCommentFromAPI = (comment) => {
  let processedComment = { ...comment };
  
  // Don't generate temp ID - use real API response only
  if (isNullId(comment.id)) {
    console.log("⚠️ API returned null ID - using as is, no temp ID generated");
    // Keep the null ID as is - don't generate temp ID
  }
  
  // Ensure required fields exist
  processedComment.isOptimistic = false;
  processedComment.isPending = false;
  
  return processedComment;
};
