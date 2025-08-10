// src/components/conversation/ConversationContainer.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import { Box } from "@twilio-paste/core";
import { useTheme } from "@twilio-paste/theme";
import { Client } from "@twilio/conversations";

import { AppState, actionCreators } from "../../store";
import ConversationDetails from "./ConversationDetails";
import MessagesBox from "../message/MessagesBox";
import MessageInputField from "../message/MessageInputField";
import ActionErrorModal from "../modals/ActionErrorModal";
import styles from "../../styles";
import { getTranslation } from "../../utils/localUtils";
import { successNotification } from "../../helpers";
import { CONVERSATION_MESSAGES, ERROR_MODAL_MESSAGES } from "../../constants";
import {
  getConversationBySid,
  updateConversationName,
} from "../../api/conversation";
import { ReduxConversation } from "../../store/reducers/convoReducer";
import { MemberConversation } from "../../types";

interface ConvoContainerProps {
  conversation?: ReduxConversation;
  client?: Client;
}

// Exact shape expected by ActionErrorModal
type ModalError = { code: number; message: string } | undefined;

function extractErrorBody(err: unknown): ModalError {
  if (err && typeof err === "object" && "body" in err) {
    const body = (err as { body?: { message?: unknown; code?: unknown } }).body;
    const message =
      typeof body?.message === "string" ? body.message : "Unexpected error";
    const code = typeof body?.code === "number" ? body.code : -1;
    return { code, message };
  }
  if (err instanceof Error) {
    return { code: -1, message: err.message || "Unexpected error" };
  }
  if (typeof err === "string") {
    return { code: -1, message: err };
  }
  return undefined;
}

const ConversationContainer: React.FC<ConvoContainerProps> = ({
  conversation,
  client,
}) => {
  const theme = useTheme();
  const sid = useSelector((state: AppState) => state.sid);
  const memberId = localStorage.getItem("member_id") ?? "";
  const local = useSelector((state: AppState) => state.local);
  const messages = useSelector((state: AppState) => state.messages);
  const loadingStatus = useSelector((state: AppState) => state.loadingStatus);
  const participants =
    useSelector((state: AppState) => state.participants)[sid] ?? [];
  const typingData =
    useSelector((state: AppState) => state.typingData)[sid] ?? [];
  const lastReadIndex = useSelector((state: AppState) => state.lastReadIndex);
  const use24hTimeFormat = useSelector(
    (state: AppState) => state.use24hTimeFormat
  );

  const [fullConversation, setFullConversation] =
    useState<MemberConversation | null>(null);

  // NEW: keep adminIds as top-level state so children can optimistically update it
  const [adminIds, setAdminIds] = useState<string[]>([]);

  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showError, setErrorToShow] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const [errorData, setErrorData] = useState<ModalError>(undefined);

  const dispatch = useDispatch();
  const { pushMessages, updateConversation, addNotifications } =
    bindActionCreators(actionCreators, dispatch);

  // Boolean flag derived from adminIds
  const isAdmin = adminIds.includes(memberId);
  const isReadOnly = fullConversation?.is_read_only;

  // Fetch conversation meta (including admins) on sid change
  useEffect(() => {
    if (!sid) {
      setFullConversation(null);
      setAdminIds([]);
      return;
    }
    getConversationBySid(sid)
      .then((fc) => {
        setFullConversation(fc);
        setAdminIds((fc.admins ?? []).map((a) => a.member_id));
      })
      .catch((e: unknown) => {
        setErrorData(extractErrorBody(e));
        setErrorToShow(ERROR_MODAL_MESSAGES.CHANGE_CONVERSATION_NAME);
        console.error("Failed to fetch conversation:", e);
      });
  }, [sid]);

  const handleUpdateConvoName = async (val: string) => {
    try {
      await updateConversationName(sid, val);
      if (conversation) {
        updateConversation(sid, { friendlyName: val });
      }
      successNotification({
        message: CONVERSATION_MESSAGES.NAME_CHANGED,
        addNotifications,
      });
    } catch (e) {
      setErrorData(extractErrorBody(e));
      setErrorToShow(ERROR_MODAL_MESSAGES.CHANGE_CONVERSATION_NAME);
    }
  };

  const handleDroppedFiles = (files: File[]) => setDroppedFiles(files);
  const greeting = getTranslation(local, "greeting");

  return (
    <Box style={styles.convosWrapperBox}>
      <ActionErrorModal
        errorText={showError ?? ERROR_MODAL_MESSAGES.CHANGE_CONVERSATION_NAME}
        isOpened={!!showError}
        onClose={() => {
          setErrorToShow(null);
          setErrorData(undefined);
        }}
        error={errorData}
      />

      {sid && conversation && client ? (
        <>
          <ConversationDetails
            convoSid={sid}
            convo={conversation}
            participants={participants}
            updateConvoName={isAdmin ? handleUpdateConvoName : undefined}
            isAdmin={isAdmin}
            adminIds={adminIds}
            // NEW: let children notify us to update the admins list optimistically
            onAdminsChange={setAdminIds}
          />

          <MessagesBox
            key={sid}
            convoSid={sid}
            convo={conversation}
            upsertMessage={pushMessages}
            client={client}
            messages={messages[sid]}
            loadingState={loadingStatus}
            participants={participants}
            lastReadIndex={lastReadIndex}
            use24hTimeFormat={use24hTimeFormat}
            handleDroppedFiles={handleDroppedFiles}
          />

          {(!isReadOnly || isAdmin) && (
            <MessageInputField
              convoSid={sid}
              client={client}
              messages={messages[sid]}
              convo={conversation}
              typingData={typingData}
              droppedFiles={droppedFiles}
            />
          )}
        </>
      ) : (
        <Box
          style={{
            display: "flex",
            height: "100%",
            flexDirection: "column",
            justifyContent: "center",
            textAlign: "center",
            fontSize: theme.fontSizes.fontSize30,
            fontWeight: theme.fontWeights.fontWeightNormal,
            lineHeight: "20px",
            color: theme.textColors.colorTextIcon,
          }}
        >
          {greeting}
        </Box>
      )}
    </Box>
  );
};

export default ConversationContainer;
