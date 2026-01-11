export const initCap = (str)=> {
    return str?.charAt(0)?.toUpperCase() + str?.slice(1)?.toLowerCase();
};

export const ucWords = (str)=>{
    return str.split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export const strSnake = value => value
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/\s+/g, "_");

export const strStudly = value => value
    .replace(/[_\s]+(.)?/g, (match, char) => char ? char.toUpperCase() : "")
    .replace(/^[a-z]/, char => char.toUpperCase());

export const strAfter = (subject, search) => {
    const pos = subject.indexOf(search);

    return pos !== -1 ? subject.slice(pos + search.length) : "";
};

export const strBefore = (subject, search) => {
    const pos = subject.indexOf(search);

    return pos !== -1 ? subject.slice(0, pos) : subject;
};

export const strCamel = value => value.toLowerCase()
    .replace(/[_\s]+(.)?/g, (match, char) => char ? char.toUpperCase() : "");

export const generateStrongPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+";

    const allChars = uppercase + lowercase + numbers + symbols;

    const getRandomChar = (charSet) =>
        charSet[Math.floor(Math.random() * charSet.length)];

    const password = [
        getRandomChar(uppercase),
        getRandomChar(lowercase),
        getRandomChar(numbers),
        getRandomChar(symbols),
        ...Array(4).fill().map(() => getRandomChar(allChars))
    ];

    return password.sort(() => Math.random() - 0.5).join("");
};

export const replaceWithSpace = (str, specialChar) => {
    return str.split(specialChar).join(" ");
};

export const filterOptions = (input, option) => (option?.label ?? "")?.toLowerCase().includes(input.toLowerCase());

export const filterSort=(optionA, optionB) => optionA?.label?.localeCompare(optionB?.label);

