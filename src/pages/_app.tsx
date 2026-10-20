import type { AppType } from "next/app";
import Layout from "../components/layout";
import "../styles/globals.css";
import { trpc } from "../utils/trpc";

const MyApp: AppType = ({ Component, pageProps }) => (
  <Layout>
    <Component {...pageProps} />
  </Layout>
);

export default trpc.withTRPC(MyApp);
