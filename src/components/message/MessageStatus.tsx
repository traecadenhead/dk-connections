import { getMessageStatus } from "../../api";
import {
  ReduxMessage,
  MessageStatus as MessageStatusType,
} from "../../store/reducers/messageListReducer";
import { ReduxParticipant } from "../../store/reducers/participantsReducer";
import { useEffect, useState } from "react";
import DeliveredIcon from "../icons/Delivered";
import SendingIcon from "../icons/Sending";
import FailedIcon from "../icons/Failed";
import ReadIcon from "../icons/Read";

type MessageStatusProps = {
  message: ReduxMessage;
  channelParticipants: ReduxParticipant[];
};

type MessageStatuses = {
  [MessageStatusType.Delivered]?: number;
  [MessageStatusType.Read]?: number;
  [MessageStatusType.Failed]?: number;
  [MessageStatusType.Sending]?: number;
};

const statusStyle = {
  display: "inline-block",
  verticalAlign: "middle",
};

const statusIconStyle = {};

const MessageStatus: React.FC<MessageStatusProps> = (props) => {
  const [status, setStatus] = useState<MessageStatuses>({});

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      const receipt = await getMessageStatus(
        props.message,
        props.channelParticipants
      );
      if (isMounted) {
        setStatus(receipt);
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [props.channelParticipants, props.message]);

  return (
    <>
      {status[MessageStatusType.Delivered] ? (
        <>
          <DeliveredIcon
            style={{ ...statusStyle, ...statusIconStyle }}
            color="green"
          />
        </>
      ) : null}

      {status[MessageStatusType.Sending] ? (
        <>
          <SendingIcon style={{ ...statusStyle, ...statusIconStyle }} />
        </>
      ) : null}

      {status[MessageStatusType.Failed] ? (
        <>
          <FailedIcon
            style={{ ...statusStyle, ...statusIconStyle }}
            color="red"
          />
        </>
      ) : null}

      {status[MessageStatusType.Read] ? (
        <>
          <ReadIcon
            style={{ ...statusStyle, ...statusIconStyle }}
            color="green"
          />
        </>
      ) : null}
    </>
  );
};

export { MessageStatus };
