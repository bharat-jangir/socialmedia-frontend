import { useState } from "react";
import { navigationMenu } from "./SidebarNav.jsx";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Card from "@mui/material/Card";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { clearAuth } from "../state/store";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "@mui/material/styles";

function Sidebar({ onMobileClose }) {
  const auth = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(clearAuth());
    handleClose();
    // Use replace to ensure proper navigation
    navigate("/login", { replace: true });
  };

  return (
    <div className="sidebar-container">
      <Card className="card h-full flex flex-col justify-between py-3 sm:py-5 bg-transparent border-none shadow-none">
        <div className="sidebar-content space-y-6 sm:space-y-8 pl-3 sm:pl-5">
          <div>
            <span 
              className="logo font-bold text-lg sm:text-xl"
              style={{ color: theme.palette.text.primary }}
            >
              ChatterBox
            </span>
          </div>

          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Back Button - Show when not on home page */}
            {location.pathname !== "/" && (
              <div
                className="flex space-x-2 sm:space-x-3 cursor-pointer items-center p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
                onClick={() => {
                  navigate(-1);
                  // Close mobile sidebar if on mobile
                  if (onMobileClose) onMobileClose();
                }}
              >
                <div 
                  className="text-lg sm:text-xl"
                  style={{ color: theme.palette.text.primary }}
                >
                  <ArrowBackIcon />
                </div>
                <p 
                  className="text-sm sm:text-base lg:text-xl"
                  style={{ color: theme.palette.text.primary }}
                >
                  Back
                </p>
              </div>
            )}

            {navigationMenu.map((item) => (
              <div
                key={item.title}
                className="flex space-x-2 sm:space-x-3 cursor-pointer items-center p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
                onClick={
                  item.title === "Profile"
                    ? () => {
                        // Try multiple possible ID fields from user object
                        const userId = auth.user?.id || auth.user?.userId || auth.user?._id;
                        console.log("Sidebar - User object:", auth.user);
                        console.log("Sidebar - User ID fields:", {
                          id: auth.user?.id,
                          userId: auth.user?.userId,
                          _id: auth.user?._id
                        });
                        
                        if (userId) {
                          console.log("Navigating to profile with ID:", userId);
                          navigate("/profile/" + userId);
                        } else {
                          console.error("Cannot navigate to profile: User ID is missing from user object:", auth.user);
                        }
                        // Close mobile sidebar if on mobile
                        if (onMobileClose) onMobileClose();
                      }
                    : () => {
                        navigate(item.path);
                        // Close mobile sidebar if on mobile
                        if (onMobileClose) onMobileClose();
                      }
                }
              >
                <div 
                  className="text-lg sm:text-xl"
                  style={{ color: theme.palette.text.primary }}
                >
                  {item.icon}
                </div>
                <p 
                  className="text-sm sm:text-base lg:text-xl"
                  style={{ color: theme.palette.text.primary }}
                >
                  {item.title}
                </p>
              </div>
            ))}

          </div>
        </div>
        
        {/* Profile Section - Always visible at bottom */}
        <div className="sidebar-profile">
          <Divider sx={{ bgcolor: theme.palette.divider }} />
          
          {/* Theme Toggle */}
          <div className="pl-3 sm:pl-5 pt-3 sm:pt-5">
            <ThemeToggle size="small" showLabel={false} />
          </div>
          
          <div className="pl-3 sm:pl-5 flex items-center justify-between pt-3 sm:pt-5">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Avatar
                key={auth.user?.profileImage || 'default'} // Force re-render when image changes
                src={auth.user?.profileImage || "https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?w=826&t=st=1711805221~exp=1711805821~hmac=8000422d501b4b12b39e9fcfc545165eb3c23276533c4ab4637b81ec9b88386c"}
                sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
              />
              <div className="hidden sm:block">
                <p 
                  className="font-bold text-sm sm:text-base lg:text-xl"
                  style={{ color: theme.palette.text.primary }}
                >
                  {auth.user?.fname || "User"} {auth.user?.lname || ""}
                </p>
                <p 
                  className="opacity-70 text-xs sm:text-sm"
                  style={{ color: theme.palette.text.secondary }}
                >
                  @
                  {(auth.user?.fname || "user").toLowerCase() +
                    "_" +
                    (auth.user?.lname || "name").toLowerCase()}
                </p>
              </div>
            </div>
            <Button
              id="basic-button"
              aria-controls={open ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleClick}
              size="small"
              sx={{ color: theme.palette.text.primary }}
            >
              <MoreVertIcon fontSize="small" />
            </Button>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                "aria-labelledby": "basic-button",
              }}
              PaperProps={{
                sx: {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.divider}`
                }
              }}
            >
            <MenuItem
              onClick={() => {
                // Try multiple possible ID fields from user object
                const userId = auth.user?.id || auth.user?.userId || auth.user?._id;
                console.log("Sidebar Menu - User object:", auth.user);
                console.log("Sidebar Menu - User ID fields:", {
                  id: auth.user?.id,
                  userId: auth.user?.userId,
                  _id: auth.user?._id
                });
                
                if (userId) {
                  console.log("Navigating to profile with ID:", userId);
                  navigate("/profile/" + userId);
                } else {
                  console.error("Cannot navigate to profile: User ID is missing from user object:", auth.user);
                }
                handleClose();
              }}
              sx={{ color: theme.palette.text.primary }}
            >
              Profile
            </MenuItem>
              <MenuItem 
                onClick={handleClose} 
                sx={{ color: theme.palette.text.primary }}
              >
                My account
              </MenuItem>
              <MenuItem 
                onClick={handleLogout} 
                sx={{ color: theme.palette.text.primary }}
              >
                Logout
              </MenuItem>
            </Menu>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Sidebar;
