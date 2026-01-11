import axios from "axios";
const SERVER_API_URL = import.meta.env.VITE_SERVER_API_URL;

const apiAdapter = (options ={
  contentType:"multipart/form-data",
  accept:"application/json"
})=> {
  const client = axios.create({
      baseURL: SERVER_API_URL ,
      headers: {
          ...options,
          "Access-Control-Allow-Origin": "*",
          "Authorization": `Bearer ${localStorage.getItem("templateToken")}`
      },
  });

  client.interceptors.response.use(
      (response) => {
          return response;
      },
      (error) => {
          if (error.response) {
              if (error.response.status === 401) {
                  localStorage.removeItem("templateToken");
                  window.location.href = "/";
              }
          }
          return Promise.reject(error);
      }
  );

  return {
      get: async (url, data={}, params={},headers={
        "Content-Type": "application/json",
        "Accept": "application/json"
      }) => {
          return await client.get(url, {
              data,
              params,
              headers
          });
      },
      post: async (url, data, headers={
        "Content-Type": "multipart/form-data",
        "Accept": "application/json"
      } ) => {
          return await client.post(url, data, {
            headers
          });
      },
      update: async (url, data,headers={
        "Content-Type": "multipart/form-data",
        "Accept": "application/json"
      } ) => {
          return await client.put(url, {
              ...data
          },{
            headers
          });
      },
      destroy: async (url, data) => {
          return await client.delete(url, {
            data:{
              ...data
            }
          });
      }
  };
};

export default apiAdapter;