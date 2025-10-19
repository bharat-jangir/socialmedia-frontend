import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import ControlPointRoundedIcon from "@mui/icons-material/ControlPointRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import MessageRoundedIcon from "@mui/icons-material/MessageRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import NotificationBell from "./NotificationBell";

export const navigationMenu = [
  {
    title: "Home",
    icon: <HomeRoundedIcon />,
    path: "/",
  },
  {
    title: "Reels",
    icon: <ExploreRoundedIcon />,
    path: "/reels",
  },
  {
    title: "Create Reels",
    icon: <ControlPointRoundedIcon />,
    path: "/create-reels",
  },
  {
    title: "Notifications",
    icon: <NotificationBell />,
    path: "/notifications",
  },
  {
    title: "Message",
    icon: <MessageRoundedIcon />,
    path: "/message",
  },
  {
    title: "Profile",
    icon: <AccountCircleRoundedIcon />,
    path: "/profile",
  },
];
