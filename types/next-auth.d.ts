import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

// Augment the Session interface
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

// Augment the JWT interface if you use JWT callback
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
  }
}
