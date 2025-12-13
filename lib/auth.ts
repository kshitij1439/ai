import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        email?: string;
    }
}
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );
                if (!isValid) return null;

                return user;
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                });

                if (existingUser && existingUser.id !== user.id) {
                    await prisma.account.upsert({
                        where: {
                            provider_providerAccountId: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                            },
                        },
                        update: {},
                        create: {
                            userId: existingUser.id,
                            type: account.type,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                        },
                    });
                }
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email!;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.email = token.email!;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};
