import { type AppType } from "next/dist/shared/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/globals.css";
import { trpc } from "../lib/trpc";
import { Provider } from "jotai";
import { Suspense } from "react";

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
