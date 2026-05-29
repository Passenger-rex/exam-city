import React, { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Check, Shield, Lock, ChevronLeft, Zap, ArrowRight, Star, Users, User } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { Logo } from "../components/Logo";
import { useUser } from "../UserContext";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"individual" | "group">("individual");

  const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";

  const config = {
    public_key: flutterwaveKey || "FLWPUBK_TEST-SANDBOXDEMOKEY-X",
    tx_ref: Date.now().toString(),
    amount: selectedPlan === "group" ? 3500 : 1500,
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: user?.email || "user@example.com",
      phone_number: "",
      name: user?.displayName || "User",
    },
    customizations: {
      title: selectedPlan === "group" ? "Study Group Premium" : "Pro Lifetime Subscription",
      description: selectedPlan === "group" 
        ? "Lifetime Group Access for 5 students tied to one account" 
        : "Lifetime Individual access to high-tier AI capabilities",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleUpgrade = () => {
    if (!user) {
      alert("Please log in first.");
      navigate("/login");
      return;
    }

    if (!flutterwaveKey) {
      alert("Flutterwave Public Key is missing! Please configure VITE_FLUTTERWAVE_PUBLIC_KEY in your environment secrets.");
      return;
    }

    handleFlutterPayment({
      callback: async (response) => {
        if (response.status === "successful" || response.status === "completed") {
          setLoading(true);
          try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { 
              tier: "pro",
              proType: selectedPlan,
              groupAdminUid: user.uid,
              // Group plan holds up to 5 members (admin + 4 companions)
              groupMaxUsers: 5,
              groupMembers: selectedPlan === "group" ? [] : null
            }, { merge: true });
            
            closePaymentModal();
            setTransactionId(response.transaction_id + "");
            setPaymentSuccess(true);
            
            // Navigate faster for "immediate" feel
            setTimeout(() => {
              navigate("/dashboard", { state: { upgradeSuccess: true } });
            }, 2000);
          } catch (err: any) {
            alert("Upgrade failed to save: " + err.message);
            setLoading(false);
          }
        } else {
          alert("Payment was not successful. Status: " + response.status);
        }
      },
      onClose: () => {},
    });
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-body-md text-on-background p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-surface border border-outline-variant/30 rounded-3xl p-6 sm:p-8 md:p-12 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500" />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100/50"
          >
            <Check className="w-12 h-12" />
          </motion.div>
          <h2 className="text-4xl font-extrabold font-headline-xl text-on-surface mb-3 tracking-tight">Payment Successful</h2>
          <p className="text-on-surface-variant text-lg font-medium mb-8">
            Welcome to the Pro tier! Your premium features are now active.
          </p>
          <div className="bg-surface-dim/50 rounded-2xl p-6 mb-8 text-left border border-outline-variant/50 relative overflow-hidden backdrop-blur-sm">
             <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none text-emerald-900">
                <Check className="w-32 h-32" />
             </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-on-surface-variant font-medium">Amount Paid</span>
              <span className="font-bold text-lg">₦{(selectedPlan === "group" ? 3500 : 1500).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-on-surface-variant font-medium">Subscription</span>
              <span className="font-bold text-primary">{selectedPlan === "group" ? "Study Group Premium" : "Individual Lifetime Access"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Transaction ID</span>
              <span className="font-mono text-xs bg-surface-bright px-2.5 py-1 rounded-md text-on-surface border border-outline-variant/50 shadow-sm">{transactionId}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-primary">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Preparing your dashboard...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-md text-on-background selection:bg-primary/20 selection:text-primary pb-20">
      {/* Navigation */}
      <nav className="px-6 py-5 md:px-10 md:py-6 flex items-center justify-between border-b border-outline-variant/30 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Logo />
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-2 group transition-colors bg-surface hover:bg-surface-dim px-4 py-2 rounded-full border border-outline-variant/50"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </nav>

      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-8 md:pt-16 pb-24 px-6 md:px-10">
        
        {/* Left Column: Actions & Form */}
        <div className="lg:col-span-7 flex flex-col order-1">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-4xl font-headline-lg font-bold mb-3 text-on-surface tracking-tight">
              Complete your purchase
            </h1>
            <p className="text-on-surface-variant text-base mb-10">
              Unlock unlimited mock exams, advanced analytics, and premium question banks.
            </p>

            {/* Account Details Panel */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Account Information</h3>
              <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface flex items-center justify-between w-full shadow-sm">
                <div className="flex items-center gap-4 w-full">
                  {userLoading ? (
                    <div className="w-10 h-10 rounded-full bg-outline-variant/30 animate-pulse shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    {userLoading ? (
                       <>
                         <div className="h-4 w-24 bg-outline-variant/30 animate-pulse rounded mb-1" />
                         <div className="h-3 w-40 bg-outline-variant/20 animate-pulse rounded" />
                       </>
                    ) : (
                       <>
                         <span className="font-semibold text-on-surface text-sm">{user?.displayName || "Student Account"}</span>
                         <span className="text-sm text-on-surface-variant truncate">{user?.email || "user@example.com"}</span>
                       </>
                    )}
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap self-center hidden sm:block">
                    Current User
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-outline-variant/40 my-8" />

            {/* Plan Selector */}
            <div className="mb-10">
              <h3 className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Choose subscription plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Individual Plan */}
                <div 
                  onClick={() => setSelectedPlan("individual")}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${selectedPlan === "individual" ? "bg-primary/[0.03] border-primary shadow-sm" : "bg-surface border-outline-variant/60 hover:bg-surface-dim"}`}
                >
                  {selectedPlan === "individual" && (
                    <span className="absolute top-3 right-3 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${selectedPlan === "individual" ? "bg-primary/10 text-primary" : "bg-surface-dim text-on-surface-variant"}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-on-surface">Individual Pro</span>
                    </div>
                    <p className="text-xs text-on-surface-variant/80 font-medium leading-relaxed mb-6">
                      Lifetime private coaching and ultimate diagnostic exams just for you.
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-black text-on-surface">₦1,500</span>
                    <span className="text-[10px] text-on-surface-variant/80 font-bold uppercase">one-time</span>
                  </div>
                </div>

                {/* Group Plan */}
                <div 
                  onClick={() => setSelectedPlan("group")}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${selectedPlan === "group" ? "bg-primary/[0.03] border-primary shadow-md" : "bg-surface border-outline-variant/60 hover:bg-surface-dim"}`}
                >
                  <span className="absolute -top-3 left-4 bg-amber-500 text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse shadow-sm">
                    Best Value
                  </span>
                  {selectedPlan === "group" && (
                    <span className="absolute top-3 right-3 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${selectedPlan === "group" ? "bg-primary/10 text-primary" : "bg-surface-dim text-on-surface-variant"}`}>
                        <Users className="w-4 h-4" />
                      </div>
                    <span className="font-bold text-sm text-on-surface">Study Group Premium</span>
                    </div>
                    <p className="text-xs text-on-surface-variant/80 font-medium leading-relaxed mb-6">
                      Link and share premium access with up to 5 student accounts under a single plan.
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-black text-on-surface">₦3,500</span>
                    <span className="text-[10px] text-on-surface-variant/80 font-bold uppercase">one-time</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-5">
              <h3 className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Payment Details</h3>
              <p className="text-sm text-on-surface-variant mb-6">Payment is securely processed by Flutterwave.</p>
              
              <button 
                onClick={handleUpgrade}
                disabled={loading || userLoading}
                className="w-full h-14 bg-primary text-on-primary font-bold text-base rounded-xl hover:bg-primary/95 transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading || userLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Pay ₦{selectedPlan === "group" ? "3,500" : "1,500"}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant mt-4">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure encrypted transaction</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 order-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-surface border border-outline-variant/50 rounded-2xl p-6 lg:p-8 shadow-sm lg:sticky lg:top-28"
          >
            <h2 className="text-lg font-bold font-headline-md mb-6 text-on-surface flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Order Summary
            </h2>
            
            <div className="flex flex-col">
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-outline-variant/30">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                   <Zap className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-semibold text-base mb-0.5 text-on-surface">Pro Subscription</h3>
                   <p className="text-on-surface-variant text-sm">
                     {selectedPlan === "group" ? "Study Group (5 slots)" : "Individual Plan"}
                   </p>
                </div>
              </div>
              
              <div className="space-y-3 font-medium mb-6 pb-6 border-b border-outline-variant/30 text-sm">
                <div className="flex justify-between items-center text-on-surface-variant">
                   <span>Subtotal</span>
                   <span className="text-on-surface">₦{selectedPlan === "group" ? "3,500" : "1,500"}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                   <span>Taxes & Fees</span>
                   <span className="text-on-surface">₦0</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <span className="text-sm font-semibold text-on-surface-variant">Total</span>
                <div className="flex items-baseline gap-1 text-on-surface">
                   <span className="text-sm font-medium text-on-surface-variant">NGN</span>
                   <span className="text-3xl font-bold tracking-tight">₦{selectedPlan === "group" ? "3,500" : "1,500"}</span>
                </div>
              </div>
              
              <div className="bg-surface-dim/30 rounded-xl p-5 border border-outline-variant/30 space-y-3 mt-auto">
                <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-3">Includes:</h4>
                {[
                  "Unlimited premium exams",
                  "Advanced AI recommendations",
                  "Ad-free premium simulator",
                  selectedPlan === "group" ? "Tie 4 friend accounts to your subscription" : "Personal study metric indicators",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-on-surface-variant text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
