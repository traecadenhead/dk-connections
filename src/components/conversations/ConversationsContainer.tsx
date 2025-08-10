import React, { useEffect, useState } from "react";
import { Box, Input, Button, Spinner } from "@twilio-paste/core";
import { ChevronDoubleLeftIcon } from "@twilio-paste/icons/esm/ChevronDoubleLeftIcon";
import { ChevronDoubleRightIcon } from "@twilio-paste/icons/esm/ChevronDoubleRightIcon";
import { PlusIcon } from "@twilio-paste/icons/esm/PlusIcon";
import { Client } from "@twilio/conversations";
import GroupedConversationsList from "./GroupedConversationsList";
import CreateConversationModal from "../modals/CreateConversationModal";
import styles from "../../styles";
import { getTranslation } from "../../utils/localUtils";
import { useDispatch, useSelector } from "react-redux";
import { filterConversations } from "../../store/action-creators";
import { AppState } from "../../store";
import { getMemberProfile } from "../../api/member";
import { ChapterAffiliation } from "../../types";

interface ConversationsContainerProps {
  client?: Client;
}

const ConversationsContainer: React.FC<ConversationsContainerProps> = ({
  client,
}) => {
  const [listHidden, hideList] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberChapters, setMemberChapters] = useState<ChapterAffiliation[]>(
    []
  );
  const [adminChapters, setAdminChapters] = useState<ChapterAffiliation[]>([]);
  const [adminNational, setAdminNational] = useState(false);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const local = useSelector((state: AppState) => state.local);
  const search = getTranslation(local, "convoSearch");
  const createNewConvo = getTranslation(local, "createNewConvo");

  const handleSearch = (searchString: string) => {
    dispatch(filterConversations(searchString));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const memberId = localStorage.getItem("member_id");
        const profile = await getMemberProfile(memberId ?? "");
        setMemberChapters(profile.chapters || []);
        setAdminChapters(profile.admin_chapters || []);
        setAdminNational(profile.admin_national || false);
      } catch (error) {
        console.error("Failed to fetch member profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box padding="space70">
        <Spinner
          size="sizeIcon70"
          decorative={false}
          title="Loading conversations…"
        />
      </Box>
    );
  }

  return (
    <Box
      style={
        listHidden
          ? { ...styles.convosWrapper, ...styles.collapsedList }
          : styles.convosWrapper
      }
    >
      <Box style={styles.newConvoButton}>
        <Button
          fullWidth
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
        >
          <PlusIcon decorative={false} title="Add convo" />
          {!listHidden ? createNewConvo : null}
        </Button>

        <Box marginTop="space60" hidden>
          <Input
            aria-describedby="convo_string_search"
            id="convoString"
            name="convoString"
            type="text"
            placeholder={search}
            onChange={(e) => handleSearch(e.target.value)}
            required
            autoFocus
          />
        </Box>
      </Box>

      <Box style={styles.convoList}>
        {!listHidden && client ? (
          <GroupedConversationsList
            memberChapters={memberChapters}
            client={client}
          />
        ) : null}
      </Box>

      <Box style={styles.collapseButtonBox}>
        <Box
          paddingTop="space30"
          style={{ paddingLeft: 10, paddingRight: 10 }}
          onClick={() => hideList(!listHidden)}
        >
          {listHidden ? (
            <ChevronDoubleRightIcon decorative={false} title="Expand" />
          ) : (
            <ChevronDoubleLeftIcon decorative={false} title="Collapse" />
          )}
        </Box>
      </Box>

      <CreateConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        adminChapters={adminChapters}
        adminNational={adminNational}
        onCreate={(data) => {
          // Optional: trigger refetch or update conversations list
          console.log("Create conversation with:", data);
        }}
      />
    </Box>
  );
};

export default ConversationsContainer;
