// src/components/AutoLogin.tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { bindActionCreators } from "redux";
import { Box, Spinner } from "@twilio-paste/core";
import { actionCreators } from "../../store";
import { getCurrentUser } from "../../api/user";
import { logout } from "../../store/action-creators";

const AutoLogin = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { login } = bindActionCreators(actionCreators, dispatch);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token");

    const handleValidToken = async (token: string) => {
      try {
        const userData = await getCurrentUser(token);
        localStorage.setItem("jwt", token);
        login(userData.twilio_token);
        setLoading(false);
      } catch (error) {
        console.error("Invalid or expired token:", error);
        localStorage.removeItem("jwt");
        logout();
        console.log("caught an error - would redirect");
        // redirectToLegacyLogin();
      }
    };

    const redirectToLegacyLogin = () => {
      const returnUrl = `${window.location.origin}?token=[jwt]`;
      const signinUrl = new URL("https://www.deltakappamft.org/SignIn");
      signinUrl.searchParams.set("returnUrl", returnUrl);
      window.location.href = signinUrl.toString();
    };

    if (queryToken) {
      console.log("query token");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log("handling valid token");
      handleValidToken(queryToken);
      console.log("handled valid token");
    } else {
      const sessionToken = localStorage.getItem("jwt");
      if (sessionToken) {
        console.log("found session token");
        handleValidToken(sessionToken);
        console.log("handled session token");
      } else {
        console.log("redirect to login");
        redirectToLegacyLogin();
      }
    }
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
