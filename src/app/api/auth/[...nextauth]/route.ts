import NextAuth from "next-auth"
import Strava from "next-auth/providers/strava";
import StravaProvider from "next-auth/providers/strava";

// const stravaProvider = StravaProvider({
//   clientId: process.env.STRAVA_CLIENT_ID ?? "",
//   clientSecret: process.env.STRAVA_CLIENT_SECRET ?? "",
// });

// if (
//   typeof stravaProvider.authorization !== "string" &&
//   stravaProvider.authorization?.params?.scope
// ) {
//   stravaProvider.authorization.params.scope =
//     "activity:read_all,profile:read_all";
// }

const handler = NextAuth({
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID ?? "",
      clientSecret: process.env.STRAVA_CLIENT_SECRET ?? "",
      authorization: {
        params:{
          scope: "read,activity:read_all,profile:read_all",
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.userId = user.id;
      }
      
      if (account && account.access_token) {
        token.accessToken = account.access_token;
      }

      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }