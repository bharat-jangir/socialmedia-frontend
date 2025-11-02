import { createSlice } from "@reduxjs/toolkit";
import { createChat, createMessage, getAllChats, deleteChat } from "./message.action";

const initialState = {
    messages: [],
    chats: [],
    loading: false,
    loadingChats: false,
    refreshingChats: false, // Separate state for refreshing while keeping existing chats
    loadingMessage: false,
    error : null,
    message: null
};

const messageSlice = createSlice({
    name: "message",
    initialState,
    reducers: {
        // Add message to chat's messages array (for WebSocket messages)
        addMessageToChat: (state, action) => {
            const { chatId, message } = action.payload;
            const chatIndex = state.chats.findIndex(
                (chat) => chat.id === chatId || chat.id?.toString() === chatId?.toString()
            );
            if (chatIndex !== -1) {
                const chat = state.chats[chatIndex];
                // Check if message already exists
                const messageExists = chat.messages?.some(
                    (m) => m.id === message.id || (m.id?.toString() === message.id?.toString())
                );
                if (!messageExists) {
                    chat.messages = chat.messages || [];
                    chat.messages.push(message);
                }
                state.chats[chatIndex] = { ...chat };
            }
        },
        // Update message in chat's messages array
        updateMessageInChat: (state, action) => {
            const { chatId, message } = action.payload;
            if (!message) {
                // If message is null, remove optimistic messages (on error)
                const chatIndex = state.chats.findIndex(
                    (chat) => chat.id === chatId || chat.id?.toString() === chatId?.toString()
                );
                if (chatIndex !== -1) {
                    const chat = state.chats[chatIndex];
                    if (chat.messages) {
                        chat.messages = chat.messages.filter(m => !m.isOptimistic);
                    }
                    state.chats[chatIndex] = { ...chat };
                }
                return;
            }
            const chatIndex = state.chats.findIndex(
                (chat) => chat.id === chatId || chat.id?.toString() === chatId?.toString()
            );
            if (chatIndex !== -1) {
                const chat = state.chats[chatIndex];
                if (chat.messages) {
                    const messageIndex = chat.messages.findIndex(
                        (m) => m.id === message.id || (m.id?.toString() === message.id?.toString())
                    );
                    if (messageIndex !== -1) {
                        chat.messages[messageIndex] = message;
                    } else {
                        chat.messages.push(message);
                    }
                } else {
                    chat.messages = [message];
                }
                state.chats[chatIndex] = { ...chat };
            }
        },
        // Replace optimistic message with real message (like group chat)
        replaceMessageInChat: (state, action) => {
            const { chatId, message } = action.payload;
            const chatIndex = state.chats.findIndex(
                (chat) => chat.id === chatId || chat.id?.toString() === chatId?.toString()
            );
            if (chatIndex !== -1) {
                const chat = state.chats[chatIndex];
                chat.messages = chat.messages || [];
                
                // Remove ALL optimistic messages from this user
                const filteredMessages = chat.messages.filter(
                    (m) => !(m.isOptimistic && m.user?.id === message.user?.id)
                );
                
                // Check if real message already exists
                const hasRealMessage = filteredMessages.some(
                    (m) => (m.id === message.id || m.id?.toString() === message.id?.toString()) && !m.isOptimistic
                );
                
                if (!hasRealMessage) {
                    filteredMessages.push(message);
                }
                
                chat.messages = filteredMessages;
                state.chats[chatIndex] = { ...chat };
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase(createMessage.pending, (state,action)=>{
            return {...state,loading:true,loadingMessage:true,error:null}
        }),
        builder.addCase(createMessage.fulfilled, (state,action)=>{
            const newMessage = action.payload;
            // Add message to the corresponding chat's messages array
            const chatIndex = state.chats.findIndex(
                (chat) => 
                    chat.id === newMessage.chatId || 
                    chat.id?.toString() === newMessage.chatId?.toString()
            );
            
            if (chatIndex !== -1) {
                const chat = state.chats[chatIndex];
                // Initialize messages array if it doesn't exist
                if (!chat.messages) {
                    chat.messages = [];
                }
                // Check if message already exists (avoid duplicates)
                const messageExists = chat.messages.some(
                    (m) => m.id === newMessage.id || (m.id?.toString() === newMessage.id?.toString())
                );
                if (!messageExists) {
                    chat.messages.push(newMessage);
                    // Update the chat in the array
                    state.chats[chatIndex] = { ...chat };
                }
            }
            
            return {
                ...state,
                loading: false,
                loadingMessage: false,
                message: newMessage,
                error: null
            };
        }),
        builder.addCase(createMessage.rejected, (state,action)=>{
            return {...state,loading:false,loadingMessage:false,error:action.payload}
        }),
        builder.addCase(createChat.pending,(state,action)=>{
            return {...state,loading:true,error:null}
        }),
        builder.addCase(createChat.fulfilled,(state,action)=>{
            return {...state,loading:false,chats:[...state.chats,action.payload],error:null}
        }),
        builder.addCase(createChat.rejected,(state,action)=>{
            return {...state,loading:false,error:action.payload}
        }),
        builder.addCase(getAllChats.pending, (state,action)=>{
            // If we already have chats, it's a refresh (show top loader)
            // If no chats, it's initial load (show full loader)
            const isInitialLoad = state.chats.length === 0;
            return {
                ...state,
                loading: true,
                loadingChats: isInitialLoad,
                refreshingChats: !isInitialLoad,
                error: null
            };
        }),  
        builder.addCase(getAllChats.fulfilled, (state,action)=>{
            // Merge new chats with existing ones, updating existing chats and adding new ones
            const newChats = action.payload || [];
            const existingChats = state.chats || [];
            
            // Create a map of new chats by ID for quick lookup
            const newChatsMap = new Map();
            newChats.forEach(chat => {
                newChatsMap.set(chat.id?.toString(), chat);
            });
            
            // If refreshing (existing chats), merge them intelligently
            if (existingChats.length > 0) {
                // Start with existing chats, updating those that exist in new data
                const mergedChats = existingChats.map(existingChat => {
                    const newChat = newChatsMap.get(existingChat.id?.toString());
                    if (newChat) {
                        // Update existing chat but preserve local messages if new chat doesn't have them
                        return {
                            ...existingChat,
                            ...newChat,
                            // Preserve messages array if new chat doesn't have messages or has fewer
                            // This prevents losing messages during refresh
                            messages: 
                                (newChat.messages && newChat.messages.length > 0) 
                                    ? newChat.messages 
                                    : (existingChat.messages || [])
                        };
                    }
                    // Keep existing chat if not in new data (shouldn't happen, but safe)
                    return existingChat;
                });
                
                // Add any new chats that don't exist in current list
                newChats.forEach(newChat => {
                    const exists = mergedChats.some(
                        chat => chat.id?.toString() === newChat.id?.toString()
                    );
                    if (!exists) {
                        mergedChats.push(newChat);
                    }
                });
                
                return {
                    ...state,
                    loading: false,
                    loadingChats: false,
                    refreshingChats: false,
                    chats: mergedChats,
                    error: null
                };
            } else {
                // Initial load - just set the chats
                return {
                    ...state,
                    loading: false,
                    loadingChats: false,
                    refreshingChats: false,
                    chats: newChats,
                    error: null
                };
            }
        }),
        builder.addCase(getAllChats.rejected, (state,action)=>{
            return {
                ...state,
                loading: false,
                loadingChats: false,
                refreshingChats: false,
                error: action.payload
            };
        })
        // Delete Chat
        .addCase(deleteChat.pending, (state) => {
            return {
                ...state,
                loading: true,
                error: null
            };
        })
        .addCase(deleteChat.fulfilled, (state, action) => {
            const deletedChatId = action.payload;
            // Remove deleted chat from chats array
            const updatedChats = state.chats.filter(
                (chat) => chat.id !== deletedChatId && chat.id?.toString() !== deletedChatId?.toString()
            );
            return {
                ...state,
                loading: false,
                chats: updatedChats,
                error: null,
                // Clear current chat if it was the deleted one
                message: state.message?.chatId === deletedChatId ? null : state.message
            };
        })
        .addCase(deleteChat.rejected, (state, action) => {
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        }) 
    }
});

export const { addMessageToChat, updateMessageInChat, replaceMessageInChat } = messageSlice.actions;
export default messageSlice.reducer;