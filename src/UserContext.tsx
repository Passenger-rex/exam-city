import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface UserProfile {
  tier: "free" | "pro";
  testsTakenThisMonth: number;
  proType?: "individual" | "group" | "companion" | "referrals" | "admin_granted";
  billingInterval?: "monthly" | "lifetime" | "admin_granted" | "referrals" | null;
  proExpiresAt?: number | null;
  groupAdminUid?: string | null;
  groupMembers?: string[] | null;
  tutorQueriesUsed?: number;
  lastTutorQueryDate?: string | null;
  name?: string;
}

interface UserContextType {
  user: any; // Firebase user
  profile: UserProfile;
  loading: boolean;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: { tier: "free", testsTakenThisMonth: 0 },
  loading: true,
  logout: async () => {},
  isLoggingOut: false,
});

export const useUser = () => useContext(UserContext);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile>({
    tier: "free",
    testsTakenThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    // Artificially hold for 2500ms to fulfill the 2.5sec premium secure log-off transition safely
    await new Promise((resolve) => setTimeout(resolve, 2500));
    try {
      await auth.signOut();
    } catch (e) {
      console.error("Sign out session termination failed:", e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        const guestCount = Number(localStorage.getItem('guestExamCount') || 0);
        setProfile({ tier: "free", testsTakenThisMonth: guestCount });
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Safety timeout to prevent the app from hanging forever if Firestore is unreachable/offline
    const safetyTimeout = setTimeout(() => {
      console.warn("User profile loading took too long. Falling back to default values to keep app responsive.");
      const guestCount = Number(localStorage.getItem('guestExamCount') || 0);
      setProfile(prev => prev.testsTakenThisMonth === 0 ? { tier: "free", testsTakenThisMonth: guestCount } : prev);
      setLoading(false);
    }, 4000);

    const userRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(
      userRef,
      async (docSnap) => {
        clearTimeout(safetyTimeout);
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Real-time Concurrent Session Enforcement Check
          const localSessionId = localStorage.getItem("sessionId");
          if (localSessionId && data.activeSession?.id && data.activeSession.id !== localSessionId) {
            console.warn("Active concurrent session collision detected! Terminating old session...");
            auth.signOut().then(() => {
               localStorage.removeItem("sessionId");
               window.location.href = "/login?reason=session_expired";
            });
            return;
          }

          let currentTier = data.tier || "free";
          
          const PRO_EMAILS = [
            "owolekejesse@gmail.com",
            "johnnieekundayo@gmail.com"
          ];
          const PRO_UIDS = [
            "WHC5GtQVXoTTWM7wUOUd7m18IN02",
            "c0WvsZR7N8RCRwc41ppNMDGdi4w2"
          ];
          
          if ((user.email && PRO_EMAILS.includes(user.email.toLowerCase())) || PRO_UIDS.includes(user.uid)) {
            currentTier = "pro";
            // Update Firestore so the user gets permanent pro status across devices
            import("firebase/firestore").then(({ updateDoc }) => {
                updateDoc(userRef, { tier: "pro", proType: "admin_granted" }).catch(e => console.error(e));
            });
          }

          let userProType = data.proType || "individual";
          let groupAdminUid = data.groupAdminUid || null;
          let groupMembers = data.groupMembers || null;
          let billingInterval = data.billingInterval || null;
          const rawExpiresAt = data.proExpiresAt;
          const expiresAt = rawExpiresAt ? (rawExpiresAt.toDate ? rawExpiresAt.toDate().getTime() : Number(rawExpiresAt || 0)) : null;

          // Check expiration for monthly plans
          if (currentTier === "pro" && billingInterval === "monthly" && expiresAt && Date.now() > expiresAt) {
             const isSpecialUser = (user.email && PRO_EMAILS.includes(user.email.toLowerCase())) || PRO_UIDS.includes(user.uid);
             if (!isSpecialUser) {
               console.warn("Monthly subscription has expired! Demoting to free tier.");
               currentTier = "free";
               userProType = "individual";
               billingInterval = null;
               // Update Firestore in real-time to sync to all other devices seamlessly
               import("firebase/firestore").then(({ updateDoc }) => {
                   updateDoc(userRef, { 
                     tier: "free",
                     proType: null,
                     billingInterval: null,
                     proExpiresAt: null,
                     groupMembers: null
                   }).catch(e => console.error("Error auto-demoting expired subscriber:", e));
               });
             }
          }

          // Clear guest limit immediately if user is pro
          if (currentTier === "pro") {
            localStorage.removeItem('guestExamCount');
          }

          // Initial update for responsiveness
          setProfile({
            tier: currentTier,
            testsTakenThisMonth: Number(data.examCount || 0),
            proType: userProType,
            billingInterval,
            proExpiresAt: expiresAt,
            groupAdminUid,
            groupMembers,
            tutorQueriesUsed: Number(data.tutorQueriesUsed || 0),
            lastTutorQueryDate: data.lastTutorQueryDate || null,
            name: data.name || user.displayName || (user.email ? user.email.split("@")[0].split(/[^a-zA-Z]/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).filter(Boolean).join(" ") : "Student Scholar"),
          });

          // Secondary checks for community-based tiers (referrals/groups)
          if (currentTier !== "pro" && (user.emailVerified || data.emailVerified)) {
            try {
              const { collection, query, where, getDocs, updateDoc } = await import("firebase/firestore");
              
              // Check Referrals
              let refSnap;
              try {
                const refQ = query(collection(db, "referrals"), where("referrerId", "==", user.uid));
                refSnap = await getDocs(refQ);
              } catch (err) {
                handleFirestoreError(err, OperationType.LIST, "referrals");
              }
              
              if (refSnap && refSnap.size >= 12) {
                await updateDoc(userRef, { tier: "pro", proType: "referrals" });
                // Note: The onSnapshot will fire again from the updateDoc
                return;
              }

              // Check if we are in someone else's Study Group
              if (user.email) {
                let groupsSnap;
                try {
                  const groupsQ = query(collection(db, "users"), where("groupMembers", "array-contains", user.email.toLowerCase().trim()));
                  groupsSnap = await getDocs(groupsQ);
                } catch (err) {
                  handleFirestoreError(err, OperationType.LIST, "users");
                }
                
                if (groupsSnap && !groupsSnap.empty) {
                  setProfile(prev => ({
                    ...prev,
                    tier: "pro",
                    proType: "companion",
                    groupAdminUid: groupsSnap.docs[0].id
                  }));
                  localStorage.removeItem('guestExamCount');
                }
              }
            } catch(e) {
              console.error("Error checking secondary tiers:", e);
            }
          }
        } else {
          const guestCount = Number(localStorage.getItem('guestExamCount') || 0);
          setProfile({ tier: "free", testsTakenThisMonth: guestCount });
        }
        setLoading(false);
      },
      (error) => {
        clearTimeout(safetyTimeout);
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribeProfile();
    };
  }, [user]);

  return (
    <UserContext.Provider value={{ user, profile, loading, logout, isLoggingOut }}>
      {children}
    </UserContext.Provider>
  );
};
