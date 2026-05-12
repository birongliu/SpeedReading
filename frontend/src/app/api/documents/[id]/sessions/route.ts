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

    // Verify document exists and belongs to the user
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Get user's default WPM
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("default_wpm")
      .eq("id", user.id)
      .single();

    const targetWpm =
      profileData && typeof profileData.default_wpm === "number"
        ? profileData.default_wpm
        : 250;

    // Create a new reading session
    const { data: newSession, error: sessionError } = await supabase
      .from("reading_sessions")
      .insert({
        user_id: user.id,
        document_id: documentId,
        target_wpm: targetWpm,
        words_read: 0,
        duration_seconds: 0,
        completed: false,
        start_page: 1,
        end_page: 1,
      })
      .select("id, created_at, completed")
      .single();

    if (sessionError || !newSession) {
      return NextResponse.json(
        {
          error: sessionError?.message ?? "Failed to create reading session",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        sessionId: newSession.id,
        fileId: document.file_id,
        targetWpm,
        created_at: newSession.created_at,
        completed: newSession.completed,
      },
      { status: 201 },
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
