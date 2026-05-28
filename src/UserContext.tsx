import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface UserProfile {
  tier: "free" | "pro";
  testsTakenThisMonth: number;
  proType?: "individual" | "group" | "companion" | "referrals";
  groupAdminUid?: string | null;
  groupMembers?: string[] | null;
  tutorQueriesUsed?: number;
  lastTutorQueryDate?: string | null;
}

interface UserContextType {
  user: any; // Firebase user
  profile: UserProfile;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: { tier: "free", testsTakenThisMonth: 0 },
  loading: true,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile>({
    tier: "free",
    testsTakenThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile({ tier: "free", testsTakenThisMonth: 0 });
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(
      userRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let currentTier = data.tier || "free";
          let userProType = data.proType || "individual";
          let groupAdminUid = data.groupAdminUid || null;
          let groupMembers = data.groupMembers || null;
          
          // Check Referrals
          try {
             const { collection, query, where, getDocs, updateDoc } = await import("firebase/firestore");
             const refQ = query(collection(db, "referrals"), where("referrerId", "==", user.uid));
             const refSnap = await getDocs(refQ);
             if (refSnap.size >= 5 && currentTier !== "pro") {
                // Auto-upgrade to Pro!
                await updateDoc(userRef, { tier: "pro", proType: "referrals" });
                currentTier = "pro";
                userProType = "referrals";
             }
          } catch(e) {
             console.error("Error checking referrals:", e);
          }

          // If NOT explicitly pro, check if we are in someone else's Study Group
          if (currentTier !== "pro" && user.email) {
             try {
                const { collection, query, where, getDocs } = await import("firebase/firestore");
                const groupsQ = query(collection(db, "users"), where("groupMembers", "array-contains", user.email.toLowerCase().trim()));
                const groupsSnap = await getDocs(groupsQ);
                if (!groupsSnap.empty) {
                   currentTier = "pro";
                   userProType = "companion";
                   const adminData = groupsSnap.docs[0].data();
                   groupAdminUid = groupsSnap.docs[0].id;
                }
             } catch (e) {
                console.error("Error looking up shared groups:", e);
             }
          }
          
          setProfile({
            tier: currentTier,
            testsTakenThisMonth: Number(data.examCount || 0),
            proType: userProType,
            groupAdminUid,
            groupMembers,
            tutorQueriesUsed: Number(data.tutorQueriesUsed || 0),
            lastTutorQueryDate: data.lastTutorQueryDate || null,
          });
        } else {
          setProfile({ tier: "free", testsTakenThisMonth: 0 });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  return (
    <UserContext.Provider value={{ user, profile, loading }}>
      {children}
    </UserContext.Provider>
  );
};
