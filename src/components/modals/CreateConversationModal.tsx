// src/components/modals/CreateConversationModal.tsx
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
import {
  ConversationType,
  ChapterAffiliation,
  MemberConversation,
} from "../../types";
import { createConversation } from "../../api/conversation";

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminChapters: ChapterAffiliation[];
  adminNational: boolean;
  onCreate?: (created: MemberConversation) => void;
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

  const isPersonal = type === ConversationType.PERSONAL;
  const isChapter = type === ConversationType.CHAPTER;
  const showChapterSelect = isChapter;
  const showTypeSelect = adminChapters.length > 0 || adminNational;

  const resetForm = () => {
    setType(ConversationType.PERSONAL);
    setName("");
    setIsReadOnly(false);
    setChapterId(undefined);
    setError(null);
  };

  useEffect(() => {
    if (isPersonal) {
      setIsReadOnly(false);
    }
  }, [isPersonal]);

  useEffect(() => {
    if (isChapter) {
      if (adminChapters.length === 1) {
        setChapterId(adminChapters[0].chapter_id);
      }
    } else {
      setChapterId(undefined);
    }
  }, [isChapter, adminChapters]);

  const handleSubmit = async () => {
    setError(null);

    // simple guard against empty names to avoid duplicate "Untitled"/matching issues
    if (!name.trim()) {
      setError("Please enter a conversation name.");
      return;
    }

    const conversationData = {
      type,
      name: name.trim(),
      is_read_only: isReadOnly,
      chapter_id: chapterId || undefined,
    };

    try {
      // IMPORTANT: use the API response (with real sid/id)
      const created = (await createConversation(
        conversationData
      )) as MemberConversation;

      onCreate?.(created);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const fallback = "Failed to create conversation";
      const detail = getResponseDetail(err);
      const message = detail
        ? detail
        : err instanceof Error
        ? err.message
        : hasStringMessage(err)
        ? err.message
        : fallback;

      setError(message);
    }
  };

  const handleDismiss = () => {
    resetForm();
    onClose();
  };

  // Narrow unknown to a string-message error
  const hasStringMessage = (e: unknown): e is { message: string } =>
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as Record<string, unknown>).message === "string";

  // Optional: handle axios/fetch-style nested detail without `any`
  const getResponseDetail = (e: unknown): string | undefined => {
    if (typeof e !== "object" || e === null) return undefined;

    const maybeObj = e as Record<string, unknown>;
    const resp = maybeObj["response"];
    if (typeof resp !== "object" || resp === null) return undefined;

    const data = (resp as Record<string, unknown>)["data"];
    if (typeof data !== "object" || data === null) return undefined;

    const detail = (data as Record<string, unknown>)["detail"];
    return typeof detail === "string" ? detail : undefined;
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={handleDismiss}
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
              <option value={ConversationType.PERSONAL}>Personal</option>
              {adminChapters.length > 0 && (
                <option value={ConversationType.CHAPTER}>Chapter</option>
              )}
              {adminNational && (
                <option value={ConversationType.NATIONAL}>National</option>
              )}
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
              {adminChapters.map((chapter) => (
                <option key={chapter.chapter_id} value={chapter.chapter_id}>
                  {chapter.chapter_name}
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

        {!isPersonal && (
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
        <Button variant="secondary" onClick={handleDismiss}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleSubmit}>
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateConversationModal;
