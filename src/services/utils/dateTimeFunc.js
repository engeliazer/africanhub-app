import dayjs from "dayjs";

export const formatDateTime = (dateTime) => {
    return dayjs(dateTime).format("DD-MMM-YYYY HH:mm:ss A");
};

export const formatDate = (date) => {
    return dayjs(date).format("DD-MMM-YYYY");
};

export const formatTime = (time) => {
    return dayjs(time).format("HH:mm:ss A");
};
