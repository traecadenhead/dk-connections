// App.tsx
import { AppState } from "../store";
import { useSelector } from "react-redux";
import AppContainer from "./AppContainer";
import AutoLogin from "./login/AutoLogin";

function App() {
  const token = useSelector((state: AppState) => state.token);

  return (
    <>
      {!token && <AutoLogin />}
      {token && <AppContainer />}
    </>
  );
}
export default App;
