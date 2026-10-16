import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "credentials",
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required.");
      }
      await connectDB();
      const user = await User.findOne({
        email: credentials.email.toLowerCase().trim(),
      }).select("+passwordHash");

      if (!user || !user.passwordHash) {
        throw new Error("No account found with those credentials.");
      }

      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) {
        throw new Error("Incorrect email or password.");
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        try {
          await connectDB();
          const existing = await User.findOne({ email: user.email.toLowerCase() });
          if (!existing) {
            await User.create({
              name: user.name || user.email.split("@")[0],
              email: user.email.toLowerCase(),
              image: user.image ?? undefined,
              provider: "google",
            });
          } else if (!existing.image && user.image) {
            existing.image = user.image;
            await existing.save();
          }
          return true;
        } catch (err) {
          console.error("[auth] google signIn error", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
