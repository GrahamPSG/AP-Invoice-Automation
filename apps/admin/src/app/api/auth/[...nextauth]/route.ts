import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'viewer';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Check if user is authorized based on email domain or specific email addresses
      const allowedDomains = ['parisservicegroup.com', 'parismechanical.com'];
      const allowedEmails = [
        'grahamm@parisservicegroup.com',
        'aisleyj@parisservicegroup.com', 
        'owens@parisservicegroup.com',
        'carolc@parismechanical.com',
      ];

      if (user.email) {
        const emailDomain = user.email.split('@')[1];
        const isAllowedDomain = allowedDomains.includes(emailDomain);
        const isAllowedEmail = allowedEmails.includes(user.email);

        if (isAllowedDomain || isAllowedEmail) {
          // Assign role based on email
          if (user.email.includes('grahamm') || user.email.includes('owens')) {
            user.role = 'admin';
          } else if (user.email.includes('aisleyj') || user.email.includes('carolc')) {
            user.role = 'manager';
          } else {
            user.role = 'viewer';
          }
          return true;
        }
      }

      return false; // Deny access for unauthorized users
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };