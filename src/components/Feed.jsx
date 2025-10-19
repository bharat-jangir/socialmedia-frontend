import { useEffect, useState, useMemo, memo, useCallback, useRef } from "react";
import {
  Avatar,
  Card,
  IconButton,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import StoryCircle from "./StoryCircle";
import PostCard from "./PostCard";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";
import ArticleIcon from "@mui/icons-material/Article";
import CreatePostModal from "./CreatePostModal";
import CreateReelsForm from "./CreateReelsForm";
import PostModal from "./PostModal";
import { useDispatch } from "react-redux";
import {
  getFeedPosts,
  getSavedPosts,
  getSavedPostIds,
} from "../state/Post/post.action";
import { useSelector } from "react-redux";
import { StorySkeleton, PostSkeleton, UploadSkeleton } from "./SkeletonLoader";

// dummy array to iterate over
const stories = [1, 2, 3, 4, 5];

const Feed = memo(function Feed({ feedType = "all" }) {
  const [open, setOpen] = useState(false);
  const [reelModalOpen, setReelModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const observerRef = useRef(null);

  const dispatch = useDispatch();
  const theme = useTheme();
  
  // Debug logging to track re-renders
  console.log("🔄 Feed component re-rendered with feedType:", feedType);

  function handleOpenCreatePostModel() {
    setOpen(true);
  }

  function handleOpenCreateReelModal() {
    setReelModalOpen(true);
  }

  // Remove comments selector - not needed in Feed component

  const handleCloseCreatePostModel = () => setOpen(false);
  const handleCloseCreateReelModal = () => setReelModalOpen(false);

  const handlePostClick = useCallback((post) => {
    setSelectedPost(post);
    setModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPost(null);
  };

  // Redux state for infinite scroll - simplified to prevent unnecessary re-renders
  const posts = useSelector((state) => state.post.posts);
  const postsLoading = useSelector((state) => state.post.loading);
  const loadingMore = useSelector((state) => state.post.loadingMore);
  const hasMore = useSelector((state) => state.post.hasMore);
  const currentPage = useSelector((state) => state.post.currentPage);

  // Load initial posts and saved post IDs
  useEffect(() => {
    console.log("🚀 Feed useEffect triggered! feedType:", feedType);
    dispatch(getFeedPosts({ page: 0, size: 10, feedType }));
    // Fetch saved post IDs (lightweight) to check which posts are saved
    dispatch(getSavedPostIds());
  }, [dispatch, feedType]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Infinite scroll observer - Fixed to prevent multiple calls
  const lastPostElementRef = useCallback(
    (node) => {
      if (postsLoading || loadingMore) return;

      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Only create observer if we have a node and more posts to load
      if (node && hasMore) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (
              entry.isIntersecting &&
              hasMore &&
              !loadingMore &&
              !postsLoading
            ) {
              console.log("Loading more posts - page:", currentPage + 1);
              dispatch(
                getFeedPosts({
                  page: currentPage + 1,
                  size: 10,
                  feedType,
                })
              );
            }
          },
          {
            threshold: 0.1, // Trigger when 10% of the element is visible
            rootMargin: "100px", // Start loading 100px before the element comes into view
          }
        );

        observerRef.current.observe(node);
      }
    },
    [postsLoading, loadingMore, hasMore, currentPage, dispatch, feedType]
  );

  // Memoize posts list to prevent unnecessary re-renders
  const postsList = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    return posts.map((post, index) => {
      const isLastPost = index === posts.length - 1;
      return (
        <div
          key={post.id || index} // Use post.id as key for better performance
          ref={isLastPost ? lastPostElementRef : null} // Attach observer to last post
        >
          <PostCard post={post} onPostClick={handlePostClick} />
        </div>
      );
    });
  }, [posts, handlePostClick, lastPostElementRef]);

  return (
    <div className="w-full max-w-2xl mx-auto feed-container">
      {/* Posts section - Scrollable */}
      <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-5 feed-posts-container">
        {/* Upload section */}
        {postsLoading ? (
          <UploadSkeleton />
        ) : (
          <Card 
            className="p-3 sm:p-5 mt-3 sm:mt-5"
            sx={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <div className="flex justify-between items-center">
              <Avatar
                sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
              />
              <input
                readOnly
                onClick={handleOpenCreatePostModel}
                className="ml-3 sm:ml-5 h-8 sm:h-10 outline-none w-full rounded-full px-3 sm:px-5 cursor-text text-sm sm:text-base"
                style={{
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.primary,
                }}
                type="text"
                placeholder="Enter text..."
              />
            </div>
            <div className="flex justify-center space-x-6 sm:space-x-9 mt-3 sm:mt-5">
              <div className="flex items-center">
                <IconButton
                  color="primary"
                  onClick={handleOpenCreatePostModel}
                  size="small"
                >
                  <ImageIcon
                    sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
                  />
                </IconButton>
                <span className="text-xs sm:text-sm">media</span>
              </div>

              <div className="flex items-center">
                <IconButton
                  color="primary"
                  onClick={handleOpenCreateReelModal}
                  size="small"
                >
                  <VideocamIcon
                    sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
                  />
                </IconButton>
                <span className="text-xs sm:text-sm">reel</span>
              </div>

              <div className="flex items-center">
                <IconButton
                  color="primary"
                  onClick={handleOpenCreatePostModel}
                  size="small"
                >
                  <ArticleIcon
                    sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
                  />
                </IconButton>
                <span className="text-xs sm:text-sm">article</span>
              </div>
            </div>
          </Card>
        )}

        {postsLoading ? (
          // Show skeleton posts while loading
          Array.from({ length: 3 }).map((_, index) => (
            <PostSkeleton key={index} />
          ))
        ) : posts && posts.length > 0 ? (
          <>
            {postsList}
            {/* Loading more indicator */}
            {loadingMore && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
                <span 
                  className="ml-2"
                  style={{ color: theme.palette.text.secondary }}
                >
                  Loading more posts...
                </span>
              </Box>
            )}
            {/* End of posts indicator */}
            {!hasMore && posts.length > 0 && (
              <Box display="flex" justifyContent="center" py={2}>
                <span 
                  className="text-sm"
                  style={{ color: theme.palette.text.secondary }}
                >
                  You've reached the end!
                </span>
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
              color: theme.palette.text.secondary,
            }}
          >
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              No posts available
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.disabled, textAlign: "center" }}
            >
              Be the first to share something!
            </Typography>
          </Box>
        )}
      </div>
      <div>
        <CreatePostModal open={open} handleClose={handleCloseCreatePostModel} />
        <CreateReelsForm
          open={reelModalOpen}
          handleClose={handleCloseCreateReelModal}
        />
        <PostModal
          open={modalOpen}
          onClose={handleCloseModal}
          post={selectedPost}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return prevProps.feedType === nextProps.feedType;
});

export default Feed;
