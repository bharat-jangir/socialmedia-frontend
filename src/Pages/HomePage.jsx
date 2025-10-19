import {
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Drawer,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "../components/Sidebar";
import HomeRight from "../components/HomeRight";
import StoriesSection from "../components/StoriesSection";
import { useLocation, useNavigate } from "react-router-dom";
import Feed from "../components/Feed";
import Reels from "../components/Reels";
import CreateReelsForm from "../components/CreateReelsForm";
import StoryModal from "../components/StoryModal";
import CreateStoryModal from "../components/CreateStoryModal";
import Profile from "./Profile";
import Notifications from "../components/Notifications";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
// getUserProfile import removed - now handled in App.jsx
import { navigationMenu } from "../components/SidebarNav.jsx";
import { SidebarSkeleton, HomeRightSkeleton } from "../components/SkeletonLoader";

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const [mobileNavValue, setMobileNavValue] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [reelModalOpen, setReelModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  console.log("Current pathname:", location.pathname);

  // getUserProfile is now handled in App.jsx to avoid duplicate calls

  // Sync mobile navigation value with current route
  useEffect(() => {
    const currentPath = location.pathname;
    const menuIndex = navigationMenu.findIndex((item) => {
      if (item.title === "Profile") {
        return currentPath.startsWith("/profile");
      }
      return currentPath === item.path;
    });
    if (menuIndex !== -1) {
      setMobileNavValue(menuIndex);
    }
  }, [location.pathname]);

  // Handle create-reels route
  useEffect(() => {
    if (location.pathname === "/create-reels") {
      setReelModalOpen(true);
      navigate("/feed");
    }
  }, [location.pathname, navigate]);

  // Simulate initial load time for skeleton loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000); // Show skeleton for 1 second

    return () => clearTimeout(timer);
  }, []);

  const handleMobileNavChange = (event, newValue) => {
    setMobileNavValue(newValue);
    const menuItem = navigationMenu[newValue];
    if (menuItem) {
      if (menuItem.title === "Profile") {
        // Try multiple possible ID fields from user object
        const userId = auth.user?.id || auth.user?.userId || auth.user?._id;
        console.log("HomePage Mobile Nav - User object:", auth.user);
        console.log("HomePage Mobile Nav - User ID fields:", {
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
      } else {
        navigate(menuItem.path);
      }
    }
  };

  const handleMobileSidebarToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {/* Mobile Top Bar - Only visible on mobile */}
      <AppBar
        position="static"
        sx={{ display: { xs: "block", lg: "none" } }}
        className="bg-white text-black shadow-sm"
      >
        <Toolbar>
          {/* Hamburger Menu Button */}
          <IconButton
            color="inherit"
            onClick={handleMobileSidebarToggle}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Back Button - Show when not on home page */}
          {location.pathname !== "/" && (
            <IconButton
              color="inherit"
              onClick={() => navigate(-1)}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            ChatterBox
          </Typography>
          <IconButton color="inherit">
            <Typography variant="body2">
              {auth.user?.fname || "User"}
            </Typography>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={mobileSidebarOpen}
        onClose={handleMobileSidebarToggle}
        sx={{
          display: { xs: "block", lg: "none" },
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: '#1a1a1a',
            color: 'white',
          },
        }}
      >
        <Sidebar onMobileClose={handleMobileSidebarClose} />
      </Drawer>

      {/* Desktop Layout - Instagram Style */}
      <div className="hidden lg:flex h-full instagram-layout">
        {/* Left Sidebar - Always visible and sticky */}
        <div className="w-1/4 sticky-sidebar bg-transparent">
          {isInitialLoad ? <SidebarSkeleton /> : <Sidebar />}
        </div>

        {/* Main Content Area */}
        <div className="w-1/2 flex flex-col h-full">
          {/* Stories Section - Sticky at top - Only show on home/feed routes */}
          {(location.pathname === "/" || location.pathname === "/feed") && (
            <div className="sticky-stories flex-shrink-0">
              <StoriesSection />
            </div>
          )}
          
          {/* Feed Content - Scrollable */}
          <div className="feed-scrollable px-4">
          {(() => {
            const currentPath = location.pathname;
            if (currentPath === "/" || currentPath === "/feed") {
              return <Feed feedType="all" />;
            } else if (currentPath === "/stories") {
              return <Feed feedType="all" />;
            } else if (currentPath === "/reels") {
              return <Reels />;
            } else if (currentPath === "/create-reels") {
              return <Feed feedType="all" />;
            } else if (currentPath.startsWith("/profile/")) {
              // Extract id from URL path
              const profileId = currentPath.split("/profile/")[1];
              console.log("HomePage - Profile ID from URL:", profileId);
              
              // Validate profileId before passing to Profile component
              if (profileId && profileId !== 'undefined' && profileId.trim() !== '') {
                return <Profile profileId={profileId} />;
              } else {
                console.error("Invalid profile ID:", profileId);
                return (
                  <div className="text-center text-gray-500 mt-20">
                    <h2 className="text-2xl font-bold mb-4">Invalid Profile</h2>
                    <p>Profile ID is missing or invalid.</p>
                  </div>
                );
              }
            } else if (currentPath === "/notifications") {
              return <Notifications />;
            } else {
              return <Feed feedType="all" />;
            }
          })()}
          </div>
        </div>

        {/* Right Sidebar - Sticky (Hidden on profile pages) */}
        {!location.pathname.startsWith("/profile") && (
          <div className="w-1/4 sticky-sidebar">
            {isInitialLoad ? <HomeRightSkeleton /> : <HomeRight />}
          </div>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full h-full flex flex-col pb-16">
        {/* Stories Section - Sticky at top for mobile - Only show on home/feed routes */}
        {(location.pathname === "/" || location.pathname === "/feed") && (
          <div className="sticky-stories flex-shrink-0">
            <StoriesSection />
          </div>
        )}
        
        <div className="feed-scrollable px-2 sm:px-4">
          {(() => {
            const currentPath = location.pathname;
            if (currentPath === "/" || currentPath === "/feed") {
              return <Feed feedType="all" />;
            } else if (currentPath === "/stories") {
              return <Feed feedType="all" />;
            } else if (currentPath === "/reels") {
              return <Reels />;
            } else if (currentPath === "/create-reels") {
              return <Feed feedType="all" />;
            } else if (currentPath.startsWith("/profile/")) {
              // Extract id from URL path
              const profileId = currentPath.split("/profile/")[1];
              console.log("HomePage - Profile ID from URL:", profileId);
              
              // Validate profileId before passing to Profile component
              if (profileId && profileId !== 'undefined' && profileId.trim() !== '') {
                return <Profile profileId={profileId} />;
              } else {
                console.error("Invalid profile ID:", profileId);
                return (
                  <div className="text-center text-gray-500 mt-20">
                    <h2 className="text-2xl font-bold mb-4">Invalid Profile</h2>
                    <p>Profile ID is missing or invalid.</p>
                  </div>
                );
              }
            } else if (currentPath === "/notifications") {
              return <Notifications />;
            } else {
              return <Feed feedType="all" />;
            }
          })()}
        </div>
      </div>

      {/* Create Reels Modal */}
      <CreateReelsForm 
        open={reelModalOpen} 
        handleClose={() => setReelModalOpen(false)} 
      />

      {/* Story Modals */}
      <StoryModal />
      <CreateStoryModal />


      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <BottomNavigation
        value={mobileNavValue}
        onChange={handleMobileNavChange}
        sx={{
          display: { xs: "flex", lg: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
        }}
      >
        {navigationMenu.slice(0, 4).map((item, index) => (
          <BottomNavigationAction
            key={item.title}
            label={item.title}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </div>
  );
}

export default HomePage;
