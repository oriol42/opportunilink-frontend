// store/useChatStore.ts
// Conversations Link IA persistées en localStorage : la conversation active
// survit aux navigations, et l'historique permet de retrouver/reprendre les
// échanges passés. Aucune donnée serveur — 100% côté client.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage { role: "user" | "assistant"; content: string; ts: number }
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  newConversation: (initial?: ChatMessage[], title?: string) => string;
  setActive: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  deleteConversation: (id: string) => void;
}

const NEW_TITLE = "Nouvelle conversation";
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      activeId: null,

      newConversation: (initial = [], title = NEW_TITLE) => {
        const id = uid();
        const conv: Conversation = {
          id, title, messages: initial, createdAt: Date.now(), updatedAt: Date.now(),
        };
        set(s => ({ conversations: [conv, ...s.conversations], activeId: id }));
        return id;
      },

      setActive: (id) => set({ activeId: id }),

      addMessage: (msg) => set(s => ({
        conversations: s.conversations.map(c =>
          c.id === s.activeId
            ? {
                ...c,
                messages: [...c.messages, msg],
                updatedAt: Date.now(),
                // Le titre reprend le 1er message utilisateur (pour l'historique).
                title: c.title === NEW_TITLE && msg.role === "user"
                  ? msg.content.slice(0, 42) + (msg.content.length > 42 ? "…" : "")
                  : c.title,
              }
            : c),
      })),

      deleteConversation: (id) => set(s => {
        const remaining = s.conversations.filter(c => c.id !== id);
        return {
          conversations: remaining,
          activeId: s.activeId === id ? (remaining[0]?.id ?? null) : s.activeId,
        };
      }),
    }),
    { name: "opportunilink-chat" },
  ),
);
