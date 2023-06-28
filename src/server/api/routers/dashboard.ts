import { z } from "zod";
import { procedure, protectedProcedure, router } from "../trpc";
import { prisma } from "../../db";

export const dashboardRouter = router({
  getOwned: protectedProcedure.query(({ ctx }) => {
    return prisma.station.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        playbackContext: {
          select: { isPlaying: true, track: true },
        },
      },
    });
  }),
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
