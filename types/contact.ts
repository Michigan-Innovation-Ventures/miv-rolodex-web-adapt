export interface ContactFields {
  name: string;
  title: string;
  company: string;
  email: string;
  expertise: string;
  bio: string;
}

export interface Contact extends ContactFields {
  contact_id: string;
  created_at?: string;
}

export interface SearchResult extends ContactFields {
  id: string;
  score: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  results?: SearchResult[];
}
