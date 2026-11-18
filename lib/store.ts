import { configureStore } from "@reduxjs/toolkit";

//Import the cart reducer
import cartReducer from "./cartSlice"
//Create the central Redux store
export const store = configureStore({
    reducer:{
       cart: cartReducer,
    },
});

//Get the complete Redux state type
export type RootState = ReturnType<typeof store.getState>;

//export type dispatch function type
export type AppDispatch = typeof store.dispatch;