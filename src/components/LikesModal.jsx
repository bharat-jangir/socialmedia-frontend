import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import { getPostLikes } from "../state/Post/likesComments.action";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", sm: "400px" },
  maxWidth: "400px",
  height: { xs: "80%", sm: "500px" },
  maxHeight: "500px",
  bgcolor: "background.paper",
  border: "none",
  outline: "none",
  borderRadius: 2,
  boxShadow: 24,
  display: "flex",
  flexDirection: "column",
};

function LikesModal({ open, onClose, postId, totalLikes }) {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);

  // Get likes from Redux state
  const likes = useSelector((state) => state.post.postLikes?.[postId]?.likes || []);
  const likesLoading = useSelector((state) => state.post.postLikes?.[postId]?.loading || false);

  // Load initial likes
  useEffect(() => {
    if (open && postId) {
      setCurrentPage(0);
      setHasMore(true);
      dispatch(getPostLikes({ postId, page: 0, size: 20 }));
    }
  }, [open, postId, dispatch]);

  // Infinite scroll observer
  const lastLikeElementRef = useCallback(
    (node) => {
      if (loadingMore || !hasMore) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !loadingMore) {
              console.log("Loading more likes - page:", currentPage + 1);
              setLoadingMore(true);
              dispatch(getPostLikes({ postId, page: currentPage + 1, size: 20 }))
                .then((result) => {
                  if (result.type.endsWith('fulfilled')) {
                    setCurrentPage(prev => prev + 1);
                    setHasMore(result.payload.hasNext);
                  }
                })
                .finally(() => {
                  setLoadingMore(false);
                });
            }
          },
          {
            threshold: 0.1,
            rootMargin: "100px",
          }
        );
        observerRef.current.observe(node);
      }
    },
    [loadingMore, hasMore, currentPage, postId, dispatch]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleProfileClick = (userId) => {
    // Navigate to user profile
    window.location.href = `/profile/${userId}`;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="likes-modal-title"
      aria-describedby="likes-modal-description"
    >
      <Box sx={style}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="h6" component="h2" id="likes-modal-title">
            Likes ({Math.max(0, totalLikes || 0)})
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Likes List */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 1,
          }}
        >
          {likesLoading && likes.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <CircularProgress />
            </Box>
          ) : likes.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                color: "text.secondary",
              }}
            >
              <Typography>No likes yet</Typography>
            </Box>
          ) : (
            likes.map((like, index) => {
              const isLastLike = index === likes.length - 1;
              return (
                <Box key={like.id || index}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 2,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                    onClick={() => handleProfileClick(like.user?.id || like.id)}
                    ref={isLastLike ? lastLikeElementRef : null}
                  >
                    <Avatar
                      src={like.user?.profileImage || like.profileImage}
                      sx={{ width: 40, height: 40, mr: 2 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {like.user?.fname || like.fname} {like.user?.lname || like.lname}
                      </Typography>
                      {/* <Typography variant="body2" color="text.secondary">
                        {like.user?.userBio || like.userBio || "No bio available"}
                      </Typography> */}
                    </Box>
                  </Box>
                  {index < likes.length - 1 && <Divider />}
                </Box>
              );
            })
          )}

          {/* Loading More */}
          {loadingMore && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
              }}
            >
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                Loading more likes...
              </Typography>
            </Box>
          )}

          {/* End of likes indicator */}
          {!hasMore && likes.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                You've reached the end!
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

export default LikesModal;
