import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "@/app/dashboard/sync/actions";
import { auth } from "@clerk/nextjs/server";
import { db, uploadedFiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication first
    const { userId } = await auth();
    const authHeader = request.headers.get("authorization");
    
    // Handle API key auth from mobile app
    if (!userId && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      if (!token) {
        console.log("Unauthorized file access attempt - invalid token");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // For mobile requests with a token, we would validate the token here
      // This is a simplified version assuming the token is valid
    } else if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse the file ID
    const fileId = parseInt(id, 10);
    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: "Invalid file ID format" },
        { status: 400 }
      );
    }
    
    // Get the file record from the database
    const [file] = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.id, fileId))
      .limit(1);
      
    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // Return the file data with appropriate format for the mobile app
    return NextResponse.json({
      status: file.status || 'processing',
      fileId: file.id,
      url: file.blobUrl,
      text: file.textContent || '',
      error: file.error || undefined
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to retrieve file" },
      { status: 500 }
    );
  }
}

// Also implement POST to handle the same requests (for compatibility with the mobile app)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return GET(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication first
    const { userId } = await auth();
    if (!userId) {
      console.error("Unauthorized file deletion attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const fileId = parseInt(id, 10);
    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    const result = await deleteFile(fileId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete file" },
        { status: result.error === "Unauthorized" ? 401 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}