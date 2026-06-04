import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  try {
    // Parse the payload from the Database Webhook
    const payload = await req.json()
    
    // Check if this is an INSERT event
    if (payload.type === "INSERT" && payload.table === "login_verifications") {
      const record = payload.record
      
      // Extract details
      const email = record.email
      const token = record.id
      const deviceId = record.device_id
      
      // In production, change this to your actual deployed app URL
      const verificationUrl = `https://your-app-domain.com/verify-login?token=${token}`

      if (!RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not set in Edge Function secrets.")
      }

      // Send email using Resend API
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Security Team <security@your-domain.com>", // Update to your verified domain on Resend
          to: [email],
          subject: "Action Required: Secure Login Request",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2>Unrecognized Login Attempt</h2>
              <p>Hello,</p>
              <p>An unrecognized login attempt was recorded on your account.</p>
              <p>For security reasons, we require a verification challenge to register this browser fingerprint as a trusted device.</p>
              <p><strong>Device ID:</strong> <code>${deviceId}</code></p>
              <div style="margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Confirm & Trust This Device
                </a>
              </div>
              <p style="font-size: 12px; color: #666;">
                This token is single-use and will expire in 15 minutes.<br>
                Secure auth token ID: ${token}
              </p>
              <p style="font-size: 12px; color: #666; margin-top: 20px;">
                If you did not attempt to sign in, please ignore this email and your account will remain secure.
              </p>
            </div>
          `,
        }),
      })

      const responseData = await res.json()
      
      if (!res.ok) {
        console.error("Resend API error:", responseData)
        throw new Error(JSON.stringify(responseData))
      }

      return new Response(JSON.stringify({ success: true, id: responseData.id }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ message: "Not an INSERT event for login_verifications" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
    
  } catch (error: any) {
    console.error("Error in Edge Function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
