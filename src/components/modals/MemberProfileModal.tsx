import React, { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
} from "@twilio-paste/modal";
import { Button } from "@twilio-paste/button";
import { Callout, CalloutHeading, CalloutText } from "@twilio-paste/callout";
import { Label } from "@twilio-paste/label";
import { Box, Text } from "@twilio-paste/core";
import { TextArea } from "@twilio-paste/textarea";
import { MemberProfileResponse } from "../../types";
import { uploadMemberPhoto } from "../../api/photo";
import { updateMemberProfile } from "../../api/member";

interface MemberProfileModalProps {
  isOpen: boolean;
  handleClose: () => void;
  onSave?: (profile: {
    photoUrl: string;
    bio: string;
    interests: string;
  }) => void;
  initialProfile?: { photoUrl: string; bio: string; interests: string };
  memberProfile?: MemberProfileResponse;
}

const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  handleClose,
  onSave,
  initialProfile,
  memberProfile,
}) => {
  const [photoUrl, setPhotoUrl] = useState(initialProfile?.photoUrl || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [interests, setInterests] = useState(initialProfile?.interests || "");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDismiss = () => {
    setStatus("idle");
    setMessage(null);
    handleClose();
  };

  const handleSave = async () => {
    try {
      await updateMemberProfile({ photo_url: photoUrl, bio, interests });
      if (onSave) {
        onSave({ photoUrl, bio, interests });
      }
      setStatus("success");
      setMessage("Profile updated successfully!");
      setTimeout(() => {
        setStatus("idle");
        setMessage(null);
        handleClose();
      }, 3000);
    } catch (err) {
      console.error("Profile save failed:", err);
      setStatus("error");
      setMessage("Failed to save profile. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={handleDismiss}
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
          <Text as="h3" fontWeight="fontWeightSemibold">
            {memberProfile?.first_name} {memberProfile?.last_name}
          </Text>
          <Text as="p" color="colorTextWeak">
            <>
              {memberProfile?.chapters.map((chapter, idx) => (
                <div key={`chapter-${idx}`}>
                  {chapter.affiliation_type} with {chapter.chapter_name}
                </div>
              ))}
            </>
          </Text>
        </Box>

        {/* Upload Photo section – unchanged */}
        {/* Bio section – unchanged */}
        {/* Interests section – unchanged */}

        <Box marginBottom="space60">
          <Label htmlFor="photoUpload">Upload Photo</Label>
          <input
            id="photoUpload"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              setUploadingPhoto(true);
              setUploadError(null);

              try {
                const url = await uploadMemberPhoto(file);
                setPhotoUrl(url);
              } catch (err) {
                console.error("Upload failed:", err);
                setUploadError("Failed to upload photo.");
              } finally {
                setUploadingPhoto(false);
              }
            }}
          />

          {uploadingPhoto && (
            <Text
              as="div"
              fontSize="fontSize20"
              color="colorTextWeak"
              marginTop="space40"
            >
              Uploading photo...
            </Text>
          )}

          {uploadError && (
            <Text
              as="div"
              fontSize="fontSize20"
              color="colorTextError"
              marginTop="space40"
            >
              {uploadError}
            </Text>
          )}

          {photoUrl && (
            <Box marginTop="space40">
              <Text as="div" fontSize="fontSize20" color="colorTextWeak">
                Current photo:
              </Text>
              <img
                src={photoUrl}
                alt="Uploaded"
                style={{
                  marginTop: "8px",
                  width: "100px",
                  borderRadius: "8px",
                }}
              />
            </Box>
          )}
        </Box>

        <Box marginBottom="space60">
          <Label htmlFor="bio">Bio</Label>
          <TextArea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a little about yourself..."
            aria-describedby="bio-help"
          />
          <Text
            id="bio-help"
            as="div"
            fontSize="fontSize20"
            color="colorTextWeak"
          >
            Share a few sentences about your background, studies, or passions.
          </Text>
        </Box>

        <Box marginBottom="space60">
          <Label htmlFor="interests">Interests</Label>
          <TextArea
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g., hiking, poetry, tech"
            aria-describedby="interests-help"
          />
          <Text
            id="interests-help"
            as="div"
            fontSize="fontSize20"
            color="colorTextWeak"
          >
            Separate interests with commas or write naturally.
          </Text>
        </Box>
      </ModalBody>

      {status !== "idle" && message && (
        <Box marginBottom="space60">
          <Callout variant={status === "success" ? "success" : "error"}>
            <CalloutHeading>
              {status === "success" ? "Success" : "Error"}
            </CalloutHeading>
            <CalloutText>{message}</CalloutText>
          </Callout>
        </Box>
      )}

      <ModalFooter>
        <Button variant="secondary" onClick={handleDismiss}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleSave}
          disabled={uploadingPhoto}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MemberProfileModal;
