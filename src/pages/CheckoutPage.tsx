import React, { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Check, Shield, Lock, ChevronLeft, Zap, ArrowRight, Users, User, CircleCheck } from "lucide-react";
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
  const [isLifetime, setIsLifetime] = useState(true);

  const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";

  const plans = [
    {
      id: "individual" as const,
      name: "Individual Pro",
      description: "Lifetime private coaching and ultimate diagnostic exams just for you.",
      monthlyPrice: "₦490",
      lifetimePrice: "₦1,500",
      features: [
        { text: "Unlimited premium mock exams" },
        { text: "Advanced AI-powered diagnostics" },
        { text: "Ad-free premium simulator" },
        { text: "Personal study metric indicators" },
      ],
    },
    {
      id: "group" as const,
      name: "Study Group Premium",
      description: "Link and share premium access with up to 5 student accounts under a single plan.",
      monthlyPrice: "₦1,190",
      lifetimePrice: "₦3,500",
      features: [
        { text: "Unlimited premium mock exams" },
        { text: "Advanced AI-powered diagnostics" },
        { text: "Ad-free premium simulator" },
        { text: "Link up to 4 companion emails" },
        { text: "Dedicated administrator controls" },
      ],
    }
  ];

  const getAmount = () => {
    if (selectedPlan === "group") {
      return isLifetime ? 3500 : 1190;
    } else {
      return isLifetime ? 1500 : 490;
    }
  };

  const config = {
    public_key: flutterwaveKey || "FLWPUBK_TEST-SANDBOXDEMOKEY-X",
    tx_ref: Date.now().toString(),
    amount: getAmount(),
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: user?.email || "user@example.com",
      phone_number: "",
      name: user?.displayName || "User",
    },
    customizations: {
      title: selectedPlan === "group" ? "Study Group Premium" : "Pro Premium",
      description: selectedPlan === "group" 
        ? `${isLifetime ? "Lifetime" : "Monthly"} Group Access for 5 students` 
        : `${isLifetime ? "Lifetime" : "Monthly"} Individual access to premium capabilities`,
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

    setLoading(true);

    handleFlutterPayment({
      callback: async (response) => {
        if (response.status === "successful" || response.status === "completed") {
          try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { 
              tier: "pro",
              proType: selectedPlan,
              billingInterval: isLifetime ? "lifetime" : "monthly",
              proExpiresAt: isLifetime ? null : Date.now() + 30 * 24 * 60 * 60 * 1000,
              groupAdminUid: user.uid,
              // Group plan holds up to 5 members (admin + 4 companions)
              groupMaxUsers: 5,
              groupMembers: selectedPlan === "group" ? [] : null
            }, { merge: true });
            
            closePaymentModal();
            setTransactionId(response.transaction_id + "");
            setPaymentSuccess(true);
            setLoading(false);
            
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
          setLoading(false);
        }
      },
      onClose: () => {
        setLoading(false);
      },
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
            className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100/50 dark:bg-emerald-950/30 dark:text-emerald-400"
          >
            <Check className="w-10 h-10" />
          </motion.div>
          <h2 className="text-3xl font-extrabold font-headline-xl text-on-surface mb-3 tracking-tight">Payment Successful</h2>
          <p className="text-on-surface-variant text-base font-medium mb-8">
            Welcome to the Pro tier! Your premium features are now active.
          </p>
          <div className="bg-surface-dim/50 rounded-2xl p-6 mb-8 text-left border border-outline-variant/50 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none text-emerald-900">
              <Check className="w-32 h-32" />
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-on-surface-variant font-medium">Amount Paid</span>
              <span className="font-bold text-lg text-on-surface">₦{getAmount().toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-on-surface-variant font-medium">Subscription</span>
              <span className="font-bold text-primary">
                {selectedPlan === "group" ? "Study Group Premium" : "Individual Pro"} ({isLifetime ? "Lifetime" : "Monthly"})
              </span>
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
    <div className="min-h-screen bg-background flex flex-col font-body-md text-on-background selection:bg-primary/20 selection:text-primary pb-16">
      {/* Navigation */}
      <nav className="px-4 py-3 sm:px-6 sm:py-4 md:px-10 flex items-center justify-between border-b border-outline-variant/30 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Logo />
        <button 
          onClick={() => navigate(-1)} 
          className="text-[11px] sm:text-xs font-bold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 group transition-colors bg-surface hover:bg-surface-dim px-3.5 py-1.5 rounded-full border border-outline-variant/50 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
      </nav>

      <section className="py-8 md:py-12">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header section with professional balanced text alignment */}
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2.5 text-center mb-8 md:mb-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              Premium Upgrade
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3.5xl font-black tracking-tight text-on-surface leading-tight mt-1.5">
              Elevate Your Preparation
            </h2>
            <div className="w-12 h-1 bg-primary/20 rounded-full my-1"></div>
            <p className="text-on-surface-variant text-[11px] sm:text-xs md:text-sm max-w-2xl mx-auto leading-relaxed text-center font-medium px-2 sm:px-6">
              Unlock unlimited interactive mock exams, advanced diagnostic metrics, deep study coach reasoning, and premium simulators instantly.
            </p>
          </div>

          {/* Unified Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full max-w-5xl mx-auto select-none">
            
            {/* Bento Module 1: Settings & Trust */}
            <div className="bg-surface border border-outline-variant/40 rounded-[24px] p-5 sm:p-6 flex flex-col justify-between gap-6 transition-all shadow-xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary block mb-3 leading-none">Billing Settings</span>
                
                {/* Interval Toggle Switch */}
                <div className="flex flex-col gap-3 bg-surface-dim/40 border border-outline-variant/30 rounded-[20px] p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest leading-none">Select Interval</span>
                  <div className="flex items-center justify-between gap-2.5">
                    <span className={`text-[11px] sm:text-xs font-extrabold transition-colors duration-200 ${!isLifetime ? 'text-primary' : 'text-on-surface-variant'}`}>
                      Monthly Pass
                    </span>
                    <button
                      onClick={() => setIsLifetime(!isLifetime)}
                      aria-label="Toggle subscription interval"
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isLifetime ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isLifetime ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className={`text-[11px] sm:text-xs font-extrabold transition-colors duration-200 flex items-center gap-1 ${isLifetime ? 'text-primary' : 'text-on-surface-variant'}`}>
                      Lifetime
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full uppercase tracking-wider scale-90">
                        Save
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Profile Info */}
              <div className="space-y-4">
                <div className="bg-surface-dim/40 border border-outline-variant/30 rounded-[20px] p-4 flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest leading-none">Active Profile</span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {userLoading ? (
                      <div className="w-8 h-8 rounded-full bg-outline-variant/20 animate-pulse shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 select-none">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-on-surface truncate leading-none">{user?.email || "user@example.com"}</p>
                      <span className="text-[9px] text-emerald-600 font-extrabold tracking-widest uppercase mt-1.5 block leading-none">Session Active</span>
                    </div>
                  </div>
                </div>

                {/* Secure Badge */}
                <div className="flex items-start gap-2 text-[10px] sm:text-xs text-on-surface-variant bg-surface-dim/35 p-3.5 rounded-[20px] border border-outline-variant/20">
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">Secure checkout powered by Flutterwave TLS.</span>
                </div>
              </div>
            </div>

            {/* Bento Module 2 & 3: Plan Selection Grid */}
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const currentPrice = isLifetime ? plan.lifetimePrice : plan.monthlyPrice;
              const renewalText = isLifetime 
                ? "Full premium access forever" 
                : "Billed monthly, cancel anytime";

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`flex flex-col justify-between text-left rounded-[24px] border p-5 sm:p-6 transition-all relative cursor-pointer ${
                    isSelected
                      ? "bg-surface border-primary ring-2 ring-primary/25 shadow-md scale-[1.01]"
                      : "bg-surface border-outline-variant/60 hover:border-primary/40 hover:scale-[1.005] shadow-xs"
                  }`}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <span className="absolute top-5 right-5 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3" />
                    </span>
                  )}

                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary block mb-1">
                      {plan.id === "group" ? "Multi-Account" : "Single Account"}
                    </span>
                    <span className="text-sm sm:text-base md:text-lg font-black text-on-surface">{plan.name}</span>
                    <p className="text-[10px] sm:text-[11px] md:text-xs text-on-surface-variant mt-2 leading-relaxed min-h-[44px]">
                      {plan.description}
                    </p>
                    
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-xl sm:text-2xl md:text-3xl font-black text-on-surface tracking-tight">
                        {currentPrice}
                      </span>
                      <span className="text-[10px] sm:text-xs text-on-surface-variant font-bold">
                        /{isLifetime ? "one-time" : "month"}
                      </span>
                    </div>

                    <p className="text-[9px] sm:text-[10px] text-on-surface-variant/75 font-semibold mt-1">
                      {renewalText}
                    </p>
                  </div>

                  <div className="h-px bg-outline-variant/40 my-4" />

                  <div className="flex-1">
                    {plan.id === "group" && (
                      <p className="text-[9px] font-black text-primary mb-2 uppercase tracking-widest leading-none">Everything in Individual plus:</p>
                    )}
                    
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-[10px] sm:text-xs">
                          <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-on-surface-variant font-semibold leading-normal">{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Activation CTA Button with rounded curve */}
                  <div className="mt-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          handleUpgrade();
                        } else {
                          setSelectedPlan(plan.id);
                        }
                      }}
                      disabled={loading || userLoading}
                      className={`w-full py-2.5 px-4 rounded-[16px] font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-primary text-on-primary hover:bg-primary/95 shadow-md shadow-primary/20"
                          : "bg-surface-dim hover:bg-surface border border-outline text-on-surface"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading && isSelected ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {isSelected ? `Pay ${currentPrice}` : `Select ${plan.name}`}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
}
