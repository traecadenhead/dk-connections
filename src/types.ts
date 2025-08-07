import { Message, Participant } from "@twilio/conversations";

export type AddMessagesType = (channelSid: string, messages: Message[]) => void;
export type SetSidType = (sid: string) => void;

export type SetParticipantsType = (
  participants: Participant[],
  sid: string
) => void;

export type SetUnreadMessagesType = (
  channelSid: string,
  unreadCount: number
) => void;

export enum ActionName {
  Save = "save",
  Create = "create",
  Manage = "manage",
  Add = "add",
}

export enum InputType {
  Text = "text",
  Password = "password",
}

export enum Content {
  AddChat = "Add chat participant",
  AddSMS = "Add SMS participant",
  AddWhatsApp = "Add WhatsApp participant",
}

export type MenuElement = {
  id: string;
  label: string;
  onClick?: () => void;
  customComponent?: React.ReactNode | ((props: unknown) => React.ReactNode);
  enabled?: boolean;
  hideOnClick?: boolean;
};

export enum Reactions {
  HEART = "heart",
  THUMBS_UP = "thumbs_up",
  LAUGH = "laugh",
  SAD = "sad",
  POUTING = "pouting",
  THUMBS_DOWN = "thumbs_down",
}

export type ReactionsType = {
  [Reactions.HEART]?: string[];
  [Reactions.THUMBS_DOWN]?: string[];
  [Reactions.THUMBS_UP]?: string[];
  [Reactions.SAD]?: string[];
  [Reactions.POUTING]?: string[];
  [Reactions.LAUGH]?: string[];
};

export interface ChapterAffiliation {
  chapter_id: string;
  chapter_name: string;
  affiliation_type: string;
}

export interface MemberProfileResponse {
  member_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  bio: string | null;
  interests: string | null;
  is_connected: boolean;
  chapters: ChapterAffiliation[];
  admin_chapters: ChapterAffiliation[];
  admin_national: boolean;
}

export interface MemberConnectionResponse {
  id: number;
  member_id: string;
  connected_member_id: string;
  created_at: string; // ISO datetime string
  updated_at: string;
  profile?: MemberProfileResponse;
}

export interface MemberConversation {
  id: number;
  sid: string;
  type: ConversationType;
  name: string;
  chapter_id: string | null;
  is_read_only: boolean;
  created_by: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export enum ConversationType {
  PERSONAL = "personal",
  CHAPTER = "chapter",
  NATIONAL = "national",
}

export interface MinimalConversation {
  sid: string;
  name: string;
  type: ConversationType;
  chapterId?: string;
}
