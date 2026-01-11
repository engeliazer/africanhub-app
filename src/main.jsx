import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ConfigProvider, theme } from "antd";
import { Provider } from "react-redux";
import { store } from "./state/index.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@mantine/charts/styles.css";
import "@mantine/core/styles.css";
import {MantineProvider} from "@mantine/core";
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimaryHover: "#277186",
                            colorPrimaryActive: "#277186",
                            colorPrimary: "#277186"
                        },
                        components: {
                            Menu: {
                                itemActiveBg: "#277186",
                                itemSelectedBg: "#277186",
                                itemSelectedColor: "#efefef",
                            }
                        }
                    }}
                >
                    <MantineProvider>
                        <App />
                    </MantineProvider>
                </ConfigProvider>
            </Provider>
        </QueryClientProvider>
        <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
        />
    </StrictMode>,
);
