// src/components/AutoLogin.tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { bindActionCreators } from "redux";
import { Box, Spinner } from "@twilio-paste/core";
import { actionCreators } from "../../store";
import { getCurrentMember } from "../../api/member";
import { logout } from "../../store/action-creators";

const AutoLogin = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { login } = bindActionCreators(actionCreators, dispatch);

  useEffect(() => {
    let isMounted = true;

    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token");

    const handleValidToken = async (token: string) => {
      try {
        const userData = await getCurrentMember(token);
        if (!isMounted) return;

        localStorage.setItem("jwt", token);
        localStorage.setItem("member_id", userData.member_id);
        login(userData.twilio_token);
        setLoading(false);
      } catch (error) {
        console.error("Invalid or expired token:", error);
        localStorage.removeItem("jwt");
        localStorage.removeItem("member_id");
        logout();

        if (isMounted) {
          redirectToLegacyLogin();
        }
      }
    };

    const redirectToLegacyLogin = () => {
      const returnUrl = `${window.location.origin}?token=[jwt]`;
      const signinUrl = new URL("https://www.deltakappamft.org/SignIn");
      signinUrl.searchParams.set("returnUrl", returnUrl);
      window.location.href = signinUrl.toString();
    };

    if (queryToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleValidToken(queryToken);
    } else {
      const sessionToken = localStorage.getItem("jwt");
      if (sessionToken) {
        handleValidToken(sessionToken);
      } else {
        if (isMounted) {
          redirectToLegacyLogin();
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [login]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        height="100%"
        width="100%"
      >
        <Spinner size="sizeIcon110" decorative={false} title="Logging in..." />
      </Box>
    );
  }

  return null;
};

export default AutoLogin;
