// src/components/conversation/ConversationContainer.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import { Box } from "@twilio-paste/core";
import { useTheme } from "@twilio-paste/theme";

import { AppState, actionCreators } from "../../store";
import ConversationDetails from "./ConversationDetails";
import MessagesBox from "../message/MessagesBox";
import MessageInputField from "../message/MessageInputField";
import ActionErrorModal from "../modals/ActionErrorModal";
import styles from "../../styles";
import { getTranslation } from "../../utils/localUtils";
import { getSdkConversationObject } from "../../conversations-objects";
import { successNotification } from "../../helpers";
import { CONVERSATION_MESSAGES, ERROR_MODAL_MESSAGES } from "../../constants";
import { getConversationBySid } from "../../api/conversation";
import { ReduxConversation } from "../../store/reducers/convoReducer";
import { MemberConversation, ConversationAdmin } from "../../types";

interface ConvoContainerProps {
  conversation?: ReduxConversation;
  client?: any;
}

const ConversationContainer: React.FC<ConvoContainerProps> = ({
  conversation,
  client,
}) => {
  const theme = useTheme();
  const sid = useSelector((state: AppState) => state.sid);
  const memberId = localStorage.getItem("member_id");
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
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showError, setErrorToShow] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const [errorData, setErrorData] = useState<any>();

  const dispatch = useDispatch();
  const { pushMessages, updateConversation, addNotifications } =
    bindActionCreators(actionCreators, dispatch);

  const sdkConvo = useMemo(() => {
    if (conversation) {
      return getSdkConversationObject(conversation);
    }
  }, [conversation?.sid]);

  const isAdmin = fullConversation?.admins?.some(
    (admin) => admin.member_id === memberId
  );
  const isReadOnly = fullConversation?.is_read_only;

  useEffect(() => {
    if (sid) {
      getConversationBySid(sid)
        .then(setFullConversation)
        .catch((e) => {
          console.error("Failed to fetch conversation:", e);
        });
    }
  }, [sid]);

  const handleDroppedFiles = (files: File[]) => {
    setDroppedFiles(files);
  };

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
            updateConvoName={
              isAdmin
                ? (val: string) => {
                    sdkConvo
                      ?.updateFriendlyName(val)
                      .then((convo) => {
                        updateConversation(convo.sid, convo);
                        successNotification({
                          message: CONVERSATION_MESSAGES.NAME_CHANGED,
                          addNotifications,
                        });
                      })
                      .catch((e) => {
                        setErrorData(e);
                        setErrorToShow(
                          ERROR_MODAL_MESSAGES.CHANGE_CONVERSATION_NAME
                        );
                      });
                  }
                : undefined
            }
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
