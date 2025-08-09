// src/components/modals/addChatMemberModal.tsx
import React, { useEffect, useState, RefObject } from "react";
import {
  ModalBody,
  Box,
  Select,
  Option,
  FormControl,
  Checkbox,
} from "@twilio-paste/core";
import {
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  useTabState,
  TabStateReturn,
} from "@twilio-paste/tabs";
import { MemberConnectionResponse, MemberProfileResponse } from "../../types";
import AddParticipantFooter from "./addParticipantFooter";
import ConvoModal from "./ConvoModal";
import { getMemberConnections } from "../../api/connection";
import MemberSearch from "../member/MemberSearch";

interface AddChatParticipantModalProps {
  name: string;
  setName: (name: string) => void;
  error: string;
  nameInputRef: RefObject<HTMLInputElement>;
  onBack: () => void;
  /** Single-add action (Connections tab) */
  action: (isAdmin: boolean) => void | Promise<void>;
  /** Multi-add action (Search tab) */
  onMultiAdd?: (memberIds: string[], isAdmin: boolean) => void | Promise<void>;
  handleClose: () => void;
  isModalOpen: boolean;
  title: string;
  participantIds: string[];
}

const AddChatParticipantModal: React.FC<AddChatParticipantModalProps> = (
  props
) => {
  const addChatParticipant = "Add Participant";

  const [connectedMembers, setConnectedMembers] = useState<
    MemberConnectionResponse[]
  >([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Twilio Paste controlled tabs
  const tab: TabStateReturn = useTabState({
    baseId: "add-participant-tabs",
    selectedId: "connections",
  });

  // Selected results from MemberSearch (Search tab)
  const [selectedMembers, setSelectedMembers] = useState<
    MemberProfileResponse[]
  >([]);

  const memberId = localStorage.getItem("member_id");

  useEffect(() => {
    let cancelled = false;
    if (!props.isModalOpen || !memberId) return;

    setConnectedMembers([]);

    (async () => {
      try {
        const result = await getMemberConnections(memberId);
        if (cancelled) return;
        const filtered = result.filter(
          (conn) => !props.participantIds.includes(conn.connected_member_id)
        );
        setConnectedMembers(filtered);
      } catch {
        // noop
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId, props.participantIds, props.isModalOpen]);

  const currentTab =
    (tab.selectedId as "connections" | "search") ?? "connections";

  const handleSubmit = async () => {
    if (currentTab === "connections") {
      // Single add from Connections dropdown
      await props.action(isAdmin);
      return;
    }

    // Multi add from Search
    if (selectedMembers.length === 0) return;
    const ids = selectedMembers.map((m) => m.member_id);

    if (props.onMultiAdd) {
      await props.onMultiAdd(ids, isAdmin);
    } else {
      // Fallback: sequential single-adds
      for (const id of ids) {
        props.setName(id);
        // eslint-disable-next-line no-await-in-loop
        await props.action(isAdmin);
      }
    }

    setSelectedMembers([]);
  };

  const isSaveDisabled =
    currentTab === "connections"
      ? !props.name.trim() || !!props.error
      : selectedMembers.length === 0;

  const addBtnLabel =
    selectedMembers.length > 0
      ? `Add ${selectedMembers.length} participant${
          selectedMembers.length > 1 ? "s" : ""
        }`
      : "Add participants";

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
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          >
            <Tabs {...tab}>
              <TabList {...tab} aria-label="Add participant source">
                <Tab {...tab} id="connections">
                  Connections
                </Tab>
                <Tab {...tab} id="search">
                  Search
                </Tab>
              </TabList>

              <TabPanels {...tab}>
                <TabPanel {...tab} tabId="connections">
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
                          {member.profile?.first_name}{" "}
                          {member.profile?.last_name}
                        </Option>
                      ))}
                    </Select>
                  </FormControl>
                </TabPanel>
                <TabPanel {...tab} tabId="search">
                  <MemberSearch
                    allowMultiple
                    excludeIds={props.participantIds}
                    onChangeSelected={setSelectedMembers}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>

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
          isSaveDisabled={isSaveDisabled}
          text={addBtnLabel}
          onBack={props.onBack}
          action={() => void handleSubmit()}
        />
      }
    />
  );
};

export default AddChatParticipantModal;
