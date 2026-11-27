"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  MessageCircle,
} from "lucide-react";

type Message = {
  id: number;
  text: string;
  time: string;
  from: "customer" | "admin";
};

type Conversation = {
  id: number;
  name: string;
  email: string;
  initials: string;
  color: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
};

type ApiMessage = {
  id: number;
  sender_role: string;
  message: string;
  created_at: string;
  sender_name?: string;
};

type ApiConversation = {
  id: number;
  customer_id: number;
  status: string;
  customer_name?: string;
  customer_email?: string;
  name?: string;
  email?: string;
  last_message?: string;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
};

const colors = [
  "bg-purple-100 text-purple-700",
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-green-100 text-green-700",
];

function formatTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function mapConversation(row: ApiConversation, index: number): Conversation {
  const name = row.customer_name || row.name || `Customer ${row.customer_id}`;

  return {
    id: row.id,
    name,
    email: row.customer_email || row.email || "",
    initials: getInitials(name),
    color: colors[index % colors.length],
    lastMessage: row.last_message || "No messages yet",
    time: formatTime(row.last_message_at || row.updated_at || row.created_at),
    unread: 0,
    messages: [],
  };
}

function mapMessage(row: ApiMessage): Message {
  return {
    id: row.id,
    text: row.message,
    time: formatTime(row.created_at),
    from: row.sender_role === "user" ? "customer" : "admin",
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Load all conversations
  async function loadConversations() {
    setLoadingConversations(true);
    setError("");

    try {
      const response = await fetch("/api/admin/messages");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load conversations.");
      }

      const rows: ApiConversation[] = result.data || [];
      const mapped = rows.map(mapConversation);

      setConversations(mapped);

      setSelectedId((current) => {
        if (current && mapped.some((item) => item.id === current)) {
          return current;
        }

        return mapped[0]?.id ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoadingConversations(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages for the selected conversation
  useEffect(() => {
    if (selectedId === null) return;

    let cancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      setError("");

      try {
        const response = await fetch(
          `/api/admin/messages/${selectedId}`
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load messages.");
        }

        const messages: Message[] = (result.data || []).map(mapMessage);

        if (!cancelled) {
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === selectedId
                ? {
                    ...conversation,
                    messages,
                    lastMessage:
                      messages[messages.length - 1]?.text ||
                      "No messages yet",
                  }
                : conversation
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const filteredConversations = conversations.filter((conversation) =>
    `${conversation.name} ${conversation.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function selectConversation(id: number) {
    setSelectedId(id);
    setMessageText("");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = messageText.trim();

    if (!text || selectedId === null || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/messages/${selectedId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: text }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send message.");
      }

      setMessageText("");

      // Reload the conversation so the saved message appears
      const messageResponse = await fetch(
        `/api/admin/messages/${selectedId}`
      );
      const messageResult = await messageResponse.json();

      if (!messageResponse.ok || !messageResult.success) {
        throw new Error(
          messageResult.message || "Message sent, but refresh failed."
        );
      }

      const messages: Message[] = (messageResult.data || []).map(mapMessage);

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedId
            ? {
                ...conversation,
                messages,
                lastMessage:
                  messages[messages.length - 1]?.text || text,
                time: messages[messages.length - 1]?.time || "",
              }
            : conversation
        )
      );

      await loadConversations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 pt-20 sm:p-6 sm:pt-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage customer conversations and support requests.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid h-[calc(100vh-180px)] min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <aside className="flex min-h-0 flex-col border-b border-gray-200 md:border-b-0 md:border-r">
          <div className="border-b border-gray-100 p-4">
            <h2 className="mb-3 font-semibold text-gray-900">
              Conversations
            </h2>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3">
              <Search size={17} className="text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <p className="p-4 text-sm text-gray-500">
                Loading conversations...
              </p>
            ) : filteredConversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No conversations found.
              </p>
            ) : (
              filteredConversations.map((conversation) => {
                const active = conversation.id === selectedId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => selectConversation(conversation.id)}
                    className={`flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 ${
                      active ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${conversation.color}`}
                    >
                      {conversation.initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {conversation.name}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">
                          {conversation.time}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat panel */}
        {selectedConversation ? (
          <div className="flex min-h-0 flex-col">
            <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${selectedConversation.color}`}
                >
                  {selectedConversation.initials}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-gray-900">
                    {selectedConversation.name}
                  </h2>
                  <p className="truncate text-xs text-gray-500">
                    {selectedConversation.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-gray-500">
                <button
                  type="button"
                  aria-label="Call customer"
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <Phone size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Video call"
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <Video size={18} />
                </button>
                <button
                  type="button"
                  aria-label="More conversation options"
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 sm:p-6">
              {loadingMessages ? (
                <p className="text-center text-sm text-gray-500">
                  Loading messages...
                </p>
              ) : selectedConversation.messages.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  No messages in this conversation yet.
                </p>
              ) : (
                selectedConversation.messages.map((message) => {
                  const isAdmin = message.from === "admin";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isAdmin ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                          isAdmin
                            ? "rounded-br-sm bg-blue-600 text-white"
                            : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {message.text}
                        </p>
                        <p
                          className={`mt-1 text-right text-xs ${
                            isAdmin ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {message.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={sendMessage}
              className="flex items-center gap-2 border-t border-gray-200 bg-white p-3 sm:p-4"
            >
              <button
                type="button"
                aria-label="Attach file"
                className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:block"
              >
                <Paperclip size={20} />
              </button>

              <input
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Type your message..."
                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <MessageCircle size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">
              {loadingConversations
                ? "Loading conversations..."
                : "Select a conversation"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Choose a customer to view their messages.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}