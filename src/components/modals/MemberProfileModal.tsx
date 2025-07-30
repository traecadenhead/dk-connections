import React, { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
} from "@twilio-paste/modal";
import { Button } from "@twilio-paste/button";
import { Input } from "@twilio-paste/input";
import { Label } from "@twilio-paste/label";
import { Box } from "@twilio-paste/core";
import { TextArea } from "@twilio-paste/textarea";

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: {
    photoUrl: string;
    bio: string;
    interests: string;
  }) => void;
  initialProfile?: { photoUrl: string; bio: string; interests: string };
}

const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}) => {
  const [photoUrl, setPhotoUrl] = useState(initialProfile?.photoUrl || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [interests, setInterests] = useState(initialProfile?.interests || "");

  const handleSave = () => {
    onSave({ photoUrl, bio, interests });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      size="default"
      ariaLabelledby="profile-modal"
    >
      <ModalHeader>
        <ModalHeading as="h3" id="profile-modal">
          Member Profile
        </ModalHeading>
      </ModalHeader>
      <ModalBody>
        <Box marginBottom="space60">
          <Label htmlFor="photoUrl">Photo URL</Label>
          <Input
            id="photoUrl"
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
          />
        </Box>

        <Box marginBottom="space60">
          <Label htmlFor="bio">Bio</Label>
          <TextArea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a little about yourself..."
          />
        </Box>

        <Box marginBottom="space60">
          <Label htmlFor="interests">Interests</Label>
          <TextArea
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g., hiking, poetry, tech"
          />
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MemberProfileModal;
