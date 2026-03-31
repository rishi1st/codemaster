import { createSlice } from "@reduxjs/toolkit";

const aiSlice = createSlice({
  name: "ai",
  initialState: {
    messages: [],
    isLoading: false,
  },
  reducers: {
    addMessage: (state, action) => {
      const payload = {
        ...action.payload,
        timestamp: action.payload.timestamp
          ? new Date(action.payload.timestamp).toISOString()
          : new Date().toISOString(),
      };
      state.messages.push(payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    resetChat: (state, action) => {
      const name = action.payload?.firstName || "Coder";
      const problem = action.payload?.problemName;

      let greeting = `Hello ${name}! 👋 I'm your AI coding assistant.`;

      if (problem) {
        greeting += ` Ready to help you with **${problem}** 🚀`;
      } else {
        greeting += ` How can I assist you today? 💡`;
      }

      state.messages = [
        {
          role: "model",
          parts: [{ text: greeting }],
          timestamp: new Date().toISOString(),
        },
      ];
      state.isLoading = false;
    },
  },
});

export const { addMessage, setLoading, resetChat } = aiSlice.actions;
export default aiSlice.reducer;
