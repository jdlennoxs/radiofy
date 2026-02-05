import { createRouter, protectedProcedure, publicProcedure } from "./context";

export const authRouter = createRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "You are logged in and can see this secret message!";
  }),
});
