import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { useFormik } from "formik";
import { useTheme } from "@mui/material/styles";
import {
  updateUserProfile,
  updateUserProfileImage,
} from "../state/Auth/authActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import { useState, useEffect } from "react";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  outline: "none",
  overFlow: "scroll-y",
  borderRadius: 3,
};

function ProfileModal({ open, handleClose }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const currentUser = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const extractImageUrl = (profileImage) => {
    if (!profileImage) return "";
    try {
      const parsed = JSON.parse(profileImage);
      return parsed.imageUrl || profileImage;
    } catch {
      return profileImage;
    }
  };

  useEffect(() => {
    setProfileImageUrl(extractImageUrl(currentUser?.profileImage));
  }, [currentUser?.profileImage]);

  const handleModalOpen = () => {
    setUpdateError(null);
    setUpdateSuccess(false);
    setProfileImageUrl(extractImageUrl(currentUser?.profileImage));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const imageUrl = await uploadToCloudinary(file, "image");
        setProfileImageUrl(imageUrl);
        setProfileImage(file);

        const result = await dispatch(updateUserProfileImage(imageUrl));
        if (result.type.endsWith("fulfilled")) {
          console.log("Profile image updated successfully on server");
        } else {
          console.error("Failed to update profile image:", result.payload);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      fname: currentUser?.fname || "",
      lname: currentUser?.lname || "",
      userBio: currentUser?.userBio || "",
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setUpdateError(null);
        setUpdateSuccess(false);

        const result = await dispatch(updateUserProfile(values));

        if (result.type.endsWith("fulfilled")) {
          setUpdateSuccess(true);
          setTimeout(() => {
            handleClose();
            setUpdateSuccess(false);
          }, 1500);
        } else {
          setUpdateError(result.payload?.message || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        setUpdateError("An unexpected error occurred");
      }
    },
  });

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        onOpen={handleModalOpen}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <form onSubmit={formik.handleSubmit}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IconButton onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
                <p>Edit Profile</p>
              </div>
              <Button type="submit" disabled={loading} variant="contained">
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>

            <div>
              <div className="h-[15rem]">
                <img
                  className="w-full h-full rounded-t-md"
                  src="https://plus.unsplash.com/premium_photo-1669359806362-6bd0218a4fd2?q=80&w=1170&auto=format&fit=crop"
                  alt="cover"
                />
              </div>
              <div className="pl-5 relative group">
                <div className="relative transform -translate-y-24">
                  <Avatar
                    className="transition-all duration-200"
                    sx={{ 
                      width: "10rem", 
                      height: "10rem",
                      fontSize: '3rem',
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.primary.main
                    }}
                    src={profileImageUrl}
                  >
                    {currentUser?.fname?.charAt(0) || "U"}
                  </Avatar>

                  {/* Instagram-style edit button */}
                  <IconButton
                    component="label"
                    className="absolute bottom-2 right-2 rounded-full shadow-md"
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      width: 40,
                      height: 40,
                      "&:hover": { 
                        backgroundColor: theme.palette.primary.dark,
                        transform: "scale(1.1)" 
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <AddAPhotoIcon fontSize="small" />
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </IconButton>

                  {/* Loading overlay */}
                  {uploading && (
                    <div 
                      className="absolute top-0 left-0 w-full h-full flex items-center justify-center rounded-full"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div 
                        className="animate-spin rounded-full h-8 w-8 border-b-2"
                        style={{
                          borderBottomColor: theme.palette.primary.contrastText,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <TextField
                fullWidth
                id="fname"
                name="fname"
                label="First Name"
                value={formik.values.fname}
                onChange={formik.handleChange}
                disabled={loading}
              />

              <TextField
                fullWidth
                id="lname"
                name="lname"
                label="Last Name"
                value={formik.values.lname}
                onChange={formik.handleChange}
                disabled={loading}
              />

              <TextField
                fullWidth
                id="userBio"
                name="userBio"
                label="Bio"
                placeholder="Tell us about yourself..."
                value={formik.values.userBio}
                onChange={formik.handleChange}
                disabled={loading}
                multiline
                rows={3}
                inputProps={{ maxLength: 160 }}
                helperText={`${
                  formik.values.userBio?.length || 0
                }/160 characters`}
              />

              {updateSuccess && (
                <div 
                  className="p-3 border rounded"
                  style={{
                    backgroundColor: theme.palette.success.light + '20',
                    borderColor: theme.palette.success.main,
                    color: theme.palette.success.dark,
                  }}
                >
                  Profile updated successfully!
                </div>
              )}

              {updateError && (
                <div 
                  className="p-3 border rounded"
                  style={{
                    backgroundColor: theme.palette.error.light + '20',
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.dark,
                  }}
                >
                  {updateError}
                </div>
              )}

              {loading && (
                <div 
                  className="p-3 border rounded flex items-center"
                  style={{
                    backgroundColor: theme.palette.info.light + '20',
                    borderColor: theme.palette.info.main,
                    color: theme.palette.info.dark,
                  }}
                >
                  <div 
                    className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"
                    style={{
                      borderBottomColor: theme.palette.info.dark,
                    }}
                  ></div>
                  Updating profile...
                </div>
              )}
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}

ProfileModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default ProfileModal;
