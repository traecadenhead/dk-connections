// src/components/modals/addChatMemberModal.tsx
import React, { useEffect, useState, RefObject } from "react";
import {
  ModalBody,
  Box,
  Select,
  Option,
  FormControl,
  Checkbox, // NEW
} from "@twilio-paste/core";
import { MemberConnectionResponse } from "../../types";
import AddParticipantFooter from "./addParticipantFooter";
import { ActionName } from "../../types";
import ConvoModal from "./ConvoModal";
import { AppState } from "../../store";
import { getTranslation } from "./../../utils/localUtils";
import { useSelector } from "react-redux";
import { getMemberConnections } from "../../api/connection";

interface AddChatParticipantModalProps {
  name: string;
  setName: (name: string) => void;
  error: string;
  nameInputRef: RefObject<HTMLInputElement>;
  onBack: () => void;
  /** changed: now passes whether the new participant should be admin */
  action: (isAdmin: boolean) => void;
  handleClose: () => void;
  isModalOpen: boolean;
  title: string;
  participantIds: string[];
}

const AddChatParticipantModal: React.FC<AddChatParticipantModalProps> = (
  props
) => {
  const local = useSelector((state: AppState) => state.local);
  const addChatParticipant = getTranslation(local, "addChatParticipant");

  const [connectedMembers, setConnectedMembers] = useState<
    MemberConnectionResponse[]
  >([]);

  const [isAdmin, setIsAdmin] = useState(false); // NEW

  const memberId = localStorage.getItem("member_id");

  useEffect(() => {
    const fetchConnections = async () => {
      if (!memberId) return;
      try {
        const result = await getMemberConnections(memberId);
        const filtered = result.filter(
          (conn) => !props.participantIds.includes(conn.connected_member_id)
        );
        setConnectedMembers(filtered);
      } catch (err) {
        console.error("Failed to fetch connected members:", err);
      }
    };

    fetchConnections();
  }, [memberId, props.participantIds]);

  return (
    <ConvoModal
      handleClose={props.handleClose}
      isModalOpen={props.isModalOpen}
      title={props.title}
      modalBody={
        <ModalBody>
          <h3>{addChatParticipant}</h3>
          <Box
            as="form"
            onKeyPress={async (e) => {
              if (e.key === "Enter") {
                if (props.action) {
                  e.preventDefault();
                  props.action(isAdmin); // pass admin flag
                }
              }
            }}
          >
            <FormControl>
              <Select
                id="connected-member-select"
                value={props.name}
                onChange={(e) => props.setName(e.target.value)}
              >
                <Option value="" disabled>
                  -- Select a member you're connected with --
                </Option>
                {connectedMembers.map((member) => (
                  <Option
                    key={member.profile?.member_id}
                    value={member.profile?.member_id ?? ""}
                  >
                    {member.profile?.first_name} {member.profile?.last_name}
                  </Option>
                ))}
              </Select>
            </FormControl>

            <Box marginTop="space60">
              <Checkbox
                id="make-admin"
                checked={isAdmin}
                onChange={() => setIsAdmin((prev) => !prev)}
              >
                Make this participant an admin of this conversation
              </Checkbox>
            </Box>
          </Box>
        </ModalBody>
      }
      modalFooter={
        <AddParticipantFooter
          isSaveDisabled={!props.name.trim() || !!props.error}
          actionName={ActionName.Add}
          onBack={props.onBack}
          action={() => props.action(isAdmin)} // pass admin flag
        />
      }
    />
  );
};

export default AddChatParticipantModal;
