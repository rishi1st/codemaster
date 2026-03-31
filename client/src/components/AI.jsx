import { useEffect, useRef ,useCallback} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Cpu, User, Bot, Send, Code, Sparkles } from "lucide-react";
import axiosClient from "../utils/axiosClient"; // 👈 apne project structure ke hisaab se path sahi karo
import { addMessage, setLoading , resetChat } from "../redux/aiSlice"; // 👈 path apne redux folder ka


function AI({ problem, language }) {
  const { messages, isLoading } = useSelector((state) => state.ai);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);


  // ✅ Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
  }, [messages]);
  useEffect(() => {
  if (user) {
    dispatch(resetChat({ firstName: user.firstName , problemName : problem.title}));
  } else {
    dispatch(resetChat({}));
  }
}, [dispatch, user , problem]);


  // ✅ Memoized submit handler
  const onSubmit = useCallback(
    async (data) => {
      const userMessage = {
        role: "user",
        parts: [{ text: data.message }],
        timestamp: new Date().toISOString(),
      };

      dispatch(addMessage(userMessage));
      reset();
      dispatch(setLoading(true));

      try {
        const response = await axiosClient.post("/ai/chat", {
          messages: [...messages, userMessage],
          title: problem?.title,
          description: problem?.description,
          testCases: problem?.testCases,
          startCode: problem?.startCode,
          language,
        });

        dispatch(
          addMessage({
            role: "model",
            parts: [{ text: response.data.message }],
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error("API Error:", error);
        dispatch(
          addMessage({
            role: "model",
            parts: [
              {
                text: "❌ Sorry, I'm having trouble connecting right now. Please try again shortly.",
              },
            ],
            timestamp: new Date().toISOString(),
          })
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, messages, problem, language, reset]
  );

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Animation variants
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] min-h-[800px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700/50 flex items-center backdrop-blur-sm">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full blur opacity-75 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-purple-600 to-blue-500 p-2 rounded-full">
            <Cpu size={20} className="text-white" />
          </div>
        </div>
        <div className="ml-3">
          <h2 className="font-semibold text-white">AI Coding Assistant</h2>
          <p className="text-xs text-gray-400">Powered by Rishi</p>
        </div>
        <div className="ml-auto flex items-center">
          <div
            className={`h-2 w-2 rounded-full ${
              isLoading ? "animate-pulse bg-blue-500" : "bg-green-500"
            }`}
          ></div>
          <span className="text-xs text-gray-400 ml-1">
            {isLoading ? "Thinking..." : "Online"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/30"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] flex ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-blue-600 ml-3 ring-2 ring-blue-400/30"
                      : "bg-gradient-to-r from-purple-600 to-blue-500 mr-3 ring-2 ring-purple-400/30"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>

                {/* Message bubble */}
                <div className="flex flex-col">
                  <div
                    className={`rounded-2xl px-4 py-3 prose prose-invert max-w-none ${
                      msg.role === "user"
                        ? "bg-blue-600/90 text-white rounded-br-md"
                        : "bg-gray-800/80 text-white rounded-bl-md"
                    }`}
                  >
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code: ({node, inline, className, children, ...props}) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="relative">
                              <div className="absolute top-0 right-0 px-2 py-1 text-xs bg-gray-900 text-gray-400 rounded-bl-md">
                                {match[1]}
                              </div>
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </div>
                          ) : (
                            <code className="bg-gray-700/50 px-1 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.parts[0].text}
                    </ReactMarkdown>
                  </div>
                  <div
                    className={`text-xs text-gray-500 mt-1 ${
                      msg.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] flex">
              <div className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-500 mr-3 ring-2 ring-purple-400/30">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-800/80 text-white rounded-2xl px-4 py-3 rounded-bl-md">
                <div className="flex space-x-1.5">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="sticky bottom-0 p-4 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700/50"
      >
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              placeholder="Ask me anything about coding..."
              className="w-full bg-gray-700/70 text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 border border-gray-600/50 transition-all duration-300"
              {...register("message", { required: true, minLength: 2 })}
              disabled={isLoading}
            />
            {errors.message && (
              <div className="absolute -top-5 left-0 text-xs text-red-400">
                Message must be at least 2 characters long
              </div>
            )}
          </div>
          <motion.button
            type="submit"
            className="ml-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-xl p-3 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
          >
            <Send size={20} />
          </motion.button>
        </div>
        
        {/* Quick action buttons */}
        {problem && (
          <div className="mt-3 flex flex-wrap gap-2">
            <motion.button
              type="button"
              className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors flex items-center"
              whileHover={{ y: -2 }}
              onClick={() => {
                reset({ message: `Can you explain the approach to solve "${problem.title}"?` });
              }}
            >
              <Code size={12} className="mr-1" /> Explain Approach
            </motion.button>
            <motion.button
              type="button"
              className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors flex items-center"
              whileHover={{ y: -2 }}
              onClick={() => {
                reset({ message: `Show me the optimized solution for "${problem.title}" in ${language}.` });
              }}
            >
              <Sparkles size={12} className="mr-1" /> Optimized Solution
            </motion.button>
          </div>
        )}
      </form>
    </div>
  );
}

export default AI;