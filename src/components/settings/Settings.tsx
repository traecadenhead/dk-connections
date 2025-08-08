import React, { useState, createRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";

import { Client } from "@twilio/conversations";

import SettingsMenu from "./SettingsMenu";
import ManageParticipantsModal from "../modals/manageParticipantsModal";
import { Content } from "../../types";
import { removeParticipant } from "../../api";
import {
  addConversationParticipant,
  addConversationAdmin,
} from "../../api/conversation";

import AddChatParticipantModal from "../modals/addChatMemberModal";
import { actionCreators } from "../../store";
import ActionErrorModal from "../modals/ActionErrorModal";
import { CONVERSATION_MESSAGES, ERROR_MODAL_MESSAGES } from "../../constants";
import {
  successNotification,
  unexpectedErrorNotification,
  extractErrorBody,
} from "../../helpers";
import { ReduxConversation } from "../../store/reducers/convoReducer";
import {
  getSdkConversationObject,
  getSdkParticipantObject,
} from "../../conversations-objects";
import { ReduxParticipant } from "../../store/reducers/participantsReducer";
import { AppState } from "../../store";
import { getTranslation } from "./../../utils/localUtils";

interface SettingsProps {
  participants: ReduxParticipant[];
  client?: Client;
  convo: ReduxConversation;
  isManageParticipantOpen: boolean;
  setIsManageParticipantOpen: (open: boolean) => void;
  isAdmin: boolean;
  adminIds: string[];
}

const Settings: React.FC<SettingsProps> = (props: SettingsProps) => {
  const handleParticipantClose = () => props.setIsManageParticipantOpen(false);

  const [isAddChatOpen, setIsAddChatOpen] = useState(false);
  // TODO: move to app loading state
  // const [isLoading, setLoading] = useState(false);
  const handleChatOpen = () => setIsAddChatOpen(true);
  const handleChatClose = () => setIsAddChatOpen(false);

  const local = useSelector((state: AppState) => state.local);
  const manageParticipants = getTranslation(local, "manageParticipants");

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const [showError, setErrorToShow] = useState<
    | {
        title: string;
        description: string;
      }
    | false
  >();
  const [errorData, setErrorData] = useState<
    | {
        message: string;
        code: number;
      }
    | undefined
  >();

  const nameInputRef = createRef<HTMLInputElement>();

  const dispatch = useDispatch();
  const { updateCurrentConversation, addNotifications } = bindActionCreators(
    actionCreators,
    dispatch
  );

  const sdkConvo = useMemo(
    () => getSdkConversationObject(props.convo),
    [props.convo.sid]
  );

  function emptyData() {
    setName("");
    setError("");
  }

  function setErrors(errorText: string) {
    setError(errorText);
  }

  return (
    <>
      <SettingsMenu
        onParticipantListOpen={() => props.setIsManageParticipantOpen(true)}
        leaveConvo={async () => {
          try {
            await sdkConvo.leave();
            successNotification({
              message: CONVERSATION_MESSAGES.LEFT,
              addNotifications,
            });
            updateCurrentConversation("");
          } catch (e) {
            unexpectedErrorNotification(e.message, addNotifications);
          }
        }}
        conversation={props.convo}
        addNotifications={addNotifications}
      />
      <ActionErrorModal
        errorText={showError || ERROR_MODAL_MESSAGES.CHANGE_CONVERSATION_NAME}
        isOpened={!!showError}
        onClose={() => {
          setErrorToShow(false);
          setErrorData(undefined);
        }}
        error={errorData}
      />
      {props.isManageParticipantOpen && (
        <ManageParticipantsModal
          handleClose={handleParticipantClose}
          isModalOpen={props.isManageParticipantOpen}
          title={manageParticipants}
          participantsCount={props.participants.length}
          participantsList={props.participants}
          onClick={(content: Content) => {
            handleParticipantClose();
            switch (content) {
              case Content.AddChat:
                handleChatOpen();
                return null;
              default:
                return null;
            }
          }}
          onParticipantRemove={async (participant) => {
            await removeParticipant(
              sdkConvo,
              getSdkParticipantObject(participant),
              addNotifications
            );
          }}
          isAdmin={props.isAdmin}
          adminIds={props.adminIds}
        />
      )}
      {isAddChatOpen && (
        <AddChatParticipantModal
          name={name}
          isModalOpen={isAddChatOpen}
          title={manageParticipants}
          setName={(v: string) => {
            setName(v);
            setErrors("");
          }}
          error={error}
          nameInputRef={nameInputRef}
          handleClose={() => {
            emptyData();
            handleChatClose();
          }}
          onBack={() => {
            emptyData();
            handleChatClose();
            props.setIsManageParticipantOpen(true);
          }}
          action={async (makeAdmin: boolean) => {
            try {
              const conversationSid = props.convo.sid;
              const memberIdToAdd = name.trim();

              if (!memberIdToAdd) return;

              if (makeAdmin) {
                await addConversationAdmin(conversationSid, memberIdToAdd);
              } else {
                await addConversationParticipant(
                  conversationSid,
                  memberIdToAdd
                );
              }

              emptyData();
              handleChatClose();

              // Reopen manage participants so the user sees the update
              props.setIsManageParticipantOpen(true);
            } catch (e: unknown) {
              setErrorData(extractErrorBody(e));
              setErrorToShow(ERROR_MODAL_MESSAGES.ADD_PARTICIPANT);
            }
          }}
          participantIds={props.participants.map((p) => p.identity || "")}
        />
      )}

      {/* {isLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="absolute"
          height="100%"
          width="100%"
        >
          <Spinner size="sizeIcon110" decorative={false} title="Loading" />
        </Box>
      ) : null} */}
    </>
  );
};

export default Settings;
