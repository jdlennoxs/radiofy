import { z } from "zod";

import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  getOwned: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.station.findMany({
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
