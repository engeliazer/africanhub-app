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
import { ThemeProvider, useTheme } from "./contexts/ThemeContext.jsx";

const queryClient = new QueryClient();

// Component to apply Ant Design theme based on current theme
const ThemedConfigProvider = ({ children }) => {
  const { colors } = useTheme();
  
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimaryHover: colors.primary,
          colorPrimaryActive: colors.primary,
          colorPrimary: colors.primary,
          colorBgBase: colors.background,
          colorBgContainer: colors.card,
          colorText: colors.textPrimary,
          colorTextSecondary: colors.textSecondary,
          colorBorder: colors.border,
          colorBorderSecondary: colors.border,
        },
        components: {
          Menu: {
            itemActiveBg: colors.border,
            itemSelectedBg: colors.border,
            itemSelectedColor: colors.textPrimary,
            itemHoverBg: colors.cardDepth,
            colorBgContainer: colors.card,
            colorText: colors.textPrimary,
            colorTextSecondary: colors.textSecondary,
          },
          Card: {
            colorBgContainer: colors.card,
            colorText: colors.textPrimary,
            colorTextHeading: colors.textPrimary,
            colorBorderSecondary: colors.border,
          },
          Layout: {
            colorBgBody: colors.background,
            colorBgContainer: colors.background,
            colorBgHeader: colors.card,
          },
          Button: {
            colorBgContainer: colors.card,
            colorText: colors.textPrimary,
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <ThemeProvider>
                    <ThemedConfigProvider>
                        <MantineProvider>
                            <App />
                        </MantineProvider>
                    </ThemedConfigProvider>
                </ThemeProvider>
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
