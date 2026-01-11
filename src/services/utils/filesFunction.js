/**
 * Converts a file to a Base64 encoded string.
 *
 * @param {File} file - A File object to be converted.
 * @returns {Promise<string>} - A promise that resolves to a Base64 encoded string representing the file.
 */
export const convertToBase64 = async (file) => {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  export const downloadFromBase64 = (base64, fileName) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
  };

  /**
 * Converts a Base64 encoded string to a File object.
 *
 * @param {string} data - The Base64 encoded data.
 * @param {string} filename - The desired file name for the resulting File object.
 * @returns {File|null} - A File object, or null if the conversion fails.
 */
export const convertBase64ToFile = (data, filename) => {
    try {
      let arr = data.split(",");
      if (arr.length !== 2) {
        throw new Error("Invalid base64 data format");
      }
  
      let mime = arr[0].match(/:(.*?);/)[1];
      let bstr = atob(arr[1]);
      let n = bstr.length;
      let u8arr = new Uint8Array(n);
  
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
  
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error("Error converting base64 to file:", error);
      return null;
    }
  };