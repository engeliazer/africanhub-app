import {useMutation, useQuery} from "@tanstack/react-query";
import { get } from "../adapters";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const useFetch = ({
  queryKey=[""],
  onSuccess=()=>{},
  onError=()=>{},
  onFetchStart=()=>{},
  url="",
     enabled=false,
    payload=null,
  requireClick=false,
    onClick=()=>{},
       }) => {
    if(requireClick){
        const {data, status, error, mutate, failureReason, reset, isError} = useMutation({
            mutationKey:queryKey,
            mutationFn: async (payload) => {
                onFetchStart();
                const response = await get(url, payload);
                if(response?.data?.status === "success")
                {
                    onSuccess && onSuccess(response);
                    if(response?.data?.message)
                    {
                        toast.success(response?.data?.message);
                    }
                }

                if(response?.data?.status === "error")
                {
                    onError && onError(response);
                    if(response?.data?.message)
                    {
                        toast.error(response?.data?.message);
                    }
                }

                return response?.data?.data;
            },
            onMutate: ()=> {
                toast.loading("Please wait...");
                onClick() &&  onClick();
            },
            onSuccess: () => {
                toast.dismiss();
            },
            onError: (error) => {
                toast.dismiss();
                onError &&  onError(error);
                toast.error(error?.response?.data?.message);
            },
        });

        return {data, status, error, mutate, failureReason, reset, isError};

    }else {
        const {data, status, error, isFetching, refetch} = useQuery({
            queryKey:queryKey,
            queryFn: async ()=> {
                onFetchStart();
                const response = await get(url, payload);

                if(response?.data?.status === "success")
                {
                    onSuccess(response);
                    if(response?.data?.message){
                        toast.success(response?.data?.message);
                    }
                }

                if(response?.data?.status === "error")
                {
                    onError(response);
                    if(response?.data?.message){
                        toast.error(response?.data?.message);
                    }
                }

                return response?.data?.data;
            },
            enabled:enabled,
            refetchOnMount:false,
            retry:1,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
        });

        return {data, status, error, isFetching, refetch};
    }
};

useFetch.propTypes = {
  queryKey: PropTypes.array,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  onFetchStart: PropTypes.func,
  url: PropTypes.string,
  enabled: PropTypes.bool,
    payload: PropTypes.object,
    requireClick: PropTypes.bool,
};

export default useFetch;
