import { useState } from "react";
import {
  Modal,
  Box,
  Avatar,
  IconButton,
  Button,
  Card,
  CardMedia,
  Typography,
} from "@mui/material";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { useDispatch } from "react-redux";
import { createPost } from "../state/Post/post.action";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 400 },
  maxWidth: { xs: "95vw", sm: 400 },
  maxHeight: { xs: "90vh", sm: "80vh" },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: { xs: 2, sm: 4 },
  borderRadius: ".6rem",
  outline: "none",
  overflow: "auto",
};

function CreatePostModal({ open, handleClose }) {
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");

  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      caption: "",
      image: "",
      video: "",
    },
    onSubmit: async (values) => {
      setIsSubmitting(true);
      console.log("Formik Values: ", values);
      console.log("Selected Image: ", selectedImage);
      console.log("Selected Video: ", selectedVideo);

      // Ensure we have the latest media values
      const postData = {
        caption: values.caption,
        image: selectedImage || values.image,
        video: selectedVideo || values.video,
      };

      console.log("Final Post Data: ", postData);

      try {
        await dispatch(createPost({ data: postData }));
        // Close modal after successful submission
        handleCloseModal();
      } catch (error) {
        console.error("Error creating post:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const user = useSelector((state) => state.auth.user);

  async function handleSelectMedia(e, mediaType) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setFileError("Please select an image or video file.");
      return;
    }
    
    // Check file size (50MB = 50 * 1024 * 1024 bytes)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setFileError("File size must be less than 50MB.");
      return;
    }
    
    // Clear any previous errors and media
    setFileError("");
    setSelectedImage(null);
    setSelectedVideo(null);
    formik.setFieldValue("image", "");
    formik.setFieldValue("video", "");
    setIsLoading(true);
    
    try {
      const uploadType = isImage ? "image" : "video";
      const mediaUrl = await uploadToCloudinary(file, uploadType);
      
      if (isImage) {
        setSelectedImage(mediaUrl);
        formik.setFieldValue("image", mediaUrl);
      } else {
        setSelectedVideo(mediaUrl);
        formik.setFieldValue("video", mediaUrl);
      }
    } catch (error) {
      setFileError(`Failed to upload ${isImage ? 'image' : 'video'}. Please try again.`);
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleRemoveMedia = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
    formik.setFieldValue("image", "");
    formik.setFieldValue("video", "");
    setFileError("");
  };

  const handleCloseModal = () => {
    // Clear all media when closing modal
    setSelectedImage(null);
    setSelectedVideo(null);
    setFileError("");
    setIsSubmitting(false);
    formik.resetForm();
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleCloseModal}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <form onSubmit={formik.handleSubmit}>
          <div>
            <div className="flex space-x-3 sm:space-x-4 items-center">
              <Avatar 
                key={user?.profileImage || 'default'} // Force re-render when image changes
                src={user?.profileImage}
                sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
              >
                {user?.fname?.charAt(0) || "U"}
              </Avatar>
              <div>
                <p className="font-bold text-sm sm:text-lg">
                  {user?.fname || "User"} {user?.lname || ""}
                </p>
                <p className="text-xs sm:text-sm">
                  @
                  {(user?.fname || "user").toLowerCase() +
                    "_" +
                    (user?.lname || "name").toLowerCase()}
                </p>
              </div>
            </div>
            <textarea
              className="outline-none w-full mt-3 sm:mt-5 p-2 bg-transparent border border-[#3b4054] rounded-sm text-sm sm:text-base"
              placeholder="write caption"
              name="caption"
              id=""
              onChange={formik.handleChange}
              value={formik.values.caption}
              rows="3"
            ></textarea>

            <div className="flex space-x-4 sm:space-x-5 items-center mt-3 sm:mt-5">
              <div className="flex flex-col items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSelectMedia(e, "image")}
                  style={{ display: "none" }}
                  id="image-input"
                />
                <label htmlFor="image-input">
                  <IconButton color="primary" component="span" size="small">
                    <ImageIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />
                  </IconButton>
                </label>
                <span className="text-xs sm:text-sm">Image</span>
              </div>

              <div className="flex flex-col items-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleSelectMedia(e, "video")}
                  style={{ display: "none" }}
                  id="video-input"
                />
                <label htmlFor="video-input">
                  <IconButton color="primary" component="span" size="small">
                    <VideoLibraryIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />
                  </IconButton>
                </label>
                <span className="text-xs sm:text-sm">Video (Max 50MB)</span>
              </div>
            </div>

            {/* Error Message */}
            {fileError && (
              <div className="mt-3 sm:mt-4">
                <Typography 
                  variant="body2" 
                  className="text-sm text-center p-2 rounded"
                  sx={{
                    color: theme.palette.error.main,
                    backgroundColor: theme.palette.error.light + '20',
                  }}
                >
                  {fileError}
                </Typography>
              </div>
            )}

            {/* Media Preview Section */}
            {(selectedImage || selectedVideo) && (
              <div className="mt-3 sm:mt-4">
                <Typography 
                  variant="subtitle2" 
                  className="mb-2 text-sm sm:text-base"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Preview:
                </Typography>

                {selectedImage && (
                  <Card className="relative">
                    <div className="relative">
                      <CardMedia
                        component="img"
                        height={{ xs: 150, sm: 200 }}
                        image={selectedImage}
                        alt="Selected image"
                        className="object-cover"
                      />
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          },
                        }}
                        size="small"
                        onClick={handleRemoveMedia}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </Card>
                )}

                {selectedVideo && (
                  <Card className="relative">
                    <div className="relative">
                      <CardMedia
                        component="video"
                        height={{ xs: 150, sm: 200 }}
                        src={selectedVideo}
                        controls
                        className="object-cover"
                      />
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          },
                        }}
                        size="small"
                        onClick={handleRemoveMedia}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </Card>
                )}

              </div>
            )}

            <div className="flex w-full justify-end mt-3 sm:mt-4">
              <Button
                variant="contained"
                type="submit"
                disabled={isSubmitting}
                size="small"
                sx={{ borderRadius: "1.5rem", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </form>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isLoading}
          onClick={handleCloseModal}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    </Modal>
  );
}

CreatePostModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default CreatePostModal;

