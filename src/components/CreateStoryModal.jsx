import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardMedia,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Videocam as VideocamIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { createStory } from '../state/Post/story.action';
import { closeCreateStoryModal, openStoryModal } from '../state/Post/storySlice';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

const CreateStoryModal = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { createStoryModalOpen, creatingStory, userStories } = useSelector((state) => state.story);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  console.log('CreateStoryModal - createStoryModalOpen:', createStoryModalOpen);
  console.log('CreateStoryModal - creatingStory:', creatingStory);
  console.log('CreateStoryModal - currentUser:', currentUser);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [storyCreated, setStoryCreated] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleClose = () => {
    dispatch(closeCreateStoryModal());
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setError('');
    setActiveTab(0);
    setStoryCreated(false);
  };

  const handleViewStories = () => {
    if (currentUser?.id && userStories[currentUser.id] && userStories[currentUser.id].length > 0) {
      dispatch(openStoryModal({ 
        userStories: userStories[currentUser.id], 
        initialIndex: 0 
      }));
      dispatch(closeCreateStoryModal());
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (activeTab === 0 && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (activeTab === 1 && !file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = activeTab === 0 ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${activeTab === 0 ? '10MB' : '50MB'}`);
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !currentUser) return;

    setUploading(true);
    setError('');

    try {
      // Upload to Cloudinary
      const fileType = activeTab === 0 ? 'image' : 'video';
      console.log('Uploading file:', selectedFile.name, 'Type:', fileType);
      const uploadResult = await uploadToCloudinary(selectedFile, fileType);
      console.log('Upload result:', uploadResult);
      
      if (!uploadResult) {
        throw new Error('Upload failed - no URL returned');
      }

      // Create story data
      const storyData = {
        caption: caption.trim(),
        storyType: activeTab === 0 ? 'IMAGE' : 'VIDEO',
        ...(activeTab === 0 
          ? { imageUrl: uploadResult } 
          : { videoUrl: uploadResult }
        ),
      };

      // Dispatch create story action
      const result = await dispatch(createStory(storyData));
      
      if (result.type.endsWith('fulfilled')) {
        console.log('Story created successfully!');
        // Show success message and reset form for another story
        setStoryCreated(true);
        setSelectedFile(null);
        setPreviewUrl('');
        setCaption('');
        setError('');
        setActiveTab(0);
        console.log('Story created and modal will close automatically');
        // Modal will close automatically due to Redux state update
        // Story will appear instantly in the stories section with gradient border
      } else {
        console.log('Story creation failed:', result.payload);
        setError(result.payload || 'Failed to create story');
      }
    } catch (error) {
      console.error('Error creating story:', error);
      setError(error.message || 'Failed to create story');
    } finally {
      setUploading(false);
    }
  }, [selectedFile, caption, activeTab, currentUser, dispatch]);

  const handleCameraClick = () => {
    if (activeTab === 0) {
      fileInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  };

  return (
    <Dialog
      open={createStoryModalOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Create Story</Typography>
        <IconButton onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Success Message */}
        {storyCreated && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2, 
              backgroundColor: theme.palette.success.main, 
              color: theme.palette.success.contrastText 
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  console.log('Add Another Story clicked');
                  setStoryCreated(false);
                }}
              >
                Add Another Story
              </Button>
            }
          >
            Story created successfully! You can add more stories or close the modal.
          </Alert>
        )}
        
        {/* Debug Info */}
        {console.log('CreateStoryModal render - storyCreated:', storyCreated)}
        
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { color: '#ccc' },
              '& .Mui-selected': { color: '#1976d2' },
              '& .MuiTabs-indicator': { backgroundColor: '#1976d2' },
            }}
          >
            <Tab
              icon={<PhotoCameraIcon />}
              label="Photo"
              iconPosition="start"
            />
            <Tab
              icon={<VideocamIcon />}
              label="Video"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof error === 'string' ? error : error.message || 'An error occurred'}
          </Alert>
        )}

        {!selectedFile ? (
          <Box
            sx={{
              border: '2px dashed #444',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
              },
            }}
            onClick={handleCameraClick}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {activeTab === 0 ? 'Upload Photo' : 'Upload Video'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0 
                ? 'Click to select an image or drag and drop'
                : 'Click to select a video or drag and drop'
              }
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {activeTab === 0 
                ? 'Supports: JPG, PNG, GIF (Max 10MB)'
                : 'Supports: MP4, MOV, AVI (Max 50MB)'
              }
            </Typography>
          </Box>
        ) : (
          <Box>
            <Card sx={{ mb: 2 }}>
              <CardMedia
                component={activeTab === 0 ? 'img' : 'video'}
                src={previewUrl}
                alt="Preview"
                sx={{
                  height: activeTab === 0 ? 300 : 200,
                  objectFit: 'cover',
                }}
                controls={activeTab === 1}
              />
            </Card>

            <TextField
              fullWidth
              label="Caption (optional)"
              multiline
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                },
                '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                '& .MuiInputBase-input': { color: theme.palette.text.primary },
              }}
            />
          </Box>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} sx={{ color: '#ccc' }}>
          {storyCreated ? 'Done' : 'Cancel'}
        </Button>
        
        {/* View Stories Button - Show if user has existing stories */}
        {!storyCreated && currentUser?.id && userStories[currentUser.id] && userStories[currentUser.id].length > 0 && (
          <Button
            onClick={handleViewStories}
            variant="outlined"
            sx={{
              borderColor: '#4caf50',
              color: '#4caf50',
              '&:hover': { 
                borderColor: '#45a049',
                backgroundColor: 'rgba(76, 175, 80, 0.1)'
              },
            }}
          >
            View Stories ({userStories[currentUser.id].length})
          </Button>
        )}
        
        {storyCreated ? (
          <Button
            onClick={() => {
              console.log('Add Another Story button clicked');
              setStoryCreated(false);
            }}
            variant="outlined"
            sx={{
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': { 
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.1)'
              },
            }}
          >
            Add Another Story
          </Button>
        ) : (
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading || creatingStory}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
              '&:disabled': { backgroundColor: '#444' },
            }}
          >
            {uploading || creatingStory ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <Typography variant="body2">
                  {uploading ? 'Uploading...' : 'Creating...'}
                </Typography>
              </Box>
            ) : (
              'Share Story'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateStoryModal;
