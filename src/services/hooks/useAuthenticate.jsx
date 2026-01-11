import {useQuery} from "@tanstack/react-query";
import {get} from "../adapters/index.js";
import {useDispatch} from "react-redux";
import {onSetAuthenticated, onSetCanAccess, onSetMenu, onSetRoles} from "../../state";
import {toast} from "react-toastify";

const useAuthenticate = ({
    url="",
    enabled=false
    }) => {
  const dispatch = useDispatch();

  const {data, status, error, isFetching, refetch} = useQuery({
    queryKey: ["auth"],
    queryFn: async ()=> {
      const response = await get(url);

      if(response?.data?.status === "error" || response?.data?.status === "fail"){
        toast.error(response?.data?.message);
        return;
      }

      if(response?.data?.status === "success"){
       dispatch(onSetMenu({menu: response?.data?.data?.menuItems?.pages}));
       dispatch(onSetCanAccess({canAccess: response?.data?.data?.menuItems?.pages?.map(page=> page?.url)}));
       dispatch(onSetAuthenticated({authenticated: response?.data?.data?.authenticated}));
       dispatch(onSetRoles({roles: response?.data?.data?.roles.map(role=> {
        return {
          id: role?.id,
          name: role?.name,
          value: role?.id,
          label: role?.name
        };
      })}));
      }

      if(!response?.data?.status)  toast.warning("Unable to process the request. Try again later.");

      return response?.data;
    },
    enabled:enabled,
    refetchOnMount:false,
    retry:1,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  return {data, status, error, isFetching, refetch};
};

export default useAuthenticate;
