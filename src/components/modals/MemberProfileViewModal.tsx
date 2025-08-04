import React, { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
} from "@twilio-paste/modal";
import { Button } from "@twilio-paste/button";
import { Box, Text, Tooltip } from "@twilio-paste/core";
import { StarIcon } from "@twilio-paste/icons/esm/StarIcon";
import { MemberProfileResponse } from "../../types";
import { createConnection } from "../../api/connection";

interface MemberProfileViewModalProps {
  isOpen: boolean;
  handleClose: () => void;
  memberProfile: MemberProfileResponse | null;
}

const MemberProfileViewModal: React.FC<MemberProfileViewModalProps> = ({
  isOpen,
  handleClose,
  memberProfile,
}) => {
  const memberId = localStorage.getItem("member_id");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  if (!memberProfile || !memberId) return null;

  const {
    member_id,
    first_name,
    last_name,
    initiated_chapter_name,
    affiliated_chapter_name,
    photo_url,
    bio,
    interests,
  } = memberProfile;

  const handleConnect = async () => {
    if (!member_id || connected) return;

    setIsConnecting(true);
    try {
      await createConnection({
        member_id: memberId,
        connected_member_id: memberProfile.member_id,
      });
      setConnected(true);
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={handleClose}
      size="default"
      ariaLabelledby="member-profile-view"
    >
      <ModalHeader>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <ModalHeading as="h3" id="member-profile-view">
            {first_name} {last_name}
          </ModalHeading>
          <Tooltip
            text={connected ? "Already connected" : "Connect with member"}
          >
            <Button
              variant={connected ? "secondary" : "destructive"}
              onClick={handleConnect}
              disabled={isConnecting || connected}
              size="icon"
            >
              <StarIcon decorative={false} title="Connect" />
            </Button>
          </Tooltip>
        </Box>
      </ModalHeader>

      <ModalBody>
        <Box marginBottom="space60">
          <Text as="p" color="colorTextWeak">
            {initiated_chapter_name && (
              <>
                Initiated at {initiated_chapter_name}
                <br />
              </>
            )}
            {affiliated_chapter_name && (
              <>Affiliated with {affiliated_chapter_name}</>
            )}
          </Text>
        </Box>

        {photo_url && (
          <Box marginBottom="space60">
            <Text as="div" fontSize="fontSize20" color="colorTextWeak">
              Photo:
            </Text>
            <img
              src={photo_url}
              alt={`${first_name} ${last_name}`}
              style={{
                marginTop: "8px",
                width: "100px",
                borderRadius: "8px",
              }}
            />
          </Box>
        )}

        {bio && (
          <Box marginBottom="space60">
            <Text as="div" fontWeight="fontWeightSemibold">
              Bio
            </Text>
            <Text as="p" color="colorText">
              {bio}
            </Text>
          </Box>
        )}

        {interests && (
          <Box marginBottom="space60">
            <Text as="div" fontWeight="fontWeightSemibold">
              Interests
            </Text>
            <Text as="p" color="colorText">
              {interests}
            </Text>
          </Box>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="primary" onClick={handleClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MemberProfileViewModal;
