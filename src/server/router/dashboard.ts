import { createRouter, protectedProcedure } from "./context";

export const dashboardRouter = createRouter({
  getOwned: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.station.findMany({
      where: {
        userId: (ctx.session.user as { id?: string }).id,
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
