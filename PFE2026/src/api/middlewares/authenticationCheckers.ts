// import { Action } from 'routing-controllers';
// import { auth } from '../../lib/auth.js';
// import { fromNodeHeaders } from 'better-auth/node';
// import { db } from '../../infrastructure/db/index.js';
// import { user } from '../../infrastructure/db/schema/auth.js';
// import { eq } from 'drizzle-orm';
// import { UserRole } from '../../core/types/UserRole.js';

// export async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
//   try {
//     const session = await auth.api.getSession({
//       headers: fromNodeHeaders(action.request.headers),
//     });

//     if (!session?.user) {
//       return false;
//     }

//     const sessionUser = session.user as any;

//     // If role is missing from session, fetch from DB
//     if (!sessionUser.role) {
//       const dbUser = await db.select({ role: user.role })
//         .from(user)
//         .where(eq(user.id, sessionUser.id))
//         .limit(1);
//       sessionUser.role = dbUser[0]?.role;
//     }

//     (action.request as any).user = sessionUser;
//     (action.request as any).session = session.session;

//     if (roles.length > 0) {
//       const userRole = sessionUser.role as UserRole | undefined;
//       if (!userRole || !roles.includes(userRole)) {
//         return false;
//       }
//     }

//     return true;
//   } catch (err) {
//     console.error('Session verification failed:', err);
//     return false;
//   }
// }

// export async function currentUserChecker(action: Action): Promise<any | undefined> {
//   return (action.request as any).user;
// }
import { Action } from 'routing-controllers';
import { auth } from '../../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import { db } from '../../infrastructure/db/index.js';
import { user } from '../../infrastructure/db/schema/auth.js';
import { eq } from 'drizzle-orm';
import { UserRole } from '../../core/types/UserRole.js';

export async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(action.request.headers),
    });
    if (!session?.user) return false;
    const sessionUser = session.user as any;
    if (!sessionUser.role) {
      const dbUser = await db.select({ role: user.role })
        .from(user)
        .where(eq(user.id, sessionUser.id))
        .limit(1);
      sessionUser.role = dbUser[0]?.role;
    }
    (action.request as any).user = sessionUser;
    if (roles.length > 0) {
      const userRole = sessionUser.role as UserRole | undefined;
      if (!userRole || !roles.includes(userRole)) return false;
    }
    return true;
  } catch (err) {
    console.error('Session verification failed:', err);
    return false;
  }
}

export async function currentUserChecker(action: Action): Promise<any | undefined> {
  // If authorizationChecker already ran on this request, reuse its result
  if ((action.request as any).user) return (action.request as any).user;

  // For routes without @Authorized() (e.g. chat), resolve the session independently
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(action.request.headers),
    });
    if (!session?.user) return undefined;
    const sessionUser = session.user as any;
    if (!sessionUser.role) {
      const dbUser = await db.select({ role: user.role })
        .from(user)
        .where(eq(user.id, sessionUser.id))
        .limit(1);
      sessionUser.role = dbUser[0]?.role;
    }
    (action.request as any).user = sessionUser;
    return sessionUser;
  } catch {
    return undefined;
  }
}