import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface UserProfile {
  tier: "free" | "pro";
  testsTakenThisMonth: number;
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
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            tier: data.tier || "free",
            testsTakenThisMonth: Number(data.examCount || 0),
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
