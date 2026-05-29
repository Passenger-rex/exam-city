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
        const guestCount = Number(localStorage.getItem('guestExamCount') || 0);
        setProfile({ tier: "free", testsTakenThisMonth: guestCount });
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
          
          // Clear guest limit immediately if user is pro
          if (currentTier === "pro") {
            localStorage.removeItem('guestExamCount');
          }

          // Initial update for responsiveness
          setProfile({
            tier: currentTier,
            testsTakenThisMonth: Number(data.examCount || 0),
            proType: userProType,
            groupAdminUid,
            groupMembers,
            tutorQueriesUsed: Number(data.tutorQueriesUsed || 0),
            lastTutorQueryDate: data.lastTutorQueryDate || null,
          });

          // Secondary checks for community-based tiers (referrals/groups)
          if (currentTier !== "pro") {
            try {
              const { collection, query, where, getDocs, updateDoc } = await import("firebase/firestore");
              
              // Check Referrals
              const refQ = query(collection(db, "referrals"), where("referrerId", "==", user.uid));
              const refSnap = await getDocs(refQ);
              if (refSnap.size >= 12) {
                await updateDoc(userRef, { tier: "pro", proType: "referrals" });
                // Note: The onSnapshot will fire again from the updateDoc
                return;
              }

              // Check if we are in someone else's Study Group
              if (user.email) {
                const groupsQ = query(collection(db, "users"), where("groupMembers", "array-contains", user.email.toLowerCase().trim()));
                const groupsSnap = await getDocs(groupsQ);
                if (!groupsSnap.empty) {
                  const adminData = groupsSnap.docs[0].data();
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
