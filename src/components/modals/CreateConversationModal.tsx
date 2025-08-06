import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
  Button,
  Label,
  Input,
  Select,
  Checkbox,
  Box,
} from "@twilio-paste/core";
import { ConversationType } from "../../types";
import { createConversation } from "../../api/conversation";

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminChapters: string[];
  adminNational: boolean;
  onCreate?: (data: {
    type: ConversationType;
    name: string;
    is_read_only: boolean;
    chapter_id?: string;
  }) => void;
}

const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  isOpen,
  onClose,
  adminChapters,
  adminNational,
  onCreate,
}) => {
  const [type, setType] = useState<ConversationType>(ConversationType.PERSONAL);
  const [name, setName] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [chapterId, setChapterId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const showChapterSelect = type === "chapter";
  const showTypeSelect = adminChapters.length > 0 || adminNational;

  useEffect(() => {
    if (type === "personal") {
      setIsReadOnly(false);
    }
  }, [type]);

  const handleSubmit = async () => {
    setError(null);
    const conversationData = {
      type,
      name,
      is_read_only: isReadOnly,
      chapter_id: chapterId || undefined,
    };

    try {
      await createConversation(conversationData);
      if (onCreate) {
        onCreate(conversationData);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create conversation");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      ariaLabelledby="create-convo-modal"
      size="default"
    >
      <ModalHeader>
        <ModalHeading as="h3" id="create-convo-modal">
          Create New Conversation
        </ModalHeading>
      </ModalHeader>
      <ModalBody>
        {showTypeSelect && (
          <Box marginBottom="space60">
            <Label htmlFor="conversation-type" required>
              Conversation Type
            </Label>
            <Select
              id="conversation-type"
              value={type}
              onChange={(e) => setType(e.target.value as ConversationType)}
            >
              <option value="personal">Personal</option>
              {adminChapters.length > 0 && (
                <option value="chapter">Chapter</option>
              )}
              {adminNational && <option value="national">National</option>}
            </Select>
          </Box>
        )}

        {showChapterSelect && (
          <Box marginBottom="space60">
            <Label htmlFor="chapter-select" required>
              Select Chapter
            </Label>
            <Select
              id="chapter-select"
              value={chapterId || ""}
              onChange={(e) => setChapterId(e.target.value)}
            >
              <option value="" disabled>
                -- Select Chapter --
              </option>
              {adminChapters.map((id) => (
                <option key={id} value={id}>
                  Chapter {id}
                </option>
              ))}
            </Select>
          </Box>
        )}

        <Box marginBottom="space60">
          <Label htmlFor="conversation-name" required>
            Conversation Name
          </Label>
          <Input
            id="conversation-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Box>

        {type !== "personal" && (
          <Box marginBottom="space60">
            <Checkbox
              id="read-only"
              checked={isReadOnly}
              onChange={() => setIsReadOnly((prev) => !prev)}
            >
              Read-only conversation
            </Checkbox>
          </Box>
        )}

        {error && (
          <Box marginBottom="space60" color="colorTextError">
            {error}
          </Box>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateConversationModal;
