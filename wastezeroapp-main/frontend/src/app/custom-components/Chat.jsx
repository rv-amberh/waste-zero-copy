"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area"; // Ensure this path is correct
import { Input } from "@/components/ui/input"; // Import shadcn/ui Input
import { Button } from "@/components/ui/button"; // Import shadcn/ui Button
import useAuth from "../hooks/useAuth";
import ReactMarkdown from "react-markdown";

const Chat = ({ user }) => {
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  // const { user, userId } = useAuth();
  const [createdAt, setCreatedAt] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state for Firebase user
  const [messages, setMessages] = useState([
    {
      message: "How may I assist you today?",
      sender: "assistant",
      created_at: new Date().toISOString(), // Timestamp for the default message
    },
  ]);

  useEffect(() => {
    sessionStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // This ensures that we only attempt to fetch messages after user state is updated
    if (user) {
      setLoading(false); // Set loading to false once user state is available
    }
  }, [user]); // Run this effect whenever `user` state changes

  useEffect(() => {
    console.log("User is defined:", user); // Lo
    if (user) {
      const fetchMessages = async () => {
        const userId = user.uid;
        const res = await fetch(
          `https://wastezeroapp.onrender.com/api/messages/${userId}`
        );
        const data = await res.json();
        data.messages.push({
          message: "How may I assist you today? 😀",
          sender: "assistant",
          created_at: new Date().toISOString(), // Timestamp for the default message
        });
        setMessages(data.messages);
      };

      fetchMessages();
    }
  }, []);

  useEffect(() => {
    setCreatedAt(new Date().toISOString()); // Set value once mounted
  }, []);

  const sendMessage = async () => {
    if (user) {
      try {
        const userMessage = {
          message,
          sender: "user",
          userId: user.uid,
          createdAt,
        };

        setMessages((prev) => [...prev, userMessage]);
        const savedMessages =
          JSON.parse(sessionStorage.getItem("messages")) || [];
        savedMessages.push(userMessage);
        sessionStorage.setItem("messages", JSON.stringify(savedMessages));
        setMessage("");

        const res = await fetch("https://wastezeroapp.onrender.com/api/chat", {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userMessage),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch response");
        }

        const data = await res.json();
        console.log("Data", data);

        const chatResponse = {
          message: data.reply,
          sender: "assistant",
          createdAt: data.assistant_created_at,
        };
        setMessages((prev) => [...prev, chatResponse]);
        savedMessages.push(chatResponse);
        sessionStorage.setItem("messages", JSON.stringify(savedMessages));
      } catch (error) {
        console.error(error, "error");
      }
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = document.getElementById(
        `message-${messages.length - 1}`
      );
      lastMessage?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  // If user is not authenticated or loading
  if (loading) {
    return <div>Loading...</div>; //fallback
  }

  return (
    <div className="flex flex-col mt-6 hover:scale-105 shadow-gray-400 hover:shadow-lg pt-6 relative w-full max-w-[400px] mx-auto h-[400px]  border rounded-lg shadow-md">
      {/* Chat Messages Scrollable Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {messages.map((msg, index) => (
            <div
              className="flex flex-col gap-2"
              id={`message-${index}`}
              key={index}
            >
              <div
                className={`p-2 rounded-lg text-[12px] max-w-[75%] ${
                  msg.sender === "user"
                    ? "bg-[#A9CBAE] text-white self-end"
                    : "bg-gray-300 text-black self-start"
                }`}
              >
                <ReactMarkdown>{msg.message}</ReactMarkdown>
              </div>
              <p
                className={`text-gray-300 text-[9px] ${
                  msg.sender === "user" ? "self-end mr-2" : "self-start ml-2"
                }`}
              >
                {msg.created_at}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input & Send Button */}
      <div className="p-3 border-t flex gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          className="flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button className="hover:scale-105" onClick={sendMessage}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chat;
