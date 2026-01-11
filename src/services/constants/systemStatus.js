export const statuses = {
    borrowed: {
        title: "Borrowed",
        color: "success"
    },
    reserved: {
        title: "Reserved",
        color: "geekblue"
    },
    returned: {
        title: "Returned",
        color: "volcano"
    },
    extended: {
        title: "Extended",
        color: "lime"
    },
    overdue: {
        title: "Overdue",
        color: "warning"
    },
    rejected: {
        title: "Rejected",
        color: "error"
    },
    available: {
        title: "Available",
        color: "success"
    },
    requested: {
        title: "Requested",
        color: "processing"
    }
};
export const statusOptions = [
    {
        key:0,
        label: "All",
        value: "all"
    },
    {
        key:1,
        label: "Borrowed",
        value: "borrowed"
    },
    {
        key:2,
        label: "Reserved",
        value: "reserved"
    },
    {
        key:3,
        label: "Returned",
        value: "returned"
    },
    {
        key:4,
        label: "Extended",
        value: "extended"
    },
    {
        key:5,
        label: "Overdue",
        value: "overdue"
    },
    {
        key:6,
        label: "Rejected",
        value: "rejected"
    }
];
export const supportStatus = [
    {
        key: 0,
        label: "All",
        value: "all"
    },
    {
        key: 1,
        label: "Pending",
        value: "pending"
    },
    {
        key: 2,
        label: "Resolved",
        value: "resolved"
    },
    {
        key: 3,
        label: "Overdue",
        value: "overdue"
    },
    {
        key: 4,
        label: "Closed",
        value: "closed"
    },
    {
        key: 5,
        label: "On-hold",
        value: "on-hold"
    }
];
export const accountStatus = {
    active:{
        title: "Active",
        color:"success"
    },
    expired: {
        title: "Expired",
        color:"error"
    },
    inactive:{
        title: "Inactive",
        color:"warning"
    }
};
export const accountStatusOptions = [
    {
        label: "Active",
        value: "active",
        key: 0
    },
    {
        label: "Inactive",
        value: "inactive",
        key: 1
    }
];
export const resourcesStatusOptions = [
    {
        label: "Active",
        value: "active",
        key: 0,
        color:"success"
    },
    {
        label: "Disabled",
        value: "disabled",
        key: 1,
        color:"warning"

    },
    {
        label: "Draft",
        value: "Draft",
        key: 3,
        color:"gold"

    }
];

