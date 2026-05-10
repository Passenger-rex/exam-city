import React, { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Check, Shield, Lock, ChevronLeft, Zap, ArrowRight, Star } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { Logo } from "../components/Logo";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";

  const config = {
    public_key: flutterwaveKey || "FLWPUBK_TEST-SANDBOXDEMOKEY-X",
    tx_ref: Date.now().toString(),
    amount: 1500,
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: auth.currentUser?.email || "user@example.com",
      phone_number: "",
      name: auth.currentUser?.displayName || "User",
    },
    customizations: {
      title: "Pro Subscription",
      description: "Payment for Pro Subscription",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleUpgrade = () => {
    if (!auth.currentUser) {
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
            const userRef = doc(db, "users", auth.currentUser!.uid);
            await setDoc(userRef, { tier: "pro" }, { merge: true });
            
            closePaymentModal();
            setTransactionId(response.transaction_id + "");
            setPaymentSuccess(true);
            
            setTimeout(() => {
              navigate("/dashboard", { state: { upgradeSuccess: true } });
            }, 4000);
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-surface border border-outline-variant/30 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
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
            Welcome to the Pro tier! Let's get you started.
          </p>
          <div className="bg-surface-dim/50 rounded-2xl p-6 mb-8 text-left border border-outline-variant/50 relative overflow-hidden backdrop-blur-sm">
             <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none text-emerald-900">
                <Check className="w-32 h-32" />
             </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-on-surface-variant font-medium">Amount Paid</span>
              <span className="font-bold text-lg">₦1,500</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-on-surface-variant font-medium">Subscription</span>
              <span className="font-bold text-primary">Pro Access</span>
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-body-md text-on-background selection:bg-primary/20 selection:text-primary">
      {/* Left Column: Checkout Form / Actions */}
      <div className="flex-1 flex flex-col bg-surface relative z-10 border-r border-outline-variant/30">
        <nav className="p-6 md:px-12 md:py-8 flex items-center justify-between">
          <Logo />
          <button onClick={() => navigate(-1)} className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-2 group transition-colors">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </nav>
        
        <main className="flex-1 flex flex-col justify-center px-6 py-10 md:px-12 max-w-2xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-8 border border-primary/20">
              <Star className="w-4 h-4 fill-primary/20" />
              Upgrade to Pro
            </div>
            <h1 className="text-4xl md:text-5xl font-headline-xl font-extrabold mb-6 text-on-surface tracking-tight leading-tight">
              Complete your <br/> purchase
            </h1>
            <p className="text-on-surface-variant text-lg mb-10 leading-relaxed max-w-md">
              You're one step away from unlocking premium past questions, unlimited mock exams, and analytics.
            </p>

            {/* Email Contact info display */}
            <div className="mb-10 w-full">
              <h3 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">Account Information</h3>
              <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-dim/30 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-on-surface-variant mb-1">Email address</span>
                  <span className="font-semibold text-on-surface">{auth.currentUser?.email || "user@example.com"}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                   {auth.currentUser?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </div>
            </div>

            <div className="space-y-6 w-full max-w-md">
              <button 
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full h-16 bg-primary text-on-primary font-bold text-lg rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex justify-center items-center gap-3 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Pay ₦1,500 via Flutterwave
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-on-surface-variant font-medium">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Payments are secure and encrypted.</span>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
      
      {/* Right Column: Order Summary */}
      <div className="flex-1 bg-surface-dim/30 hidden md:flex flex-col justify-center px-12 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-md w-full mx-auto z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-2xl font-bold font-headline-md mb-8 text-on-surface">Order Summary</h2>
            
            <div className="bg-surface border border-outline-variant/50 rounded-3xl p-6 shadow-sm mb-8">
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-outline-variant/30">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-inner shrink-0">
                  <Zap className="w-8 h-8 text-on-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface mb-1">Pro Subscription</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Unlimited access to mock exams and analytics features.</p>
                </div>
              </div>
              
              <div className="space-y-4 font-medium mb-6 pb-6 border-b border-outline-variant/30">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="text-on-surface">₦1,500</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Taxes & Fees</span>
                  <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">Included</span>
                </div>
              </div>
              
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold text-on-surface">Total</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-on-surface-variant">NGN</span>
                  <span className="text-4xl font-extrabold text-on-surface tracking-tighter">₦1,500</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                "Unlimited mock exams and question banks",
                "Advanced performance analytics",
                "Ad-free learning environment"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-on-surface-variant text-sm font-medium">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
