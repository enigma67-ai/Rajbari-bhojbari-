import { createClient } from "@supabase/supabase-js";

// Read Supabase credentials from environment (supports NEXT_PUBLIC_, VITE_, and default naming)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://rrvjsyppggtthqfxvquq.supabase.co";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydmpzeXBwZ2d0dGhxZnh2cXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.mock_key";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const booking_id = (
      body?.booking_id ||
      body?.bookingId ||
      body?.id ||
      ""
    ).toString().trim();

    if (!booking_id) {
      return Response.json(
        { success: false, message: "Missing booking_id parameter" },
        { status: 400 }
      );
    }

    // 3. Query the Supabase bookings table for that booking_id
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_id", booking_id)
      .maybeSingle();

    if (fetchError) {
      console.error("[validate-pass] Supabase query error:", fetchError);
      return Response.json(
        { success: false, message: "Database query error", error: fetchError.message },
        { status: 500 }
      );
    }

    // 6. If not found, return a message saying 'Invalid Pass'
    if (!booking) {
      return Response.json(
        { success: false, message: "Invalid Pass" },
        { status: 404 }
      );
    }

    // 5. If already admitted, return a message saying 'Pass Already Used'
    const isAlreadyAdmitted =
      booking.status === "admitted" ||
      booking.entry_status === "admitted" ||
      booking.verified_at_gate === true ||
      booking.is_admitted === true;

    if (isAlreadyAdmitted) {
      return Response.json(
        {
          success: false,
          message: "Pass Already Used",
          booking: {
            booking_id: booking.booking_id,
            customer_name: booking.customer_name,
            admitted_at: booking.admitted_at || booking.verified_at_gate_time || booking.updated_at,
          },
        },
        { status: 400 }
      );
    }

    // 4. If found, update the status to 'admitted' and return { success: true, message: 'Valid Pass' }
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "admitted",
        entry_status: "admitted",
        verified_at_gate: true,
        verified_at_gate_time: nowIso,
        admitted_at: nowIso,
        updated_at: nowIso,
      })
      .eq("booking_id", booking_id);

    if (updateError) {
      console.error("[validate-pass] Supabase update error:", updateError);
      return Response.json(
        { success: false, message: "Failed to update pass status", error: updateError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Valid Pass",
      booking: {
        booking_id: booking.booking_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        pass_quantity: booking.pass_quantity,
        admitted_at: nowIso,
      },
    });
  } catch (err: any) {
    console.error("[validate-pass] Unexpected server error:", err);
    return Response.json(
      { success: false, message: "Internal server error", error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
