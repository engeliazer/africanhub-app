import { UserOutlined, VideoCameraOutlined } from "@ant-design/icons";

export const AppLinks = [
  {
    name: "Home",
    url: "/",
    icon: UserOutlined ,
    role: ["admin", "user"],
  },
  {
    name: "Dashboard",
    url: "/dashboard",
    icon: UserOutlined ,
    role: ["admin", "user"],
  },
  {
    name: "Account Management",
    url: "/dashboard",
    icon: UserOutlined ,
    role: ["admin", "user"],
  },
  {
    name: "Demo Management",
    url: "demo-management?demo",
    icon: VideoCameraOutlined,
    role: ["admin", "user"],
  }

];