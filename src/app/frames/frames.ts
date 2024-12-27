import { farcasterHubContext, openframes } from "frames.js/middleware";
import { imagesWorkerMiddleware } from "frames.js/middleware/images-worker";
import { createFrames } from "frames.js/next";
import { isXmtpFrameActionPayload, getXmtpFrameMessage } from "frames.js/xmtp";
import { neynarValidate } from "frames.js/middleware/neynar";

export type State = {
  count: number;
};

export const frames = createFrames<State>({
  initialState: {
    count: 0,
  },
  basePath: "/frames",
  middleware: [
    neynarValidate({
      API_KEY: process.env.NEYNAR_API_KEY!,
    }),
    farcasterHubContext({
      // remove if you aren't using @frames.js/debugger or you just don't want to use the debugger hub
      ...(process.env.NODE_ENV === "production"
        ? {}
        : {
            hubHttpUrl: "http://localhost:3010/hub",
          }),
    }),
    // Learn more about openframes at https://framesjs.org/guides/open-frames
    openframes({
      clientProtocol: {
        id: "xmtp",
        version: "2024-02-09",
      },
      handler: {
        isValidPayload: (body) => isXmtpFrameActionPayload(body),
        getFrameMessage: async (body) => {
          // Check if the payload is a valid XMTP frame action payload
          if (!isXmtpFrameActionPayload(body)) {
            // If it's not, return undefined
            console.error("Invalid XMTP payload");
            return undefined;
          }
          // If it is, get the frame message
          const result = await getXmtpFrameMessage(body);
          return { ...result };
        },
      },
    }),
    imagesWorkerMiddleware({
      imagesRoute: "/images",
      secret: "MY_VERY_SECRET_SECRET",
    }),
  ],
});
