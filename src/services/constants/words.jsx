import {BiSolidBookReader} from "react-icons/bi";
import {GiSecretBook} from "react-icons/gi";
import {MdCalculate, MdMoreTime, MdOutlineCategory, MdOutlinePendingActions} from "react-icons/md";
import {RiServerFill} from "react-icons/ri";
import {TbCalendarTime} from "react-icons/tb";
import {FaCalendarTimes, FaLayerGroup} from "react-icons/fa";
import {DownOutlined} from "@ant-design/icons";
import {ImBooks} from "react-icons/im";

export const words = {
    pending: {
        title: "Pending",
        icon: MdOutlinePendingActions
    },
    requested: {
        title: "Requested",
        icon: MdOutlinePendingActions
    },
    borrowed:{
        title: "Borrowed",
        icon: GiSecretBook
    },
    borrowings: {
        title: "Borrowings",
        icon: BiSolidBookReader
    },
    reserve: {
        title: "Reserve",
        icon: RiServerFill
    },
    reservation:{
        title: "Reservation",
        icon: RiServerFill
    },
    reserved:{
        title: "Reserved",
        icon: RiServerFill
    },
    extend: {
        title: "Extend",
        icon: MdMoreTime
    },
    extended:{
        title: "Extended",
        icon: MdMoreTime
    },
    returned: {
        title: "Returned",
        icon: ""
    },
    overdue: {
        title: "Overdue",
        icon: FaCalendarTimes
    },
    nearEnd:{
        title: "Near End",
        icon: TbCalendarTime
    },
    total: {
        title: "Total",
        icon: MdCalculate
    },
    options: {
        title: "Options",
        icon: DownOutlined
    },
    groups: {
        title: "Groups",
        icon:FaLayerGroup
    },
    category:{
        title: "Categories",
        icon: MdOutlineCategory
    },

};
