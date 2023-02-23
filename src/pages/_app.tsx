import { type AppType } from "next/dist/shared/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/globals.css";
import { trpc } from "../lib/trpc";

const MyApp: AppType = ({ Component, pageProps }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />;
    </QueryClientProvider>
  );
};

export default trpc.withTRPC(MyApp);
