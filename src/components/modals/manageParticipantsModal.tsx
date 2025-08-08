// src/components/modals/manageParticipantsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Anchor,
  Box,
  ModalBody,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@twilio-paste/core";
import { Text } from "@twilio-paste/text";
import { Button } from "@twilio-paste/button";
import { Avatar } from "../Avatar";
import { UserIcon } from "@twilio-paste/icons/cjs/UserIcon";

import ConvoModal from "./ConvoModal";
import MemberProfileViewModal from "./MemberProfileViewModal";
import { Content } from "../../types";
import { ReduxParticipant } from "../../store/reducers/participantsReducer";
import { AppState } from "../../store";
import { getTranslation } from "./../../utils/localUtils";
import { useSelector } from "react-redux";
import { getMemberProfileBatch } from "../../api/member";
import { MemberProfileResponse } from "../../types";

interface ManageParticipantsModalProps {
  participantsCount: number;
  handleClose: () => void;
  isModalOpen: boolean;
  title: string;
  onClick: (content: Content) => void;
  participantsList: ReduxParticipant[];
  onParticipantRemove: (participant: ReduxParticipant) => void;
  isAdmin: boolean;
  /** NEW: list of admin member IDs for this conversation */
  adminIds?: string[];
}

const ManageParticipantsModal: React.FC<ManageParticipantsModalProps> = (
  props
) => {
  const {
    participantsCount,
    handleClose,
    isModalOpen,
    title,
    onClick,
    participantsList,
    onParticipantRemove,
    isAdmin = false,
    adminIds = [], // NEW
  } = props;

  const local = useSelector((state: AppState) => state.local);

  const participants = getTranslation(local, "participants");
  const addParticipant = getTranslation(local, "addParticipant");
  const remove = getTranslation(local, "remove");

  const [participantProfiles, setParticipantProfiles] = useState<
    Record<string, MemberProfileResponse>
  >({});

  const [selectedProfile, setSelectedProfile] =
    useState<MemberProfileResponse | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fast membership checks
  const adminIdSet = useMemo(() => new Set(adminIds), [adminIds]); // NEW

  useEffect(() => {
    const identities = participantsList
      .map((p) => p.identity)
      .filter((id): id is string => typeof id === "string");

    const uniqueIdentities = Array.from(new Set(identities));
    if (uniqueIdentities.length === 0) return;

    getMemberProfileBatch(uniqueIdentities).then((profiles) => {
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.member_id] = profile;
        return acc;
      }, {} as Record<string, MemberProfileResponse>);
      setParticipantProfiles(profileMap);
    });
  }, [participantsList]);

  const getDisplayName = (participant: ReduxParticipant): string => {
    const identity = participant.identity;
    if (!identity) return "unknown";

    const profile = participantProfiles[identity];
    const base =
      profile?.first_name || profile?.last_name
        ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
        : identity;
    return base;
  };

  const showAdmin = (participant: ReduxParticipant): string => {
    const identity = participant.identity;
    if (!identity) return "";

    const profile = participantProfiles[identity];
    const memberId = profile?.member_id ?? identity;
    return adminIdSet.has(memberId) ? " (Admin)" : "";
  };

  const updateConnected = (memberId: string, connected: boolean) => {
    setParticipantProfiles((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        is_connected: connected,
      },
    }));

    if (selectedProfile?.member_id === memberId) {
      setSelectedProfile({
        ...selectedProfile,
        is_connected: connected,
      });
    }
  };

  const handleRemove = (user: ReduxParticipant) => {
    if (!isAdmin) return;
    onParticipantRemove(user);
  };

  const isCurrentUser = (user: ReduxParticipant) =>
    user.identity === localStorage.getItem("username");

  return (
    <>
      <ConvoModal
        handleClose={handleClose}
        isModalOpen={isModalOpen}
        title={title}
        modalBody={
          <ModalBody>
            <Box
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "6px",
              }}
            >
              <Box
                fontFamily="fontFamilyText"
                fontWeight="fontWeightBold"
                fontSize="fontSize30"
                lineHeight="lineHeight60"
              >
                {participants} ({participantsCount})
              </Box>

              {isAdmin && (
                <Button
                  variant="destructive"
                  onClick={() => onClick(Content.AddChat)}
                >
                  {addParticipant}
                </Button>
              )}
            </Box>

            <Box
              style={{
                marginTop: "12px",
                overflow: "hidden",
                overflowY: "auto",
                maxHeight: "500px",
              }}
            >
              <Table>
                <THead hidden>
                  <Tr>
                    <Th width="size10" />
                    <Th width="size40" textAlign="left" />
                    <Th textAlign="right" />
                  </Tr>
                </THead>
                <TBody>
                  {participantsList.length ? (
                    participantsList.map((user) => {
                      const displayName = getDisplayName(user);
                      const adminStr = showAdmin(user);
                      const isSelf = isCurrentUser(user);

                      return (
                        <Tr key={user.sid}>
                          <Td width="size20">
                            <Avatar size="sizeIcon80" name={displayName} />
                          </Td>
                          <Td textAlign="left">
                            <Anchor
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                const identity = user.identity;
                                if (identity && participantProfiles[identity]) {
                                  setSelectedProfile(
                                    participantProfiles[identity]
                                  );
                                  setIsProfileModalOpen(true);
                                }
                              }}
                            >
                              {displayName} {adminStr}
                            </Anchor>
                          </Td>
                          <Td textAlign="right">
                            {isAdmin && !isSelf ? (
                              <Anchor
                                href="#"
                                onClick={() => handleRemove(user)}
                              >
                                {remove}
                              </Anchor>
                            ) : null}
                          </Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        height: "400px",
                      }}
                    >
                      <Box style={{ color: "#606B85" }}>
                        <Box
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            paddingBottom: "12px",
                          }}
                        >
                          <UserIcon
                            decorative={false}
                            title="No participants"
                            size="sizeIcon40"
                            color="colorTextDecorative10"
                          />
                        </Box>
                        <Text
                          as="p"
                          fontSize="fontSize40"
                          style={{ color: "#606B85" }}
                        >
                          No participants
                        </Text>
                      </Box>
                    </Box>
                  )}
                </TBody>
              </Table>
            </Box>
          </ModalBody>
        }
      />

      <MemberProfileViewModal
        isOpen={isProfileModalOpen}
        handleClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfile(null);
        }}
        memberProfile={selectedProfile}
        updateConnected={(connected) => {
          if (selectedProfile) {
            updateConnected(selectedProfile.member_id, connected);
          }
        }}
      />
    </>
  );
};

export default ManageParticipantsModal;
