import { NextRequest, NextResponse } from "next/server";
import { getFileStatus } from "@/app/dashboard/sync/actions";
import { auth } from "@clerk/nextjs/server";

// Define the response type locally
type FileStatusResponse = {
  status: string;
  text: string | null;
  error: string | null;
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication using Clerk
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
    } 
    // If no userId and no valid token, user is not authenticated
    else if (!userId) {
      console.error("Unauthorized status check attempt - no userId");
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }
    
    // Get fileId from request parameters
    const fileId = parseInt(request.nextUrl.searchParams.get("fileId") || "0", 10);

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    console.log(`Processing file status request for fileId: ${fileId}`);
    
    // For the mobile app, we need to allow access even without a specific userId
    // This is a simplified approach - in production, validate the token properly
    const result = userId ? await getFileStatus(fileId, userId) : await getFileStatus(fileId, "mobile-user");
    
    if (!result) {
      console.error(`Unexpected null result from getFileStatus for fileId: ${fileId}`);
      return NextResponse.json(
        { error: "Failed to retrieve file status" },
        { status: 500 }
      );
    }
    
    console.log(result);
    
    // and not null
    if ('error' in result && result.error !== null) {
      console.log(`Error in getFileStatus: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Unauthorized" ? 401 : 
                result.error === "File not found" ? 404 : 500 }
      );
    }

    // Ensure proper response structure before sending
    const response = result as FileStatusResponse;
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Status check error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Failed to check file status", 
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// Also implement POST to handle the same requests from mobile app
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { fileId } = requestData;
    
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }
    
    // Create a modified version of the request with the fileId as a query parameter
    const url = new URL(request.url);
    url.searchParams.set('fileId', fileId.toString());
    const modifiedRequest = new NextRequest(url, {
      headers: request.headers,
      method: 'GET'
    });
    
    return GET(modifiedRequest);
  } catch (error) {
    console.error("Error parsing POST request:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }
}