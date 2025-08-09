// src/components/modals/MemberConnectionsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  ModalBody,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  Text,
  Anchor,
  Button,
} from "@twilio-paste/core";
import {
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  useTabState,
} from "@twilio-paste/tabs";
import { useSelector } from "react-redux";
import { AppState } from "../../store";
import { getTranslation } from "../../utils/localUtils";
import {
  getMemberConnections,
  removeConnection,
  createConnection,
} from "../../api/connection";
import { MemberConnectionResponse, MemberProfileResponse } from "../../types";

import ConvoModal from "./ConvoModal";
import MemberProfileViewModal from "./MemberProfileViewModal";
import { Avatar } from "../Avatar";
import { UserIcon } from "@twilio-paste/icons/cjs/UserIcon";
import { DeleteIcon } from "@twilio-paste/icons/esm/DeleteIcon";
import MemberSearch from "../member/MemberSearch";

interface MemberConnectionsModalProps {
  isOpen: boolean;
  handleClose: () => void;
}

const MemberConnectionsModal: React.FC<MemberConnectionsModalProps> = ({
  isOpen,
  handleClose,
}) => {
  const local = useSelector((state: AppState) => state.local);
  const memberId = localStorage.getItem("member_id");

  const title = getTranslation(local, "myConnectionsTxt");

  const [connections, setConnections] = useState<MemberConnectionResponse[]>(
    []
  );
  const [selectedProfile, setSelectedProfile] =
    useState<MemberProfileResponse | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Search tab state
  const [selectedMembers, setSelectedMembers] = useState<
    MemberProfileResponse[]
  >([]);
  const [isAdding, setIsAdding] = useState(false);

  // Paste Tabs state (drives which tab is active)
  const tabs = useTabState({
    baseId: "connections-tabs",
    selectedId: "connections",
  });
  const onSearchTab = (tabs.selectedId as string) === "search";

  useEffect(() => {
    if (!memberId || !isOpen) return;

    let cancelled = false;

    const fetchConnections = async () => {
      try {
        const result = await getMemberConnections(memberId);
        if (!cancelled) setConnections(result);
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch connections:", err);
      }
    };

    fetchConnections();
    return () => {
      cancelled = true;
    };
  }, [memberId, isOpen]);

  const handleRemoveConnection = async (connectedMemberId: string) => {
    if (!memberId) return;

    try {
      await removeConnection({
        member_id: memberId,
        connected_member_id: connectedMemberId,
      });

      setConnections((prev) =>
        prev.filter((conn) => conn.connected_member_id !== connectedMemberId)
      );
    } catch (err) {
      console.error("Failed to remove connection:", err);
    }
  };

  const handleAddConnections = async () => {
    if (!memberId || selectedMembers.length === 0) return;
    try {
      setIsAdding(true);

      const existingIds = new Set(
        connections.map((c) => c.connected_member_id)
      );
      const toCreate = selectedMembers.filter(
        (m) => !existingIds.has(m.member_id) && m.member_id !== memberId
      );

      await Promise.all(
        toCreate.map((m) =>
          createConnection({
            member_id: memberId,
            connected_member_id: m.member_id,
          }).catch((err) => {
            console.error("Failed to add connection:", m.member_id, err);
          })
        )
      );

      const refreshed = await getMemberConnections(memberId);
      setConnections(refreshed);

      // Clear selection after adding
      setSelectedMembers([]);
    } catch (err) {
      console.error("Failed to add connections:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const existingIds = useMemo(
    () => connections.map((c) => c.connected_member_id),
    [connections]
  );
  const excludeIds = useMemo(
    () => [...existingIds, memberId ?? ""],
    [existingIds, memberId]
  );

  const addBtnLabel =
    selectedMembers.length > 0
      ? `Add ${selectedMembers.length} connection${
          selectedMembers.length > 1 ? "s" : ""
        }`
      : "Add connections";

  return (
    <>
      <ConvoModal
        handleClose={handleClose}
        isModalOpen={isOpen}
        title={title}
        modalBody={
          <ModalBody>
            <Tabs {...tabs}>
              <TabList {...tabs} aria-label="Connections">
                <Tab {...tabs} id="connections">
                  My connections
                </Tab>
                <Tab {...tabs} id="search">
                  Search members
                </Tab>
              </TabList>

              <TabPanels {...tabs}>
                {/* Tab 1: Current connections */}
                <TabPanel {...tabs} tabId="connections">
                  <Box
                    style={{
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
                        {connections.length ? (
                          connections.map((conn) => {
                            const profile = conn.profile;
                            if (!profile) return null;

                            const fullName = `${profile.first_name ?? ""} ${
                              profile.last_name ?? ""
                            }`.trim();

                            return (
                              <Tr key={conn.id}>
                                <Td width="size20">
                                  <Avatar size="sizeIcon80" name={fullName} />
                                </Td>
                                <Td textAlign="left">
                                  <Anchor
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedProfile(profile);
                                      setIsProfileModalOpen(true);
                                    }}
                                  >
                                    {fullName}
                                  </Anchor>
                                </Td>
                                <Td textAlign="right">
                                  <Button
                                    variant="destructive_icon"
                                    size="icon"
                                    onClick={() =>
                                      handleRemoveConnection(profile.member_id)
                                    }
                                  >
                                    <DeleteIcon
                                      decorative={false}
                                      title="Remove connection"
                                    />
                                  </Button>
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
                                  title="No connections"
                                  size="sizeIcon40"
                                  color="colorTextDecorative10"
                                />
                              </Box>
                              <Text
                                as="p"
                                fontSize="fontSize40"
                                style={{ color: "#606B85" }}
                              >
                                No connections
                              </Text>
                            </Box>
                          </Box>
                        )}
                      </TBody>
                    </Table>
                  </Box>
                </TabPanel>

                {/* Tab 2: Search + add (multi-select) */}
                <TabPanel {...tabs} tabId="search">
                  <Box marginBottom="space60">
                    <MemberSearch
                      allowMultiple
                      excludeIds={excludeIds}
                      onChangeSelected={(members) =>
                        setSelectedMembers(members)
                      }
                    />
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        }
        modalFooter={
          onSearchTab ? (
            <Box display="flex" justifyContent="flex-end" width="100%">
              <Button
                variant="destructive"
                onClick={handleAddConnections}
                disabled={selectedMembers.length === 0 || isAdding}
              >
                {isAdding ? "Adding…" : addBtnLabel}
              </Button>
            </Box>
          ) : undefined
        }
      />

      <MemberProfileViewModal
        isOpen={isProfileModalOpen}
        handleClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfile(null);
        }}
        memberProfile={selectedProfile}
        updateConnected={() => {
          // handled by add/remove flows
        }}
      />
    </>
  );
};

export default MemberConnectionsModal;
