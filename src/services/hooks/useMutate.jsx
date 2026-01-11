import { useMutation } from "@tanstack/react-query";
import { post, update } from "../adapters";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const useMutate = ({
  key=[""],
  onSuccess=()=>{},
  onError=()=>{},
  onMutateStart=()=>{},
  action="STORE"
                   }) => {
    const {mutate, status, data, error, isError, failureReason, reset} = useMutation({
       mutationKey:key,
       mutationFn: async (variables) => {
          onMutateStart();
          const response = action === "STORE" ? await post(variables?.url, variables?.data) : await update(variables?.url, variables?.data);

          if(response?.data?.status === "success")
          {
            onSuccess(response);
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
       },
      onMutate: ()=> {
         toast.loading("Please wait...");
         onMutateStart();
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

useMutate.propTypes = {
    key: PropTypes.string,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
    onMutateStart: PropTypes.func,
    action: PropTypes.oneOf(["STORE", "UPDATE"])
};

export default useMutate;
