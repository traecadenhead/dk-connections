import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../store";
import AppContainer from "./AppContainer";
import AutoLogin from "./login/AutoLogin";

function App(): ReactElement {
  const token = useSelector((state: AppState) => state.token);

  return (
    <>
      {!token && <AutoLogin />}
      {token && <AppContainer />}
    </>
  );
}

export default App;
