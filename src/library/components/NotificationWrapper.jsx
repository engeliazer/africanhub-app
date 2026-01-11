import  { Fragment } from "react";
import { Badge } from "antd";
import { IoNotificationsCircleOutline } from "react-icons/io5";

const NotificationWrapper = () => {
  return (
    <Fragment>
      <Badge
        count={99}
        overflowCount={99}
      >
        <div>
          <IoNotificationsCircleOutline className={"text-4xl text-white"} />
        </div>
      </Badge>
    </Fragment>
  );
};

export default NotificationWrapper;
