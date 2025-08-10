import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { bindActionCreators } from "redux";
import { Box, Heading, Button } from "@twilio-paste/core";
import { ChevronDownIcon } from "@twilio-paste/icons/esm/ChevronDownIcon";
import { ChevronRightIcon } from "@twilio-paste/icons/esm/ChevronRightIcon";
import { Conversation, Client } from "@twilio/conversations";
import {
  getNationalConversations,
  getChapterConversations,
} from "../../api/conversation";
import { addConversationParticipant } from "../../api/conversation";
import ConversationView from "./ConversationView";
import {
  ChapterAffiliation,
  MinimalConversation,
  ConversationType,
} from "../../types";
import { AppState, actionCreators } from "../../store";

interface GroupedConversationsListProps {
  /** Chapters from the member profile (NOT just admin chapters) */
  memberChapters: ChapterAffiliation[];
  client: Client;
}

const GroupedConversationsList: React.FC<GroupedConversationsListProps> = ({
  memberChapters,
  client,
}) => {
  const sid = useSelector((state: AppState) => state.sid);
  const messages = useSelector((state: AppState) => state.messages);
  const unreadMessages = useSelector((state: AppState) => state.unreadMessages);
  const participants = useSelector((state: AppState) => state.participants);
  const typingData = useSelector((state: AppState) => state.typingData);
  const use24hTimeFormat = useSelector(
    (state: AppState) => state.use24hTimeFormat
  );

  const dispatch = useDispatch();
  const {
    updateCurrentConversation,
    updateParticipants,
    updateUnreadMessages,
    setLastReadIndex,
  } = bindActionCreators(actionCreators, dispatch);

  const [allUserConversations, setAllUserConversations] = useState<
    Conversation[]
  >([]);
  const [nationalSIDs, setNationalSIDs] = useState<Set<string>>(new Set());
  const [chapterSIDsById, setChapterSIDsById] = useState<
    Record<string, Set<string>>
  >({});
  const [unjoinedConversations, setUnjoinedConversations] = useState<
    Record<string, MinimalConversation>
  >({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    national: true,
    personal: true,
  });

  // Ensure each chapter section starts open
  useEffect(() => {
    setVisibility((prev) => {
      const next = { ...prev };
      memberChapters.forEach((c) => {
        if (next[c.chapter_id] === undefined) next[c.chapter_id] = true;
      });
      return next;
    });
  }, [memberChapters]);

  // Helper to page through all subscribed conversations
  const getAllSubscribed = async (): Promise<Conversation[]> => {
    const all: Conversation[] = [];
    let page = await client.getSubscribedConversations();
    all.push(...page.items);
    while (page.hasNextPage) {
      page = await page.nextPage();
      all.push(...page.items);
    }
    return all;
  };

  const loadConversations = async () => {
    try {
      // 1) Fetch national + per-chapter convos for ALL member chapters
      const [nationalConvos, chapterConvosMap] = await Promise.all([
        getNationalConversations(),
        Promise.all(
          memberChapters.map(async (chapter) => {
            const convos = await getChapterConversations(chapter.chapter_id);
            return { chapterId: chapter.chapter_id, convos };
          })
        ),
      ]);

      const nationalMinimal: MinimalConversation[] = nationalConvos.map(
        (c) => ({
          sid: c.sid,
          name: c.name || "Unnamed",
          type: ConversationType.NATIONAL,
        })
      );

      const chapterMinimal: MinimalConversation[] = chapterConvosMap.flatMap(
        ({ chapterId, convos }) =>
          convos.map((c) => ({
            sid: c.sid,
            name: c.name || "Unnamed",
            type: ConversationType.CHAPTER,
            chapterId,
          }))
      );

      // 2) All subscribed convos (paginate!)
      const subscribedItems = await getAllSubscribed();
      const subscribedSids = new Set(subscribedItems.map((c) => c.sid));

      // 3) Anything subscribed that's not national/chapter (known) is "Personal"
      const knownSids = new Set([
        ...nationalMinimal.map((c) => c.sid),
        ...chapterMinimal.map((c) => c.sid),
      ]);

      const personalMinimal: MinimalConversation[] = subscribedItems
        .filter((c) => !knownSids.has(c.sid))
        .map((c) => ({
          sid: c.sid,
          name: c.friendlyName || "Unnamed",
          type: ConversationType.PERSONAL,
        }));

      const allMinimal = [
        ...nationalMinimal,
        ...chapterMinimal,
        ...personalMinimal,
      ];

      // 4) Build concrete objects for subscribed + "join" list for unjoined
      const convoObjects: Conversation[] = [];
      const unjoined: Record<string, MinimalConversation> = {};

      for (const convo of allMinimal) {
        if (subscribedSids.has(convo.sid)) {
          try {
            const convoObj = await client.getConversationBySid(convo.sid);
            convoObjects.push(convoObj);
          } catch (e) {
            console.warn(`Failed to fetch subscribed convo ${convo.sid}`, e);
          }
        } else {
          unjoined[convo.sid] = convo;
        }
      }

      setAllUserConversations(convoObjects);
      setUnjoinedConversations(unjoined);
      setNationalSIDs(new Set(nationalMinimal.map((c) => c.sid)));

      const chapterMap: Record<string, Set<string>> = {};
      for (const convo of chapterMinimal) {
        if (convo.chapterId) {
          if (!chapterMap[convo.chapterId]) {
            chapterMap[convo.chapterId] = new Set();
          }
          chapterMap[convo.chapterId].add(convo.sid);
        }
      }
      setChapterSIDsById(chapterMap);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    loadConversations();

    const onAdded = () => loadConversations();
    const onRemoved = () => loadConversations();

    client.on("conversationAdded", onAdded);
    client.on("conversationRemoved", onRemoved);

    return () => {
      client.off("conversationAdded", onAdded);
      client.off("conversationRemoved", onRemoved);
    };
  }, [client, memberChapters]); // <— important

  const handleJoinConversation = async (sid: string) => {
    try {
      const memberId = localStorage.getItem("member_id") ?? "";
      await addConversationParticipant(sid, memberId);
      const convo = await client.getConversationBySid(sid);
      setAllUserConversations((prev) => [...prev, convo]);
      setUnjoinedConversations((prev) => {
        const updated = { ...prev };
        delete updated[sid];
        return updated;
      });
    } catch (e) {
      console.error("Failed to join conversation:", e);
      alert("Could not join conversation");
    }
  };

  const getLastMessage = (
    convoSid: string,
    convoLoading: string,
    convoEmpty: string,
    typing: string[]
  ) => {
    const convoMessages = messages[convoSid];
    if (!convoMessages) return convoLoading;
    if (typing.length) return "Typing...";
    if (convoMessages.length === 0) return convoEmpty;
    return convoMessages[convoMessages.length - 1].body || "Media message";
  };

  const isMyMessage = (convoSid: string) => {
    const convoMessages = messages[convoSid];
    if (!convoMessages || convoMessages.length === 0) return false;
    const lastMessage = convoMessages[convoMessages.length - 1];
    return lastMessage.author === localStorage.getItem("member_id")
      ? lastMessage
      : false;
  };

  const getUnreadMessagesCount = (convoSid: string) => {
    if (sid === convoSid) return 0;
    return unreadMessages[convoSid] || 0;
  };

  const handleClick = async (convo: Conversation) => {
    try {
      setLastReadIndex(convo.lastReadMessageIndex ?? -1);
      updateCurrentConversation(convo.sid);

      const convoObj = await client.getConversationBySid(convo.sid);
      const convoParticipants = await convoObj.getParticipants();
      updateParticipants(convoParticipants, convo.sid);

      updateUnreadMessages(convo.sid, 0);

      const last = messages[convo.sid];
      if (last?.length) {
        const lastMsg = last[last.length - 1];
        if (lastMsg.index !== -1) {
          await convoObj.advanceLastReadMessageIndex(lastMsg.index);
        }
      }
    } catch (e) {
      console.error("Error loading conversation:", e);
    }
  };

  const renderConvoView = (convo: Conversation) => (
    <ConversationView
      key={convo.sid}
      convoId={convo.sid}
      setSid={updateCurrentConversation}
      currentConvoSid={sid}
      lastMessage={getLastMessage(
        convo.sid,
        "Loading...",
        "No messages yet",
        typingData[convo.sid] ?? []
      )}
      messages={messages[convo.sid] ?? []}
      typingInfo={typingData[convo.sid] ?? []}
      myMessage={isMyMessage(convo.sid)}
      unreadMessagesCount={getUnreadMessagesCount(convo.sid)}
      updateUnreadMessages={updateUnreadMessages}
      participants={participants[convo.sid] ?? []}
      convo={convo}
      use24hTimeFormat={use24hTimeFormat}
      onClick={() => handleClick(convo)}
    />
  );

  const renderJoinButton = (sid: string, name: string) => (
    <Box key={sid} padding="space40">
      <Heading as="h5" variant="heading50">
        {name}
      </Heading>
      <Box marginTop="space30">
        <Button
          variant="destructive"
          onClick={() => handleJoinConversation(sid)}
        >
          Join
        </Button>
      </Box>
    </Box>
  );

  const nationalConversations = allUserConversations.filter((c) =>
    nationalSIDs.has(c.sid)
  );

  const chapterConversationsById: Record<string, Conversation[]> = {};
  for (const [chapterId, sidSet] of Object.entries(chapterSIDsById)) {
    chapterConversationsById[chapterId] = allUserConversations.filter((c) =>
      sidSet.has(c.sid)
    );
  }

  const knownSIDs = new Set([
    ...nationalSIDs,
    ...Object.values(chapterSIDsById).flatMap((set) => Array.from(set)),
  ]);

  const personalConversations = allUserConversations.filter(
    (c) => !knownSIDs.has(c.sid)
  );

  const toggleSection = (key: string) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box id="grouped-conversation-list" marginTop="space60">
      <Box marginBottom="space60">
        <Box
          display="flex"
          alignItems="center"
          onClick={() => toggleSection("national")}
          style={{ cursor: "pointer" }}
        >
          <Box
            as="span"
            display="inline-block"
            position="relative"
            top="-4px"
            marginRight="space30"
          >
            {visibility.national ? (
              <ChevronDownIcon
                decorative={false}
                title="Close"
                size="sizeIcon50"
              />
            ) : (
              <ChevronRightIcon
                decorative={false}
                title="Open"
                size="sizeIcon50"
              />
            )}
          </Box>
          <Heading as="h4" variant="heading40">
            National Conversations
          </Heading>
        </Box>
        {visibility.national && (
          <>
            {nationalConversations.map(renderConvoView)}
            {Object.entries(unjoinedConversations)
              .filter(([sid]) => nationalSIDs.has(sid))
              .map(([sid, { name }]) => renderJoinButton(sid, name))}
          </>
        )}
      </Box>

      {memberChapters.map((chapter) => (
        <Box key={chapter.chapter_id} marginBottom="space60">
          <Box
            display="flex"
            alignItems="center"
            onClick={() => toggleSection(chapter.chapter_id)}
            style={{ cursor: "pointer" }}
          >
            <Box
              as="span"
              display="inline-block"
              position="relative"
              top="-4px"
              marginRight="space30"
            >
              {visibility[chapter.chapter_id] ? (
                <ChevronDownIcon
                  decorative={false}
                  title="Close"
                  size="sizeIcon50"
                />
              ) : (
                <ChevronRightIcon
                  decorative={false}
                  title="Open"
                  size="sizeIcon50"
                />
              )}
            </Box>
            <Heading as="h4" variant="heading40">
              {chapter.chapter_name} Conversations
            </Heading>
          </Box>
          {visibility[chapter.chapter_id] && (
            <>
              {chapterConversationsById[chapter.chapter_id]?.map(
                renderConvoView
              )}
              {Object.entries(unjoinedConversations)
                .filter(([sid]) =>
                  chapterSIDsById[chapter.chapter_id]?.has(sid)
                )
                .map(([sid, { name }]) => renderJoinButton(sid, name))}
            </>
          )}
        </Box>
      ))}

      <Box marginBottom="space60">
        <Box
          display="flex"
          alignItems="center"
          onClick={() => toggleSection("personal")}
          style={{ cursor: "pointer" }}
        >
          <Box
            as="span"
            display="inline-block"
            position="relative"
            top="-4px"
            marginRight="space30"
          >
            {visibility.personal ? (
              <ChevronDownIcon
                decorative={false}
                title="Close"
                size="sizeIcon50"
              />
            ) : (
              <ChevronRightIcon
                decorative={false}
                title="Open"
                size="sizeIcon50"
              />
            )}
          </Box>
          <Heading as="h4" variant="heading40">
            Personal Conversations
          </Heading>
        </Box>
        {visibility.personal && personalConversations.map(renderConvoView)}
      </Box>
    </Box>
  );
};

export default GroupedConversationsList;
