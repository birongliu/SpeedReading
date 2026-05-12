import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PostSessionParams = {
  params: Promise<{
    id: string;
  }>;
};

type PostSessionBody = {
  targetWpm?: number;
};

const clampWpm = (value: number) =>
  Math.min(1000, Math.max(100, Math.round(value)));

export async function POST(req: NextRequest, { params }: PostSessionParams) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const { id: documentId } = await params;
  const body = (await req.json().catch(() => ({}))) as PostSessionBody;

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


    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    let targetWpm = 250;
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("default_wpm")
      .eq("id", user.id)
      .single();

    if (!profileError && typeof profileData?.default_wpm === "number") {
      targetWpm = profileData.default_wpm;
    }

    if (typeof body.targetWpm === "number" && Number.isFinite(body.targetWpm)) {
      targetWpm = clampWpm(body.targetWpm);
    }

    const { data: sessionData, error: sessionError } = await supabase
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
      .select("id, document_id, target_wpm, created_at, completed")
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        {
          error: sessionError?.message ?? "Failed to create reading session",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        sessionId: sessionData.id,
        fileId: sessionData.document_id,
        targetWpm: sessionData.target_wpm,
        created_at: sessionData.created_at,
        completed: sessionData.completed,
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
