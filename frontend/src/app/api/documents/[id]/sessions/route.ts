import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PostSessionParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: NextRequest, { params }: PostSessionParams) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const { id: documentId } = await params;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }


    // Find existing reading session for this document
    const { data: existingSession, error: sessionError } = await supabase
      .from("reading_sessions")
      .select("id, created_at, completed, target_wpm")
      .eq("user_id", user.id)
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

      console.log("Existing session query result:", { existingSession, sessionError });

    if (sessionError && sessionError.code !== "PGRST116") {
      return NextResponse.json(
        {
          error: sessionError?.message ?? "Failed to fetch reading session",
        },
        { status: 400 },
      );
    }

    if (!existingSession) {
      return NextResponse.json(
        { error: "No reading session found for this document" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        sessionId: existingSession.id,
        fileId: documentId,
        targetWpm: existingSession.target_wpm,
        created_at: existingSession.created_at,
        completed: existingSession.completed,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create reading session",
      },
      { status: 500 },
    );
  }
}
