import { Avatar, Card, CardHeader, IconButton } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";


function UserChatCard({chat}) {
  const navigate = useNavigate();
  const { message, auth } = useSelector((state) => ({
    message: state.message,
    auth: state.auth
  }));
  
  // Get the other user (not the current user)
  const otherUser = auth.user?.id === chat.users[1]?.id ? chat.users[0] : chat.users[1];
  
  const handleProfileClick = () => {
    if (otherUser?.id) {
      navigate(`/profile/${otherUser.id}`);
    }
  };
  
  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar
            sx={{
              width: "3.5rem",
              height: "3.5rem",
              fontSize: "1.5rem",
              bgcolor: "#191c29",
              color: "rgb(88,199,250)",
              cursor: 'pointer'
            }}
            src={otherUser?.profileImage}
          >
            {otherUser?.fname?.charAt(0) || "U"}
          </Avatar>
        }
        action={
          <IconButton>
            <MoreHorizIcon />
          </IconButton>
        }
        title={
          <span 
            style={{ cursor: 'pointer' }}
          >
            {auth.user?.id===chat.users[1].id?chat.users[0].fname+" "+chat.users[0].lname:chat.users[1].fname+" "+chat.users[1].lname}
          </span>
        }
        subheader={
          <span 
            style={{ cursor: 'pointer' }}
          >
            {auth.user?.id===chat.users[1].id?"@"+chat.users[0].fname.toLowerCase()+"_"+chat.users[0].lname.toLowerCase():"@"+chat.users[1].fname.toLowerCase()+"_"+chat.users[1].lname.toLowerCase()}
          </span>
        }
      ></CardHeader>
    </Card>
  );
}

UserChatCard.propTypes = {
  chat: PropTypes.object.isRequired,
};

export default UserChatCard;