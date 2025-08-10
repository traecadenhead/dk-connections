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
import { getSdkConversationObject } from "../../conversations-objects"; // still used for leave()
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
  /** NEW: notify parent (ConversationDetails/Container) when admin list changes */
  onAdminsChange?: (ids: string[]) => void;
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

  // helper: push new admin ids (unique) and notify parent
  const addAdminsOptimistic = (newIds: string[]) => {
    if (!props.onAdminsChange || newIds.length === 0) return;
    const next = Array.from(new Set([...props.adminIds, ...newIds]));
    props.onAdminsChange(next);
  };

  // helper: remove admin id and notify parent
  const removeAdminOptimistic = (memberId: string) => {
    if (!props.onAdminsChange) return;
    if (!props.adminIds.includes(memberId)) return;
    const next = props.adminIds.filter((id) => id !== memberId);
    props.onAdminsChange(next);
  };

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

      const fulfilledIdxs: number[] = [];
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") fulfilledIdxs.push(idx);
      });

      const successes = fulfilledIdxs.length;
      if (successes > 0) {
        successNotification({
          message:
            successes === 1
              ? CONVERSATION_MESSAGES.PARTICIPANT_ADDED
              : `${successes} participants added`,
          addNotifications,
        });
      }

      // Optimistically update admins if we added admins successfully
      if (makeAdmin && successes > 0) {
        const addedIds = fulfilledIdxs.map((i) => memberIds[i]);
        addAdminsOptimistic(addedIds);
      }

      // Surface first rejection (if any)
      const firstRejected = results.find((r) => r.status === "rejected") as
        | PromiseRejectedResult
        | undefined;
      if (firstRejected) {
        setErrorData(extractErrorBody(firstRejected.reason));
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

              // If they were an admin, optimistically drop them
              removeAdminOptimistic(memberId);

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
                // Optimistic admin promotion
                addAdminsOptimistic([memberIdToAdd]);
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
