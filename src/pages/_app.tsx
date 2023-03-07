import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import { type AppType } from "next/dist/shared/lib/utils";
import { Suspense } from "react";
import { trpc } from "../lib/trpc";
import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  const queryClient = new QueryClient();
  return (
    <Provider>
      <Suspense>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </Suspense>
    </Provider>
  );
};

export default trpc.withTRPC(MyApp);
