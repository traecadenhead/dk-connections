import React, { useEffect, useState } from "react";
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
import { useSelector } from "react-redux";
import { AppState } from "../../store";
import { getTranslation } from "../../utils/localUtils";
import { getMemberConnections, removeConnection } from "../../api/connection";
import { MemberConnectionResponse, MemberProfileResponse } from "../../types";

import ConvoModal from "./ConvoModal";
import MemberProfileViewModal from "./MemberProfileViewModal";
import { Avatar } from "../Avatar";
import { UserIcon } from "@twilio-paste/icons/cjs/UserIcon";
import { DeleteIcon } from "@twilio-paste/icons/esm/DeleteIcon";

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

  useEffect(() => {
    if (!memberId) return;

    const fetchConnections = async () => {
      try {
        const result = await getMemberConnections(memberId);
        setConnections(result);
      } catch (err) {
        console.error("Failed to fetch connections:", err);
      }
    };

    fetchConnections();
  }, [memberId]);

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

  return (
    <>
      <ConvoModal
        handleClose={handleClose}
        isModalOpen={isOpen}
        title={title}
        modalBody={
          <ModalBody>
            <Box
              style={{
                overflow: "hidden",
                overflowY: "auto",
                maxHeight: "500px",
              }}
            >
              <Table>
                <THead hidden={true}>
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
        updateConnected={() => {
          // Optionally refresh connections or leave empty
        }}
      />
    </>
  );
};

export default MemberConnectionsModal;
