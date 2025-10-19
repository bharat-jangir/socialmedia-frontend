import { useState, useRef, useCallback, useEffect } from "react";
import {
  Modal,
  Box,
  Avatar,
  IconButton,
  Button,
  Card,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import Backdrop from "@mui/material/Backdrop";
import VideocamIcon from "@mui/icons-material/Videocam";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { createReel } from "../state/Post/post.action";

// Check browser compatibility for MediaRecorder
const checkMediaRecorderSupport = () => {
  if (!window.MediaRecorder) {
    return { supported: false, error: 'MediaRecorder not supported' };
  }
  
  const supportedTypes = [
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9', 
    'video/webm',
    'video/mp4'
  ];
  
  for (const type of supportedTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return { supported: true, mimeType: type };
    }
  }
  
  return { supported: true, mimeType: null }; // Fallback to default
};

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", sm: 500 },
  maxWidth: { xs: "95vw", sm: 500 },
  maxHeight: { xs: "90vh", sm: "80vh" },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: { xs: 2, sm: 4 },
  borderRadius: ".6rem",
  outline: "none",
  overflow: "auto",
};

function CreateReelsForm({ open, handleClose }) {
  const [title, setTitle] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  // Check browser compatibility on mount
  useEffect(() => {
    const compatibility = checkMediaRecorderSupport();
    if (!compatibility.supported) {
      setFileError("Your browser doesn't support video recording. Please use Chrome or Firefox.");
    }
  }, []);

  // Initialize camera when modal opens
  const initializeCamera = useCallback(async () => {
    if (open && !cameraActive && !selectedVideo) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 720, height: 1280 }, 
          audio: true 
        });
        
        streamRef.current = stream;
        setCameraActive(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setFileError("Unable to access camera. Please check permissions.");
      }
    }
  }, [open, cameraActive, selectedVideo]);

  // Initialize camera on modal open
  useEffect(() => {
    if (open) {
      initializeCamera();
    }
  }, [open, initializeCamera]);

  // Start camera recording
  const startRecording = useCallback(async () => {
    try {
      setFileError("");
      
      // Use existing stream if available, otherwise get new one
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 720, height: 1280 }, 
          audio: true 
        });
        streamRef.current = stream;
        setCameraActive(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }

      // Check browser compatibility
      const compatibility = checkMediaRecorderSupport();
      if (!compatibility.supported) {
        throw new Error(compatibility.error);
      }

      console.log('Using MIME type:', compatibility.mimeType || 'default');
      
      let mediaRecorder;
      try {
        if (compatibility.mimeType) {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: compatibility.mimeType
          });
        } else {
          mediaRecorder = new MediaRecorder(stream);
        }
      } catch (error) {
        console.error('Error creating MediaRecorder:', error);
        // Final fallback to default MediaRecorder
        try {
          mediaRecorder = new MediaRecorder(stream);
          console.log('Using default MediaRecorder as fallback');
        } catch (fallbackError) {
          console.error('Error creating default MediaRecorder:', fallbackError);
          throw new Error('MediaRecorder not supported on this browser');
        }
      }
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setSelectedVideo(videoUrl);
        setRecordedChunks(chunks);
      };

      setMediaRecorder(mediaRecorder);
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing camera:", error);
      
      // Check if it's a MediaRecorder error
      if (error.message.includes('MediaRecorder') || error.message.includes('codec')) {
        setFileError("Your browser doesn't support video recording. Please try using Chrome or Firefox.");
      } else if (error.name === 'NotAllowedError') {
        setFileError("Camera access denied. Please allow camera permissions and try again.");
      } else if (error.name === 'NotFoundError') {
        setFileError("No camera found. Please connect a camera and try again.");
      } else {
        setFileError("Unable to access camera. Please check permissions and try again.");
      }
    }
  }, []);

  // Stop camera recording
  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [mediaRecorder, isRecording]);

  // Handle video file upload
  const handleVideoUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      setFileError("Please select a video file.");
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setFileError("Video file is too large. Maximum size is 100MB.");
      return;
    }
    
    setFileError("");
    setSelectedVideo(URL.createObjectURL(file));
  }, []);

  // Compress video before upload (simplified version)
  const compressVideo = useCallback(async (videoBlob) => {
    console.log("Using video blob directly (no compression):", videoBlob.size, "bytes");
    
    // For now, return the original blob without compression
    // Canvas compression for video is complex and can cause issues
    return videoBlob;
  }, []);

  // Upload video to Cloudinary
  const uploadVideo = useCallback(async () => {
    if (!selectedVideo) return null;

    console.log("Starting video upload...", selectedVideo);
    setIsUploading(true);
    setFileError("");

    try {
      let videoBlob;
      
      if (recordedChunks.length > 0) {
        // Use recorded video
        console.log("Using recorded video chunks:", recordedChunks.length);
        videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      } else {
        // Use uploaded file
        console.log("Using uploaded file");
        const response = await fetch(selectedVideo);
        videoBlob = await response.blob();
      }

      console.log("Video blob created:", videoBlob.size, "bytes");

      // Compress video
      console.log("Starting compression...");
      const compressedBlob = await compressVideo(videoBlob);
      console.log("Compression completed:", compressedBlob.size, "bytes");
      
      // Upload to Cloudinary
      console.log("Uploading to Cloudinary...");
      const videoUrl = await uploadToCloudinary(compressedBlob, "video");
      console.log("Upload completed:", videoUrl);
      return videoUrl;
      
    } catch (error) {
      console.error("Upload error:", error);
      setFileError("Failed to upload video. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [selectedVideo, recordedChunks, compressVideo]);

  // Submit reel
  const handleSubmit = useCallback(async () => {
    console.log("Submit button clicked");
    
    if (!title.trim()) {
      setFileError("Please enter a title for your reel.");
      return;
    }

    if (!selectedVideo) {
      setFileError("Please record or upload a video.");
      return;
    }

    console.log("Starting reel creation process...");
    setIsSubmitting(true);
    setFileError("");

    try {
      console.log("Calling uploadVideo...");
      const videoUrl = await uploadVideo();
      console.log("Upload result:", videoUrl);
      
      if (videoUrl) {
        const reelData = {
          title: title.trim(),
          video: videoUrl
        };

        console.log("Dispatching createReel with data:", reelData);
        await dispatch(createReel(reelData));
        console.log("Reel created successfully!");
        handleCloseModal();
      } else {
        console.error("No video URL returned from upload");
        setFileError("Failed to upload video. Please try again.");
      }
    } catch (error) {
      console.error("Error creating reel:", error);
      setFileError("Failed to create reel. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [title, selectedVideo, uploadVideo, dispatch]);

  const handleCloseModal = () => {
    // Clean up
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (selectedVideo) {
      URL.revokeObjectURL(selectedVideo);
    }
    
    // Reset state
    setTitle("");
    setSelectedVideo(null);
    setIsRecording(false);
    setFileError("");
    setRecordingTime(0);
    setRecordedChunks([]);
    setCameraActive(false);
    handleClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <Modal
      open={open}
      onClose={handleCloseModal}
      aria-labelledby="create-reel-modal"
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Box sx={style}>
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="text-lg font-semibold">
            Create Reel
          </Typography>
          <IconButton onClick={handleCloseModal} size="small">
            <CloseIcon />
          </IconButton>
        </div>

        {/* User Info */}
        <div className="flex items-center mb-4">
          <Avatar src={user?.profileImage} className="mr-3" />
          <Typography variant="body1" className="font-medium">
            {user?.fname} {user?.lname}
          </Typography>
        </div>

        {/* Title Input */}
        <TextField
          fullWidth
          label="Reel Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your reel about?"
          variant="outlined"
          className="mb-4"
          disabled={isSubmitting}
        />

        {/* Video Recording/Upload Section */}
        {!selectedVideo ? (
          <div className="flex flex-col items-center space-y-4 mb-4">
            {/* Live Camera Preview */}
            <div className="relative w-full max-w-sm">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                style={{ 
                  display: cameraActive ? 'block' : 'none',
                  transform: 'scaleX(-1)' // Mirror effect like selfie camera
                }}
              />
              {!cameraActive && (
                <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Typography variant="body2" className="text-gray-500 text-center">
                    {fileError ? "Camera access denied" : "Camera preview will appear here"}
                  </Typography>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                  REC
                </div>
              )}
            </div>

            {/* Camera Recording */}
            <div className="flex flex-col items-center">
              <IconButton
                color="primary"
                onClick={isRecording ? stopRecording : startRecording}
                size="large"
                disabled={isSubmitting}
                sx={{ 
                  bgcolor: isRecording ? 'error.main' : 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: isRecording ? 'error.dark' : 'primary.dark',
                  }
                }}
              >
                {isRecording ? <StopIcon /> : <VideocamIcon />}
              </IconButton>
              <Typography variant="body2" className="text-center mt-2">
                {isRecording ? `Recording... ${formatTime(recordingTime)}` : "Record Video"}
              </Typography>
            </div>

            <Typography variant="body2" className="text-gray-500">
              OR
            </Typography>

            {/* Video Upload */}
            <div className="flex flex-col items-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ display: "none" }}
                id="video-upload"
                disabled={isSubmitting}
              />
              <label htmlFor="video-upload">
                <IconButton color="primary" component="span" size="large">
                  <UploadIcon />
                </IconButton>
              </label>
              <Typography variant="body2" className="text-center mt-2">
                Upload Video
              </Typography>
            </div>
          </div>
        ) : (
          /* Video Preview */
          <div className="mb-4">
            <Typography variant="subtitle2" className="mb-2 text-gray-600">
              Preview:
            </Typography>
            <Card className="relative">
              <video
                src={selectedVideo}
                controls
                className="w-full max-h-64 object-cover rounded"
                style={{ maxHeight: '256px' }}
              />
            </Card>
          </div>
        )}

        {/* Error Message */}
        {fileError && (
          <div className="mb-4">
            <Typography 
              variant="body2" 
              className="text-red-500 text-sm text-center bg-red-50 p-2 rounded"
            >
              {fileError}
            </Typography>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outlined"
            onClick={handleCloseModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedVideo || !title.trim() || isSubmitting || isUploading}
            startIcon={isSubmitting || isUploading ? <CircularProgress size={16} /> : null}
          >
            {isUploading ? "Uploading..." : isSubmitting ? "Creating..." : "Create Reel"}
          </Button>
        </div>
      </Box>
    </Modal>
  );
}

CreateReelsForm.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default CreateReelsForm;