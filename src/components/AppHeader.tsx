import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../store";

import { Text, useToaster } from "@twilio-paste/core";
import { Menu, MenuButton, useMenuState, MenuItem } from "@twilio-paste/menu";
import { ChevronDownIcon } from "@twilio-paste/icons/esm/ChevronDownIcon";

import { Avatar } from "@twilio-paste/avatar";
import MemberProfileModal from "./modals/MemberProfileModal";
import { getMemberProfile } from "../api/member";
import { MemberProfileResponse } from "../types";
import { AppLogo, LOGO_SUB_TITLE, LOGO_TITLE } from "../branding";
import { ConnectionState } from "@twilio/conversations";
import { getTranslation } from "../utils/localUtils";
import styles from "../styles";

type AppHeaderProps = {
  user: string;
  onSignOut: () => void;
  connectionState: ConnectionState;
};

const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  onSignOut,
  connectionState,
}) => {
  const menu = useMenuState();
  const toaster = useToaster();
  const local = useSelector((state: AppState) => state.local);

  const [showMemberProfileModal, setShowMemberProfileModal] = useState(false);
  const [memberProfile, setMemberProfile] =
    useState<MemberProfileResponse | null>(null);

  const online = getTranslation(local, "online");
  const connecting = getTranslation(local, "connecting");
  const offline = getTranslation(local, "offline");
  const signout = getTranslation(local, "signout");
  const memberProfileTxt = getTranslation(local, "userProfileTxt");

  const label: "online" | "connecting" | "offline" = useMemo(() => {
    switch (connectionState) {
      case "connected":
        return "online";
      case "connecting":
        return "connecting";
      default:
        return "offline";
    }
  }, [connectionState]);

  const handleMemberProfileModalClose = () => {
    setShowMemberProfileModal(false);
  };

  const handleMemberProfileModalOpen = async () => {
    try {
      const memberId = localStorage.getItem("member_id");
      if (!memberId) {
        throw new Error("No member ID found in localStorage");
      }
      const profile = await getMemberProfile(memberId);

      setMemberProfile(profile);
      setShowMemberProfileModal(true);
    } catch (error) {
      console.error("Failed to load member profile:", error);
      toaster.push({
        message: "Unable to load member profile.",
        variant: "error",
        dismissAfter: 5000,
      });
    }
  };

  useEffect(() => {
    const preloadProfile = async () => {
      try {
        const memberId = localStorage.getItem("member_id");
        if (!memberId) return;
        const profile = await getMemberProfile(memberId);
        setMemberProfile(profile);
      } catch (err) {
        console.error("Failed to preload member profile:", err);
      }
    };

    preloadProfile();
  }, []);

  return (
    <div style={styles.appHeader}>
      <div style={styles.flex}>
        <div style={styles.appLogoWrapper}>
          <AppLogo />
        </div>
        <div style={styles.appLogoTitle}>
          {LOGO_TITLE}
          <div style={styles.appLogoSubTitle}>{LOGO_SUB_TITLE}</div>
        </div>
      </div>
      <div style={styles.userTile}>
        <Avatar
          name={
            memberProfile?.first_name && memberProfile?.last_name
              ? `${memberProfile.first_name} ${memberProfile.last_name}`
              : user
          }
          size="sizeIcon70"
          src={memberProfile?.photo_url || undefined}
        />
        <div style={{ padding: "0 10px" }}>
          <Text as="span" style={styles.userName}>
            {memberProfile?.first_name && memberProfile?.last_name
              ? `${memberProfile.first_name} ${memberProfile.last_name}`
              : user}
          </Text>
          <Text
            as="span"
            color={
              label === "online"
                ? "colorTextPrimaryWeak"
                : label === "connecting"
                ? "colorTextIconBusy"
                : "colorTextWeaker"
            }
            style={styles.userStatus}
          >
            {label === "online"
              ? online
              : label === "connecting"
              ? `${connecting}...`
              : offline}
          </Text>
        </div>
        <MenuButton {...menu} variant="link" size="reset">
          <ChevronDownIcon
            color="colorTextInverse"
            decorative={false}
            title="Settings"
          />
        </MenuButton>
        <Menu {...menu} aria-label="Preferences">
          <MenuItem {...menu} onClick={onSignOut}>
            {signout}
          </MenuItem>
          <MenuItem {...menu} onClick={handleMemberProfileModalOpen}>
            {memberProfileTxt}
          </MenuItem>
        </Menu>
      </div>

      {showMemberProfileModal && memberProfile && (
        <MemberProfileModal
          isOpen={showMemberProfileModal}
          handleClose={handleMemberProfileModalClose}
          initialProfile={{
            photoUrl: memberProfile.photo_url ?? "",
            bio: memberProfile.bio ?? "",
            interests: memberProfile.interests ?? "",
          }}
          memberProfile={memberProfile}
          onSave={async () => {
            const memberId = localStorage.getItem("member_id");
            if (memberId) {
              const updatedProfile = await getMemberProfile(memberId);
              setMemberProfile(updatedProfile); // ✅ refresh UI
            }
          }}
        />
      )}
    </div>
  );
};

export default AppHeader;
