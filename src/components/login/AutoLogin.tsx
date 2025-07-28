// src/components/AutoLogin.tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { bindActionCreators } from "redux";
import { Box, Spinner } from "@twilio-paste/core";
import { actionCreators } from "../../store";

const AutoLogin = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { login } = bindActionCreators(actionCreators, dispatch);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token");

    if (queryToken) {
      localStorage.setItem("jwt", queryToken);
      login(queryToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(false);
    } else {
      const sessionToken = localStorage.getItem("jwt");

      if (sessionToken) {
        login(sessionToken);
        setLoading(false);
      } else {
        const returnUrl = `http://localhost:3000?token=[jwt]`;
        const signinUrl = new URL("https://www.deltakappamft.org/SignIn");
        signinUrl.searchParams.set("returnUrl", returnUrl);
        window.location.href = signinUrl.toString();
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
