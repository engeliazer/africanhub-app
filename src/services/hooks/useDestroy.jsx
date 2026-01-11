import { useMutation } from "@tanstack/react-query";
import { destroy } from "../adapters";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const useDestroy = ({
  key=[""],
  onSuccess=()=>{},
  onError=()=>{},
  onDestroyStart=()=>{},
                    }) => {
   const {mutate, status, data, error, isError, failureReason, reset} = useMutation({
      mutationKey:key,
      mutationFn: async (variables) => {
         onDestroyStart();
         const response = await destroy(variables?.url, variables?.data);

          switch (response?.data?.status) {
              case "success":
                  onSuccess();
                  if (response?.data?.message) {
                      toast.success(response?.data?.message);
                  }
                  break;
          }

          if(response?.data?.status === "error")
         {
           onError();
           if(response?.data?.message)
           {
             toast.error(response?.data?.message);
           }
         }
      },
     onMutate: ()=> {
        toast.loading("Destroying...");
        onDestroyStart();
     },
     onSuccess: () => {
        toast.dismiss();
        onSuccess();
     },
     onError: (error) => {
        toast.dismiss();
        onError();
        toast.error(error?.response?.data?.message);
     },
   });

    return {mutate, status, data, error, isError, failureReason, reset};
};

useDestroy.propTypes = {
    key: PropTypes.array,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
    onDestroyStart: PropTypes.func
};

export default useDestroy;
