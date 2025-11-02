import { createSlice } from "@reduxjs/toolkit";
import {
  createGroup,
  getUserGroups,
  getUserGroupsPaginated,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  addGroupMember,
  removeGroupMember,
  toggleGroupMute,
  toggleGroupPin,
  getGroupMembers,
  getGroupAdmins,
  getPublicGroups,
  searchGroups,
  updateGroupImage,
  updateGroupCoverImage,
  getGroupMessages,
  sendGroupMessage,
  sendGroupMediaMessage,
  addGroupMessageReaction,
  markGroupMessagesAsRead,
} from "./groupActions";

const initialState = {
  // Groups data
  groups: [],
  paginatedGroups: {
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    first: true,
    last: true,
  },
  currentGroup: null,
  groupMembers: {},
  groupAdmins: {},
  publicGroups: [],
  searchResults: [],
  
  // UI state
  loading: false,
  error: null,
  createGroupLoading: false,
  updateGroupLoading: false,
  deleteGroupLoading: false,
  joinGroupLoading: false,
  leaveGroupLoading: false,
  
  // Messaging state
  groupMessages: {},
  sendingMessage: false,
  messageError: null,
  
  // WebSocket connections
  groupWebSockets: {},
};

const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    clearGroupsError: (state) => {
      state.error = null;
      state.messageError = null;
      state.callError = null;
    },
    
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    // WebSocket message handlers
    addGroupMessage: (state, action) => {
      const { groupId, message } = action.payload;
      console.log("=== REDUX: ADD GROUP MESSAGE ===");
      console.log("Group ID:", groupId);
      console.log("Message:", message);
      console.log("Current messages count:", state.groupMessages[groupId]?.length || 0);
      
      if (!state.groupMessages[groupId]) {
        state.groupMessages[groupId] = [];
      }
      // Check if message already exists (for updates)
      const existingIndex = state.groupMessages[groupId].findIndex(m => m.id === message.id);
      if (existingIndex !== -1) {
        console.log("Updating existing message at index:", existingIndex);
        state.groupMessages[groupId][existingIndex] = message;
      } else {
        console.log("Adding new message to array");
        state.groupMessages[groupId].push(message);
      }
      console.log("New messages count:", state.groupMessages[groupId].length);
    },
    
    removeGroupMessage: (state, action) => {
      const { groupId, messageId } = action.payload;
      if (state.groupMessages[groupId]) {
        state.groupMessages[groupId] = state.groupMessages[groupId].filter(
          message => message.id !== messageId
        );
      }
    },
    
    replaceGroupMessage: (state, action) => {
      const { groupId, message } = action.payload;
      console.log("=== REDUX: REPLACE GROUP MESSAGE ===");
      console.log("Group ID:", groupId);
      console.log("Message:", message);
      
      if (!state.groupMessages[groupId]) {
        state.groupMessages[groupId] = [];
      }
      
      // Find and replace optimistic message (temp message) with real message
      const optimisticIndex = state.groupMessages[groupId].findIndex(m => 
        m.isOptimistic && m.content === message.content && m.sender?.id === message.sender?.id
      );
      
      if (optimisticIndex !== -1) {
        console.log("Replacing optimistic message at index:", optimisticIndex);
        state.groupMessages[groupId][optimisticIndex] = message;
      } else {
        console.log("No optimistic message found, adding as new message");
        state.groupMessages[groupId].push(message);
      }
    },
    
    updateGroupMessageReaction: (state, action) => {
      const { groupId, messageId, reactions, reactionCounts, totalReactionCount } = action.payload;
      console.log("=== REDUX: UPDATE GROUP MESSAGE REACTION ===");
      console.log("Group ID:", groupId);
      console.log("Message ID:", messageId);
      console.log("New reactions:", reactions);
      console.log("New reactionCounts:", reactionCounts);
      console.log("New totalReactionCount:", totalReactionCount);
      console.log("Current groupMessages keys:", Object.keys(state.groupMessages));
      
      if (state.groupMessages[groupId]) {
        console.log("Group messages found for group:", groupId);
        console.log("Number of messages in group:", state.groupMessages[groupId].length);
        
        const messageIndex = state.groupMessages[groupId].findIndex(m => m.id === messageId);
        console.log("Message index found:", messageIndex);
        
        if (messageIndex !== -1) {
          console.log("Updating reactions for message at index:", messageIndex);
          console.log("Old reactions:", state.groupMessages[groupId][messageIndex].reactions);
          console.log("Old reactionCounts:", state.groupMessages[groupId][messageIndex].reactionCounts);
          
          // Update all reaction-related fields
          if (reactions !== undefined) {
            state.groupMessages[groupId][messageIndex].reactions = reactions;
          }
          if (reactionCounts !== undefined) {
            state.groupMessages[groupId][messageIndex].reactionCounts = reactionCounts;
          }
          if (totalReactionCount !== undefined) {
            state.groupMessages[groupId][messageIndex].totalReactionCount = totalReactionCount;
          }
          
          console.log("New reactions set:", state.groupMessages[groupId][messageIndex].reactions);
          console.log("New reactionCounts set:", state.groupMessages[groupId][messageIndex].reactionCounts);
          console.log("New totalReactionCount set:", state.groupMessages[groupId][messageIndex].totalReactionCount);
        } else {
          console.log("Message not found in group messages");
        }
      } else {
        console.log("No group messages found for group:", groupId);
      }
    },

    // Add reaction to message
    addReactionToMessage: (state, action) => {
      const { groupId, messageId, reaction } = action.payload;
      console.log("=== REDUX: ADD REACTION TO MESSAGE ===");
      console.log("Group ID:", groupId);
      console.log("Message ID:", messageId);
      console.log("Reaction to add:", reaction);
      
      if (state.groupMessages[groupId]) {
        const messageIndex = state.groupMessages[groupId].findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          const message = state.groupMessages[groupId][messageIndex];
          
          // Initialize reactions array if not exists
          if (!message.reactions) {
            message.reactions = [];
          }
          
          // Check if user already reacted with this emoji
          const existingReactionIndex = message.reactions.findIndex(
            r => r.user?.id === reaction.user?.id && r.emoji === reaction.emoji
          );
          
          if (existingReactionIndex === -1) {
            // Add new reaction
            message.reactions.push(reaction);
            console.log("Added new reaction:", reaction);
            
            // Update reaction counts (increment)
            if (!message.reactionCounts) {
              message.reactionCounts = {};
            }
            message.reactionCounts[reaction.emoji] = (message.reactionCounts[reaction.emoji] || 0) + 1;
            
            // Update total reaction count (increment)
            message.totalReactionCount = (message.totalReactionCount || 0) + 1;
          } else {
            // Update existing reaction (replace case)
            message.reactions[existingReactionIndex] = reaction;
            console.log("Updated existing reaction:", reaction);
          }
          
          console.log("Updated message reactions:", message.reactions);
          console.log("Updated reaction counts:", message.reactionCounts);
          console.log("Updated total reaction count:", message.totalReactionCount);
        }
      }
    },

    // Remove reaction from message
    removeReactionFromMessage: (state, action) => {
      const { groupId, messageId, userId, emoji } = action.payload;
      console.log("=== REDUX: REMOVE REACTION FROM MESSAGE ===");
      console.log("Group ID:", groupId);
      console.log("Message ID:", messageId);
      console.log("User ID:", userId);
      console.log("Emoji to remove:", emoji);
      
      if (state.groupMessages[groupId]) {
        const messageIndex = state.groupMessages[groupId].findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          const message = state.groupMessages[groupId][messageIndex];
          
          if (message.reactions) {
            // Find and remove the reaction
            const reactionIndex = message.reactions.findIndex(
              r => r.user?.id === userId && r.emoji === emoji
            );
            
            if (reactionIndex !== -1) {
              message.reactions.splice(reactionIndex, 1);
              console.log("Removed reaction at index:", reactionIndex);
              
              // Update reaction counts
              if (message.reactionCounts && message.reactionCounts[emoji]) {
                message.reactionCounts[emoji] = message.reactionCounts[emoji] - 1;
                if (message.reactionCounts[emoji] <= 0) {
                  delete message.reactionCounts[emoji];
                }
              }
              
              // Update total reaction count
              message.totalReactionCount = Math.max(0, (message.totalReactionCount || 0) - 1);
              
              console.log("Updated message reactions:", message.reactions);
              console.log("Updated reaction counts:", message.reactionCounts);
              console.log("Updated total reaction count:", message.totalReactionCount);
            }
          }
        }
      }
    },

    // Update message reactions with complete server data
    updateMessageReactions: (state, action) => {
      const { groupId, messageId, reactions, reactionCounts, totalReactionCount } = action.payload;
      console.log("=== REDUX: UPDATE MESSAGE REACTIONS ===");
      console.log("Group ID:", groupId);
      console.log("Message ID:", messageId);
      console.log("New reactions:", reactions);
      console.log("New reactionCounts:", reactionCounts);
      console.log("New totalReactionCount:", totalReactionCount);
      
      if (state.groupMessages[groupId]) {
        const messageIndex = state.groupMessages[groupId].findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          const message = state.groupMessages[groupId][messageIndex];
          
          // Update all reaction-related fields with server data
          if (reactions !== undefined) {
            message.reactions = reactions;
          }
          if (reactionCounts !== undefined) {
            message.reactionCounts = reactionCounts;
          }
          if (totalReactionCount !== undefined) {
            message.totalReactionCount = totalReactionCount;
          }
          
          console.log("Updated message reactions from server:", message.reactions);
          console.log("Updated reaction counts from server:", message.reactionCounts);
          console.log("Updated total reaction count from server:", message.totalReactionCount);
        }
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
      console.log("Cleared error from Redux state");
    },
    
    updateGroupMessage: (state, action) => {
      const { groupId, messageId, updates } = action.payload;
      if (state.groupMessages[groupId]) {
        const messageIndex = state.groupMessages[groupId].findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          state.groupMessages[groupId][messageIndex] = {
            ...state.groupMessages[groupId][messageIndex],
            ...updates,
          };
        }
      }
    },
    
    deleteGroupMessage: (state, action) => {
      const { groupId, messageId } = action.payload;
      if (state.groupMessages[groupId]) {
        state.groupMessages[groupId] = state.groupMessages[groupId].filter(
          msg => msg.id !== messageId
        );
      }
    },
    
    addGroupMessageReactionLocal: (state, action) => {
      const { groupId, messageId, reaction } = action.payload;
      if (state.groupMessages[groupId]) {
        const messageIndex = state.groupMessages[groupId].findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          if (!state.groupMessages[groupId][messageIndex].reactions) {
            state.groupMessages[groupId][messageIndex].reactions = [];
          }
          state.groupMessages[groupId][messageIndex].reactions.push(reaction);
        }
      }
    },
    
    removeGroupMessageReaction: (state, action) => {
      const { groupId, messageId, reactionId } = action.payload;
      if (state.groupMessages[groupId]) {
        const messageIndex = state.groupMessages[groupId].findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1 && state.groupMessages[groupId][messageIndex].reactions) {
          state.groupMessages[groupId][messageIndex].reactions = 
            state.groupMessages[groupId][messageIndex].reactions.filter(
              reaction => reaction.id !== reactionId
            );
        }
      }
    },
    
    // WebSocket connection management
    setGroupWebSocket: (state, action) => {
      const { groupId, websocket } = action.payload;
      state.groupWebSockets[groupId] = websocket;
    },
    
    removeGroupWebSocket: (state, action) => {
      const { groupId } = action.payload;
      delete state.groupWebSockets[groupId];
    },
    
  },
  extraReducers: (builder) => {
    builder
      // Create Group
      .addCase(createGroup.pending, (state) => {
        state.createGroupLoading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.createGroupLoading = false;
        state.groups.unshift(action.payload.data);
        state.error = null;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.createGroupLoading = false;
        state.error = action.payload;
      })
      
      // Get User Groups
      .addCase(getUserGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload.data;
        state.error = null;
      })
      .addCase(getUserGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get User Groups Paginated
      .addCase(getUserGroupsPaginated.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserGroupsPaginated.fulfilled, (state, action) => {
        state.loading = false;
        state.paginatedGroups = action.payload.data;
        state.error = null;
      })
      .addCase(getUserGroupsPaginated.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Group By ID
      .addCase(getGroupById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroup = action.payload.data;
        state.error = null;
      })
      .addCase(getGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Group
      .addCase(updateGroup.pending, (state) => {
        state.updateGroupLoading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.updateGroupLoading = false;
        const { groupId, data } = action.payload;
        
        // Update in groups array
        const groupIndex = state.groups.findIndex(group => group.id === groupId);
        if (groupIndex !== -1) {
          state.groups[groupIndex] = { ...state.groups[groupIndex], ...data.data };
        }
        
        // Update current group if it's the same
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = { ...state.currentGroup, ...data.data };
        }
        
        state.error = null;
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.updateGroupLoading = false;
        state.error = action.payload;
      })
      
      // Delete Group
      .addCase(deleteGroup.pending, (state) => {
        state.deleteGroupLoading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.deleteGroupLoading = false;
        const groupId = action.payload;
        
        // Remove from groups array
        state.groups = state.groups.filter(group => group.id !== groupId);
        
        // Clear current group if it's the same
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = null;
        }
        
        // Remove group messages
        delete state.groupMessages[groupId];
        delete state.groupMembers[groupId];
        delete state.groupAdmins[groupId];
        
        state.error = null;
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.deleteGroupLoading = false;
        state.error = action.payload;
      })
      
      // Join Group
      .addCase(joinGroup.pending, (state) => {
        state.joinGroupLoading = true;
        state.error = null;
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.joinGroupLoading = false;
        const { groupId, data } = action.payload;
        
        // Add to groups array if not already present
        const existingGroup = state.groups.find(group => group.id === groupId);
        if (!existingGroup) {
          state.groups.unshift(data.data.group);
        }
        
        state.error = null;
      })
      .addCase(joinGroup.rejected, (state, action) => {
        state.joinGroupLoading = false;
        state.error = action.payload;
      })
      
      // Leave Group
      .addCase(leaveGroup.pending, (state) => {
        state.leaveGroupLoading = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.leaveGroupLoading = false;
        const groupId = action.payload;
        
        // Remove from groups array
        state.groups = state.groups.filter(group => group.id !== groupId);
        
        // Clear current group if it's the same
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = null;
        }
        
        // Remove group messages
        delete state.groupMessages[groupId];
        delete state.groupMembers[groupId];
        delete state.groupAdmins[groupId];
        
        state.error = null;
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.leaveGroupLoading = false;
        state.error = action.payload;
      })
      
      // Add Group Member
      .addCase(addGroupMember.fulfilled, (state, action) => {
        const { groupId, data } = action.payload;
        
        // Response structure: { message, status, data: GroupMember }
        const member = data?.data || data;
        
        // Add member to group members if not already present
        if (!state.groupMembers[groupId]) {
          state.groupMembers[groupId] = [];
        }
        
        // Check if member already exists (avoid duplicates)
        const existingIndex = state.groupMembers[groupId].findIndex(
          m => m.user?.id === member?.user?.id || m.id === member?.id
        );
        
        if (existingIndex !== -1) {
          // Update existing member
          state.groupMembers[groupId][existingIndex] = member;
        } else {
          // Add new member
          state.groupMembers[groupId].push(member);
        }
        
        // Update group's active member count if group exists in groups list
        const groupIndex = state.groups.findIndex(g => g.id === groupId);
        if (groupIndex !== -1) {
          const activeCount = state.groupMembers[groupId]?.filter(
            m => m.status === 'ACTIVE'
          ).length || 0;
          state.groups[groupIndex].activeMemberCount = activeCount;
        }
        
        state.error = null;
      })
      .addCase(addGroupMember.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Remove Group Member
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        const { groupId, memberId } = action.payload;
        
        // Remove member from group members (update status to REMOVED or remove from list)
        if (state.groupMembers[groupId]) {
          const memberIndex = state.groupMembers[groupId].findIndex(
            member => member.user?.id === memberId || member.id === memberId
          );
          
          if (memberIndex !== -1) {
            // Update status to REMOVED instead of removing, to maintain history
            state.groupMembers[groupId][memberIndex].status = 'REMOVED';
          }
        }
        
        // Update group's active member count
        const groupIndex = state.groups.findIndex(g => g.id === groupId);
        if (groupIndex !== -1) {
          const activeCount = state.groupMembers[groupId]?.filter(
            m => m.status === 'ACTIVE'
          ).length || 0;
          state.groups[groupIndex].activeMemberCount = activeCount;
        }
        
        state.error = null;
      })
      .addCase(removeGroupMember.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Toggle Group Mute
      .addCase(toggleGroupMute.fulfilled, (state, action) => {
        const { groupId, memberId, isMuted } = action.payload;
        
        // Update member mute status
        if (state.groupMembers[groupId]) {
          const memberIndex = state.groupMembers[groupId].findIndex(
            member => member.user.id === memberId
          );
          if (memberIndex !== -1) {
            state.groupMembers[groupId][memberIndex].isMuted = isMuted;
          }
        }
        
        state.error = null;
      })
      .addCase(toggleGroupMute.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Toggle Group Pin
      .addCase(toggleGroupPin.fulfilled, (state, action) => {
        const { groupId, memberId, isPinned } = action.payload;
        
        // Update member pin status
        if (state.groupMembers[groupId]) {
          const memberIndex = state.groupMembers[groupId].findIndex(
            member => member.user.id === memberId
          );
          if (memberIndex !== -1) {
            state.groupMembers[groupId][memberIndex].isPinned = isPinned;
          }
        }
        
        state.error = null;
      })
      .addCase(toggleGroupPin.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Get Group Members
      .addCase(getGroupMembers.fulfilled, (state, action) => {
        const { groupId, data } = action.payload;
        
        // Handle response structure: data.data or data (array)
        const members = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        state.groupMembers[groupId] = members;
        
        // Update group's active member count if group exists in groups list
        const groupIndex = state.groups.findIndex(g => g.id === groupId);
        if (groupIndex !== -1) {
          const activeCount = members.filter(m => m.status === 'ACTIVE').length;
          state.groups[groupIndex].activeMemberCount = activeCount;
        }
        
        state.error = null;
      })
      .addCase(getGroupMembers.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Get Group Admins
      .addCase(getGroupAdmins.fulfilled, (state, action) => {
        const { groupId, data } = action.payload;
        state.groupAdmins[groupId] = data.data;
        state.error = null;
      })
      .addCase(getGroupAdmins.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Get Public Groups
      .addCase(getPublicGroups.fulfilled, (state, action) => {
        state.publicGroups = action.payload.data;
        state.error = null;
      })
      .addCase(getPublicGroups.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Search Groups
      .addCase(searchGroups.fulfilled, (state, action) => {
        state.searchResults = action.payload.data;
        state.error = null;
      })
      .addCase(searchGroups.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Update Group Image
      .addCase(updateGroupImage.fulfilled, (state, action) => {
        const { groupId, data } = action.payload;
        
        // Update in groups array
        const groupIndex = state.groups.findIndex(group => group.id === groupId);
        if (groupIndex !== -1) {
          state.groups[groupIndex].groupImage = data.data.groupImage;
        }
        
        // Update current group if it's the same
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup.groupImage = data.data.groupImage;
        }
        
        state.error = null;
      })
      .addCase(updateGroupImage.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Update Group Cover Image
      .addCase(updateGroupCoverImage.fulfilled, (state, action) => {
        const { groupId, data } = action.payload;
        
        // Update in groups array
        const groupIndex = state.groups.findIndex(group => group.id === groupId);
        if (groupIndex !== -1) {
          state.groups[groupIndex].groupCoverImage = data.data.groupCoverImage;
        }
        
        // Update current group if it's the same
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup.groupCoverImage = data.data.groupCoverImage;
        }
        
        state.error = null;
      })
      .addCase(updateGroupCoverImage.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Get Group Messages
      .addCase(getGroupMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGroupMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, messages } = action.payload;
        console.log("groupSlice - getGroupMessages.fulfilled:", { groupId, messages });
        state.groupMessages[groupId] = messages;
        console.log("groupSlice - Updated groupMessages:", state.groupMessages);
        state.error = null;
      })
      .addCase(getGroupMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send Group Message
      .addCase(sendGroupMessage.pending, (state) => {
        state.sendingMessage = true;
        state.messageError = null;
      })
      .addCase(sendGroupMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { groupId, data } = action.payload;
        
        if (!state.groupMessages[groupId]) {
          state.groupMessages[groupId] = [];
        }
        state.groupMessages[groupId].push(data.data);
        
        state.messageError = null;
      })
      .addCase(sendGroupMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.messageError = action.payload;
      })
      
      // Send Group Media Message
      .addCase(sendGroupMediaMessage.pending, (state) => {
        state.sendingMessage = true;
        state.messageError = null;
      })
      .addCase(sendGroupMediaMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { groupId, data } = action.payload;
        
        if (!state.groupMessages[groupId]) {
          state.groupMessages[groupId] = [];
        }
        state.groupMessages[groupId].push(data.data);
        
        state.messageError = null;
      })
      .addCase(sendGroupMediaMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.messageError = action.payload;
      })
      
      // Add Group Message Reaction
      .addCase(addGroupMessageReaction.fulfilled, (state, action) => {
        const { groupId, messageId, data } = action.payload;
        
        if (state.groupMessages[groupId]) {
          const messageIndex = state.groupMessages[groupId].findIndex(msg => msg.id === messageId);
          if (messageIndex !== -1) {
            if (!state.groupMessages[groupId][messageIndex].reactions) {
              state.groupMessages[groupId][messageIndex].reactions = [];
            }
            state.groupMessages[groupId][messageIndex].reactions.push(data.data);
          }
        }
        
        state.error = null;
      })
      .addCase(addGroupMessageReaction.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Mark Group Messages As Read
      .addCase(markGroupMessagesAsRead.fulfilled, (state, action) => {
        const groupId = action.payload;
        
        // Update read status for all messages in the group
        if (state.groupMessages[groupId]) {
          state.groupMessages[groupId].forEach(message => {
            if (!message.readBy) {
              message.readBy = [];
            }
            // Add current user to readBy if not already present
            // This would need the current user ID from auth state
          });
        }
        
        state.error = null;
      })
      .addCase(markGroupMessagesAsRead.rejected, (state, action) => {
        state.error = action.payload;
      })
      
  },
});

export const {
  clearGroupsError,
  clearCurrentGroup,
  clearSearchResults,
  addGroupMessage,
  updateGroupMessage,
  deleteGroupMessage,
  addGroupMessageReactionLocal,
  removeGroupMessageReaction,
  addReactionToMessage,
  removeReactionFromMessage,
  updateMessageReactions,
  setGroupWebSocket,
  removeGroupWebSocket,
} = groupSlice.actions;

export default groupSlice.reducer;
