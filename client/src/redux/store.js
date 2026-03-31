import { configureStore } from "@reduxjs/toolkit";
import authReducer from './authSlice'
import aiReducer, { resetChat } from "./aiSlice";
export const store = configureStore({
                    reducer:{
                       auth:authReducer,  // sliceName : reducer
                       ai: aiReducer,
                    }
})