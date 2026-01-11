import { useMutate } from "./index.js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { onSetAuthenticated, onSetCanAccess, onSetMenu, onSetRoles } from "../../state";
import { removeTokenLocal, saveTokenLocal } from "../utils/authorization";
import { toast } from "react-toastify";

const useLogin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { mutate, status, data, error, isError, reset } = useMutate({
        key: ["login"],
        onMutateStart: () => {
            removeTokenLocal();
        },
        onSuccess: (response) => {
            if (response?.data?.status === "success") {
                if (response?.data?.data?.token) {
                    saveTokenLocal(response?.data?.data?.token);
                }

                dispatch(onSetMenu({ menu: response?.data?.data?.menuItems?.pages }));
                dispatch(onSetCanAccess({ canAccess: response?.data?.data?.menuItems?.pages?.map(page => page?.url) }));
                dispatch(onSetAuthenticated({ authenticated: response?.data?.data?.authenticated }));
                
                // Log roles from server
                console.log('Roles from server response:', response?.data?.data?.roles);
                
                dispatch(onSetRoles({
                    roles: response?.data?.data?.roles.map(role => ({
                        id: role?.id,
                        name: role?.name,
                        value: role?.id,
                        label: role?.name
                    }))
                }));

                navigate('/app');
            }
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Login failed. Please try again.');
        },
        action: "STORE"
    });

    return { mutate, status, data, error, isError, reset };
};

export default useLogin;
