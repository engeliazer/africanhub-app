export const  shortenNumber = (num)=> {
    if (Math.abs(num) >= 1.0e9) {
      return (Math.abs(num) / 1.0e9).toFixed(1) + "B";
    } else if (Math.abs(num) >= 1.0e6) {
      return (Math.abs(num) / 1.0e6).toFixed(1) + "M";
    } else if (Math.abs(num) >= 1.0e3) {
      return (Math.abs(num) / 1.0e3).toFixed(1) + "K";
    } else {
      return Math.abs(num);
    }
  };

 export  const NumFormat = (n) => {
    const val = Math.round(Number(n) * 100) / 100;
    const parts = val.toString().split(".");
  
    const decimal = parts[1] ? (parts[1] < 10 ? parts[1] + "0" : parts[1]) : "00";
  
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + decimal : "");
  };