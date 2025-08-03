import React from "react";
import {
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
} from "@twilio-paste/modal";
import { Button } from "@twilio-paste/button";
import { Box, Text } from "@twilio-paste/core";
import { MemberProfileResponse } from "../../types";

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
  if (!memberProfile) return null;

  const {
    first_name,
    last_name,
    initiated_chapter_name,
    affiliated_chapter_name,
    photo_url,
    bio,
    interests,
  } = memberProfile;

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={handleClose}
      size="default"
      ariaLabelledby="member-profile-view"
    >
      <ModalHeader>
        <ModalHeading as="h3" id="member-profile-view">
          {first_name} {last_name}
        </ModalHeading>
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
