import React, { useEffect, useState } from "react";
import { Box, Stack, Tooltip } from "@twilio-paste/core";
import { Button } from "@twilio-paste/button";
import { PlusIcon } from "@twilio-paste/icons/esm/PlusIcon";
import { useTheme } from "@twilio-paste/theme";
import { ReduxParticipant } from "../../store/reducers/participantsReducer";
import styles from "../../styles";
import AvatarGroup from "../AvatarGroup";
import { AppState } from "../../store";
import { getTranslation } from "./../../utils/localUtils";
import { useSelector } from "react-redux";
import { getMemberProfileBatch } from "../../api/member";
import { MemberProfileResponse } from "../../types";

const DEFAULT_MAX_DISPLAYED_PARTICIPANTS = 5;
const MAX_HIDDEN_PARTICIPANTS = 50;

interface ParticipantsViewProps {
  participants: ReduxParticipant[];
  onParticipantListOpen: () => void;
  maxDisplayedParticipants?: number;
}

const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  participants,
  onParticipantListOpen,
  maxDisplayedParticipants = DEFAULT_MAX_DISPLAYED_PARTICIPANTS,
}) => {
  const theme = useTheme(); // <-- moved ABOVE any conditional return

  const local = useSelector((state: AppState) => state.local);
  const addParticipants = getTranslation(local, "addParticipants");
  const otherParticipants = getTranslation(local, "otherParticipants");
  const singularParticipant = getTranslation(local, "singularParticipant");

  const [participantProfiles, setParticipantProfiles] = useState<
    Record<string, MemberProfileResponse>
  >({});

  useEffect(() => {
    let cancelled = false;

    const identities = participants
      .map((p) => p.identity)
      .filter((id): id is string => typeof id === "string");

    const uniqueIdentities = Array.from(new Set(identities));
    if (uniqueIdentities.length === 0) return;

    getMemberProfileBatch(uniqueIdentities).then((profiles) => {
      if (cancelled) return;
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.member_id] = profile;
        return acc;
      }, {} as Record<string, MemberProfileResponse>);
      setParticipantProfiles(profileMap);
    });

    return () => {
      cancelled = true;
    };
  }, [participants]);

  const getName = (participant: ReduxParticipant): string => {
    const identity = participant.identity;
    if (!identity) return "unknown";

    const profile = participantProfiles[identity];
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    }

    return identity;
  };

  if (participants.length === 1) {
    return (
      <Box style={styles.addParticipantsButton}>
        <Button fullWidth variant="secondary" onClick={onParticipantListOpen}>
          <PlusIcon decorative={false} title="Add participants" />
          {addParticipants}
        </Button>
      </Box>
    );
  }

  const displayedParticipants: string[] = [];
  const hiddenParticipants: string[] = [];

  for (let i = 0; i < participants.length; i++) {
    const name = getName(participants[i]);
    if (i < maxDisplayedParticipants) {
      displayedParticipants.push(name);
    } else {
      hiddenParticipants.push(name);
    }

    if (hiddenParticipants.length === MAX_HIDDEN_PARTICIPANTS) {
      hiddenParticipants.push("...");
      break;
    }
  }

  const hiddenCount = participants.length - displayedParticipants.length;
  const participantCount =
    hiddenCount === 1
      ? singularParticipant
      : otherParticipants.replace("{count}", hiddenCount.toString());

  return (
    <Stack
      orientation={["vertical", "horizontal", "horizontal"]}
      spacing="space30"
    >
      <Button variant="reset" onClick={onParticipantListOpen}>
        <AvatarGroup names={displayedParticipants} />
      </Button>
      {hiddenParticipants.length > 0 ? (
        <Tooltip text={hiddenParticipants.join(", ")} placement="bottom-start">
          <span
            style={{
              verticalAlign: "top",
              paddingRight: 10,
              color: theme.textColors.colorText,
              fontWeight: theme.fontWeights.fontWeightSemibold,
            }}
          >
            {participantCount}
          </span>
        </Tooltip>
      ) : null}
    </Stack>
  );
};

export default ParticipantsView;
