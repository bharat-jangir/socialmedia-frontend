import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";

function ChatMessages({text}) {
  const theme = useTheme();
  const { auth, message } = useSelector((state) => ({
    auth: state.auth,
    message: state.message
  }));
  const isReqUserMessage = auth.user?.id === text.user?.id;
  
  // Format message time
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div
      className={`flex ${!isReqUserMessage ? "justify-start" : "justify-end"} text-white mb-4 px-2 w-full`}
    >
      <div className="relative group max-w-[80%]">
        <div
          className={`px-4 py-3 rounded-xl ${
            text.image ? "rounded-md" : "px-5 rounded-full"
          }`}
          style={{
            backgroundColor: isReqUserMessage 
              ? '#FF6B6B' // Orange for sender (using SoulConnect primary color)
              : theme.palette.mode === 'dark' 
                ? '#4A5568' // Dark gray for receiver in dark mode
                : '#E2E8F0', // Light gray for receiver in light mode
            color: isReqUserMessage 
              ? '#FFFFFF' // White text for orange background
              : theme.palette.text.primary,
            borderRadius: isReqUserMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
          }}
        >
          {/* Show sender name for other user's messages */}
          {!isReqUserMessage && (
            <div 
              className="font-semibold text-xs mb-1"
              style={{ color: theme.palette.primary.main }}
            >
              {text.user?.fname} {text.user?.lname}
            </div>
          )}
          
          {text.image && (
            <img className="w-[15rem] h-[17rem] object-cover rounded-md" src={text.image} />
          )}
          <p className={`${true ? "py-2" : "py-1"} leading-relaxed`}>{text.content}</p>
          
          {/* Show timestamp */}
          <div
            className="text-xs mt-1 block"
            style={{
              color: isReqUserMessage 
                ? 'rgba(255, 255, 255, 0.8)' // Semi-transparent white for orange background
                : theme.palette.text.secondary
            }}
          >
            {formatMessageTime(text.createdAt || text.timestamp || text.time)}
          </div>
        </div>
      </div>
    </div>
  );
}

ChatMessages.propTypes = {
  text: PropTypes.object.isRequired,
};

export default ChatMessages;
