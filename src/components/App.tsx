// App.tsx
import { AppState } from "../store";
import { useSelector } from "react-redux";
import AppContainer from "./AppContainer";
import AutoLogin from "./login/AutoLogin";

function App() {
  const token = useSelector((state: AppState) => state.token);

  return (
    <>
      <style>{`
        a {
          color:rgb(49, 49, 49) !important;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      `}</style>
      {!token && <AutoLogin />}
      {token && <AppContainer />}
    </>
  );
}
export default App;
