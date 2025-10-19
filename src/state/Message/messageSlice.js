import { createSlice } from "@reduxjs/toolkit";
import { createChat, createMessage, getAllChats } from "./message.action";

const initialState = {
    messages: [],
    chats: [],
    loading: false,
    error : null,
    message: null
};

const messageSlice = createSlice({
    name: "message",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(createMessage.pending, (state,action)=>{
            return {...state,loading:true,error:null}
        }),
        builder.addCase(createMessage.fulfilled, (state,action)=>{
            return {...state,loading:false,message:action.payload,error:null}
        }),
        builder.addCase(createMessage.rejected, (state,action)=>{
            return {...state,loading:false,error:action.payload}
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
            return {...state,loading:true,error:null}
        }),  
        builder.addCase(getAllChats.fulfilled, (state,action)=>{
            return {...state,loading:false,chats:action.payload,error:null}
        }),
        builder.addCase(getAllChats.rejected, (state,action)=>{
            return {...state,loading:false,error:action.payload}
        }) 
    }
});

export default messageSlice.reducer;