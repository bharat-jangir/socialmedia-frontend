import {
  CardHeader,
  Avatar,
  Button,
  CircularProgress,
  Tooltip
} from "@mui/material";
import { red } from "@mui/material/colors";
import { useDispatch, useSelector } from "react-redux";
import { followSuggestedUser, unfollowSuggestedUser } from "../state/SuggestedFriends/suggestedFriends.action";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function PopularUserCard({ user, suggestionType = "all" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { followedUsers, unfollowedUsers } = useSelector((state) => state.suggestedFriends);
  const [isLoading, setIsLoading] = useState(false);

  // Determine if user is being followed or unfollowed
  const isFollowing = followedUsers.includes(user.id);
  const isUnfollowing = unfollowedUsers.includes(user.id);
  const isCurrentlyFollowing = user.isFollowing || user.isFollowed;

  const handleFollow = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isCurrentlyFollowing) {
        const result = await dispatch(unfollowSuggestedUser(user.id));
        if (result.type.endsWith('fulfilled')) {
          console.log('Successfully unfollowed user');
        }
      } else {
        const result = await dispatch(followSuggestedUser(user.id));
        if (result.type.endsWith('fulfilled')) {
          console.log('Successfully followed user');
        }
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${user.id}`);
  };

  const getSuggestionReason = () => {
    switch (suggestionType) {
      case 'mutual':
        return `Mutual friends: ${user.mutualFriendsCount || 0}`;
      case 'gender':
        return `Similar interests`;
      case 'detailed':
        return user.suggestionReason || 'Recommended for you';
      default:
        return user.suggestionReason || 'Suggested for you';
    }
  };

  const getButtonText = () => {
    if (isLoading) return '';
    if (isFollowing) return 'Following...';
    if (isUnfollowing) return 'Unfollowing...';
    return isCurrentlyFollowing ? 'Unfollow' : 'Follow';
  };

  const getButtonColor = () => {
    if (isCurrentlyFollowing) return 'secondary';
    return 'primary';
  };

  return (
    <div>
      <CardHeader
        avatar={
          <Avatar 
            key={user.profileImage || user.profilePicture || user.id || 'default'} // Force re-render when image changes
            src={user.profileImage || user.profilePicture} 
            sx={{ bgcolor: red[500], cursor: 'pointer' }} 
            aria-label="user-avatar"
            onClick={handleProfileClick}
          >
            {user.fname?.charAt(0) || user.name?.charAt(0) || "U"}
          </Avatar>
        }
        action={
          <Tooltip title={getSuggestionReason()}>
            <Button 
              size="small" 
              variant={isCurrentlyFollowing ? "outlined" : "contained"}
              color={getButtonColor()}
              onClick={handleFollow}
              disabled={isLoading}
              sx={{ minWidth: 80 }}
            >
              {isLoading ? (
                <CircularProgress size={16} />
              ) : (
                getButtonText()
              )}
            </Button>
          </Tooltip>
        }
        title={
          <span 
            style={{ cursor: 'pointer' }}
            onClick={handleProfileClick}
          >
            {`${user.fname || user.name || 'User'} ${user.lname || ''}`.trim()}
          </span>
        }
        subheader={
          <span 
            style={{ cursor: 'pointer' }}
            onClick={handleProfileClick}
          >
            {`@${(user.fname || user.name || 'user').toLowerCase()}_${(user.lname || 'name').toLowerCase()}`}
          </span>
        }
      />
    </div>
  );
}

export default PopularUserCard;
