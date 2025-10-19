import {
  Card,
  CardHeader,
  Avatar,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { red } from "@mui/material/colors";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import BookmarksOutlinedIcon from "@mui/icons-material/BookmarksOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import PropTypes from "prop-types";
import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { createComment, likePost, savePost, deletePost } from "../state/Post/post.action";
import LikesModal from "./LikesModal";
import CommentsModal from "./CommentsModal";

// Simple hook to get post data and save status - optimized to prevent unnecessary re-renders
const usePostData = (postId) => {
  return useSelector((state) => {
    const posts = state.post?.posts || [];
    const savedPostIds = state.post?.savedPostIds || [];
    const foundPost = posts.find((p) => p.id === postId);
    
    if (foundPost) {
      // Simple logic: if post ID is in saved array, it's saved
      const isSaved = savedPostIds.includes(String(postId));
      
      return {
        ...foundPost,
        isSaved: isSaved
      };
    }
    
    return null;
  }, (prev, next) => {
    // Custom comparison to only re-render when this specific post changes
    if (!prev && !next) return true;
    if (!prev || !next) return false;
    
    return (
      prev.id === next.id &&
      prev.totalLikes === next.totalLikes &&
      prev.totalComments === next.totalComments &&
      prev.isSaved === next.isSaved &&
      JSON.stringify(prev.recentLikedBy) === JSON.stringify(next.recentLikedBy)
    );
  });
};

const PostCard = memo(function PostCard({ post, onPostClick }) {
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.id;
  
  // Use custom hook to get only this specific post
  const postFromRedux = usePostData(post.id);
  
  // Create stable post object - only update when this specific post changes
  const latestPost = useMemo(() => {
    return postFromRedux || post;
  }, [postFromRedux, post]);
  
  // Use ref to track if this component should update
  const prevPostRef = useRef(latestPost);
  const shouldUpdate = useMemo(() => {
    const should = prevPostRef.current !== latestPost;
    if (should) {
      prevPostRef.current = latestPost;
    }
    return should;
  }, [latestPost]);

  if (!latestPost) {
    return (
      <div className="p-4 border rounded-md">
        <p className="text-gray-500">Post not available</p>
      </div>
    );
  }

  const [showComments, setShowComments] = useState(false);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Debug: Log when modal state changes
  useEffect(() => {
    console.log("📱 PostCard CommentsModal state changed:", commentsModalOpen, "for post:", latestPost?.id);
  }, [commentsModalOpen, latestPost?.id]);
  const dispatch = useDispatch();

  // Instagram-style like state - only recalculate when this post's likes change
  const likeState = useMemo(() => {
    const recentLikedBy = latestPost?.recentLikedBy || [];
    const totalLikes = latestPost?.totalLikes || 0;
    
    const isLiked = currentUserId ? recentLikedBy.some((like) => {
      if (typeof like === "object" && like.id) {
        return like.id === currentUserId;
      }
      return like === currentUserId;
    }) : false;
    
    return {
      isLiked,
      likeCount: totalLikes,
      recentLikedBy: recentLikedBy
    };
  }, [latestPost?.recentLikedBy, latestPost?.totalLikes, currentUserId]);

  // Instagram-style comments - only update when this post's comments change
  const comments = useMemo(() => latestPost?.comments || [], [latestPost?.comments]);

  // Optimized like handler with useCallback to prevent unnecessary re-renders
  const handleLike = useCallback(() => {
    dispatch(likePost(latestPost.id));
  }, [dispatch, latestPost.id]);

  // Simple save/unsave handler
  const handleSave = useCallback(() => {
    console.log(`Saving/Unsaving post ${latestPost.id}`);
    dispatch(savePost(latestPost.id));
  }, [dispatch, latestPost.id]);

  // Handle likes modal
  const handleLikesClick = useCallback(() => {
    setLikesModalOpen(true);
  }, []);

  // Handle comments modal
  const handleCommentsClick = useCallback(() => {
    setCommentsModalOpen(true);
  }, []);

  // Instagram-style comment handler with optimistic update
  const handleCreateComment = useCallback((content) => {
    if (!content.trim()) return;

    // Create optimistic comment object
    const optimisticComment = {
      id: `temp_${Date.now()}`, // Temporary ID
      content,
      user: {
        id: currentUserId,
        fname: currentUser?.fname || "You",
        lname: currentUser?.lname || "",
        profileImage: currentUser?.profileImage
      },
      createdAt: new Date().toISOString()
    };

    // Dispatch to backend - Redux will handle the real update
    const reqData = {
      postId: latestPost?.id,
      data: {
        content,
      },
    };
    dispatch(createComment(reqData));
  }, [dispatch, latestPost?.id, currentUserId, currentUser]);

  // Menu handlers
  const handleMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  // Delete handlers
  const handleDeleteClick = useCallback(() => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  }, [handleMenuClose]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!latestPost?.id || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const result = await dispatch(deletePost(latestPost.id));
      if (result.type.endsWith('fulfilled')) {
        console.log('Post deleted successfully');
        setDeleteDialogOpen(false);
      } else {
        console.error('Failed to delete post:', result.payload);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, latestPost?.id, isDeleting]);

  return (
    <Card className="">
      <CardHeader
        avatar={
          <Avatar
            src={latestPost?.user?.profileImage}
            sx={{ bgcolor: red[500] }}
            aria-label="recipe"
          >
            {latestPost?.user?.fname?.charAt(0) || "U"}
          </Avatar>
        }
        action={
          latestPost?.user?.id === currentUserId ? (
            <IconButton 
              aria-label="settings"
              onClick={handleMenuOpen}
            >
              <MoreVertIcon />
            </IconButton>
          ) : null
        }
        title={
          (latestPost?.user?.fname || "User") +
          " " +
          (latestPost?.user?.lname || "")
        }
        subheader={
          "@" +
          (latestPost?.user?.fname || "user").toLowerCase() +
          "_" +
          (latestPost?.user?.lname || "name").toLowerCase()
        }
      />

      {latestPost.image && (
        <div 
          className="relative w-full cursor-pointer" 
          style={{ aspectRatio: "16/9" }}
          onClick={() => onPostClick && onPostClick(latestPost)}
        >
          <CardMedia
            component="img"
            image={latestPost.image}
            alt="Post image"
            className="w-full h-full object-cover"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {latestPost.video && (
        <div 
          className="relative w-full cursor-pointer" 
          style={{ aspectRatio: "16/9" }}
          onClick={() => onPostClick && onPostClick(latestPost)}
        >
          <CardMedia
            component="video"
            src={latestPost.video}
            controls
            className="w-full h-full object-cover"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      <CardContent 
        className="cursor-pointer"
        onClick={() => onPostClick && onPostClick(latestPost)}
      >
        <Typography
          variant="body2"
          color="text.primary"
          className="whitespace-pre-wrap break-words"
          sx={{
            lineHeight: 1.5,
            fontSize: "0.95rem",
          }}
        >
          {latestPost?.caption || "No caption provided"}
        </Typography>
      </CardContent>

      <CardActions className="flex justify-between" disableSpacing>
        <div className="flex items-center">
          <div className="flex items-center">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
            >
              {likeState.isLiked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
            <span 
              className="text-sm text-gray-600 ml-1 cursor-pointer hover:underline"
              onClick={handleLikesClick}
            >
              {likeState.likeCount} likes
            </span>
          </div>

          {/* Recent liked users profiles */}
          {likeState.recentLikedBy && likeState.recentLikedBy.length > 0 && (
            <div className="flex items-center ml-3">
              <div className="flex -space-x-2">
                {likeState.recentLikedBy.slice(0, 3).map((user, index) => (
                  <Avatar
                    key={user.id || index}
                    src={user.profileImage}
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      border: '2px solid white',
                      fontSize: '0.6rem'
                    }}
                    title={`${user.fname} ${user.lname}`}
                  >
                    {user.fname?.charAt(0) || "U"}
                  </Avatar>
                ))}
                {likeState.recentLikedBy.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-gray-600">+{likeState.recentLikedBy.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              // setShowComments(!showComments);
              handleCommentsClick();
            }}
            className="ml-3"
          >
            <ChatBubbleIcon />
          </IconButton>
          <span 
            className="text-sm text-gray-600 ml-1 cursor-pointer hover:underline"
            onClick={handleCommentsClick}
          >
            {latestPost?.totalComments || 0} comments
          </span>

          <IconButton onClick={(e) => e.stopPropagation()} className="ml-3">
            <ShareIcon />
          </IconButton>
        </div>

        <IconButton 
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
        >
          {latestPost?.isSaved ? <BookmarksIcon /> : <BookmarksOutlinedIcon />}
        </IconButton>
      </CardActions>

      {showComments && (
        <section onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center space-x-5 mx-3 my-5">
            <Avatar src={currentUser?.profileImage} />
            <input
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleCreateComment(e.target.value);
                  e.target.value = "";
                }
              }}
              onClick={(e) => e.stopPropagation()}
              type="text"
              className="w-full outline-none bg-transparent border border-[#3b4054] rounded-full px-5 py-2"
              placeholder="Write a comment..."
            />
          </div>
          <Divider />
          <div className="mx-3 my-5 space-y-2 text-xs">
            {comments.map((comment, index) => (
              <div className="flex items-center space-x-5" key={comment.id || index}>
                <Avatar
                  sx={{ height: "2rem", width: "2rem", fontSize: ".8rem" }}
                >
                  {(comment?.user?.fname?.[0] || "U") +
                    (comment?.user?.lname?.[0] || "N")}
                </Avatar>
                <p>{comment?.content || ""}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <LikesModal
        open={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
        postId={latestPost?.id}
        totalLikes={likeState.likeCount}
      />
      
      <CommentsModal
        open={commentsModalOpen}
        onClose={() => {
          console.log("🔴 PostCard CommentsModal onClose called for post:", latestPost?.id);
          setCommentsModalOpen(false);
        }}
        postId={latestPost?.id}
        totalComments={latestPost?.totalComments || 0}
      />

      {/* Menu for post options */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Post
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Post
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Instagram-style comparison - only re-render if this specific post's data changes
  const prevPost = prevProps.post;
  const nextPost = nextProps.post;
  
  // If post IDs are different, definitely re-render
  if (prevPost?.id !== nextPost?.id) {
    return false;
  }
  
  // If it's the same post, only re-render if likes, comments, or saved status changed
  const prevTotalLikes = prevPost?.totalLikes || 0;
  const nextTotalLikes = nextPost?.totalLikes || 0;
  const prevTotalComments = prevPost?.totalComments || 0;
  const nextTotalComments = nextPost?.totalComments || 0;
  const prevRecentLikedBy = prevPost?.recentLikedBy || [];
  const nextRecentLikedBy = nextPost?.recentLikedBy || [];
  const prevIsSaved = prevPost?.isSaved;
  const nextIsSaved = nextPost?.isSaved;
  
  // Check if saved status changed
  if (prevIsSaved !== nextIsSaved) {
    return false; // Re-render needed
  }
  
  // Check if total likes changed
  if (prevTotalLikes !== nextTotalLikes) {
    return false; // Re-render needed
  }
  
  // Check if total comments changed
  if (prevTotalComments !== nextTotalComments) {
    return false; // Re-render needed
  }
  
  // Quick length check for recent liked by
  if (prevRecentLikedBy.length !== nextRecentLikedBy.length) {
    return false; // Re-render needed
  }
  
  // Deep comparison for recent liked by array
  const recentLikedByChanged = prevRecentLikedBy.some((like, index) => {
    const nextLike = nextRecentLikedBy[index];
    if (typeof like === 'object' && typeof nextLike === 'object') {
      return like.id !== nextLike.id;
    }
    return like !== nextLike;
  });
  
  // Only re-render if likes actually changed
  return !recentLikedByChanged;
});

PostCard.propTypes = {
  post: PropTypes.object.isRequired,
  onPostClick: PropTypes.func,
};

export default PostCard;
