import React, { useState, createRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";

import { Client } from "@twilio/conversations";

import SettingsMenu from "./SettingsMenu";
import ManageParticipantsModal from "../modals/manageParticipantsModal";
import { Content } from "../../types";
import {
  addConversationParticipant,
  addConversationAdmin,
  removeConversationParticipant,
  removeConversation,
} from "../../api/conversation";

import AddChatParticipantModal from "../modals/addChatMemberModal";
import { actionCreators } from "../../store";
import ActionErrorModal from "../modals/ActionErrorModal";
import { CONVERSATION_MESSAGES, ERROR_MODAL_MESSAGES } from "../../constants";
import { successNotification, extractErrorBody } from "../../helpers";
import { ReduxConversation } from "../../store/reducers/convoReducer";
import { getSdkConversationObject } from "../../conversations-objects";
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

  // Bulk add handler for MemberSearch multi-select
  const handleMultiAdd = async (memberIds: string[], makeAdmin: boolean) => {
    if (!memberIds.length) return;

    try {
      const sid = props.convo.sid;

      const results = await Promise.allSettled(
        memberIds.map((mid) =>
          makeAdmin
            ? addConversationAdmin(sid, mid)
            : addConversationParticipant(sid, mid)
        )
      );

      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results
        .map((r, idx) => ({ r, idx }))
        .filter((x) => x.r.status === "rejected");

      if (successes > 0) {
        successNotification({
          message:
            successes === 1
              ? CONVERSATION_MESSAGES.PARTICIPANT_ADDED
              : `${successes} participants added`,
          addNotifications,
        });
      }

      if (failures.length > 0) {
        // surface first error (or aggregate)
        const firstErr = failures[0].r as PromiseRejectedResult;
        setErrorData(extractErrorBody(firstErr.reason));
        setErrorToShow(ERROR_MODAL_MESSAGES.ADD_PARTICIPANT);
      }

      // Close the modal and reopen Manage Participants so changes are visible
      handleChatClose();
      props.setIsManageParticipantOpen(true);
    } catch (e: unknown) {
      setErrorData(extractErrorBody(e));
      setErrorToShow(ERROR_MODAL_MESSAGES.ADD_PARTICIPANT);
    }
  };

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
          } catch (e: unknown) {
            setErrorData(extractErrorBody(e));
          }
        }}
        conversation={props.convo}
        addNotifications={addNotifications}
        isAdmin={props.isAdmin}
        onDeleteConversation={async () => {
          await removeConversation(props.convo.sid);
          successNotification({
            message: "Conversation deleted",
            addNotifications,
          });
          updateCurrentConversation("");
        }}
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
            const memberId = participant.identity ?? "";
            if (!memberId) return;

            try {
              await removeConversationParticipant(props.convo.sid, memberId);
              successNotification({
                message: CONVERSATION_MESSAGES.PARTICIPANT_REMOVED,
                addNotifications,
              });

              const myId = localStorage.getItem("member_id");
              if (memberId === myId) {
                updateCurrentConversation("");
              }
            } catch (e: unknown) {
              setErrorData(extractErrorBody(e));
              setErrorToShow(ERROR_MODAL_MESSAGES.REMOVE_PARTICIPANT);
            }
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
          // Single add (Connections tab)
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
              props.setIsManageParticipantOpen(true);
            } catch (e: unknown) {
              setErrorData(extractErrorBody(e));
              setErrorToShow(ERROR_MODAL_MESSAGES.ADD_PARTICIPANT);
            }
          }}
          // Multi add (Search tab)
          onMultiAdd={handleMultiAdd}
          participantIds={props.participants.map((p) => p.identity || "")}
        />
      )}
    </>
  );
};

export default Settings;
