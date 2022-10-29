import { z } from "zod";
import { createRouter } from "./context";

export const dashboardRouter = createRouter().query("getOwned", {
  resolve({ ctx }) {
    return ctx.prisma.station.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });
  },
});
//   .mutation("createStation", {
//       input: z.object({
//           name: z.string(),
//       })
//     async resolve({input, ctx}) {
//     const station = await ctx.prisma.station.create({
//         data: {
//           name: input.name,
//           admin: ctx.session.user.id
//         },
//     })
//    return station
//   }
// })
//   .query("getRecent", {});
