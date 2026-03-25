import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { put } from '@vercel/blob';

export const runtime = "nodejs"; // Use Node.js runtime

// Define the response type
type UploadResponse = {
  success: boolean;
  fileId?: number | string;
  status?: string;
  error?: string;
  retryable?: boolean;
  url?: string;
};

// Define type for the server-side JSON request body
interface FileUploadData {
  name: string;
  type: string;
  base64: string;
}

// Define type for handleUpload response that includes url property
interface BlobResponse {
  url: string;
}

/**
 * Direct upload handler for client-side uploads to Vercel Blob
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if this is a client upload request from @vercel/blob
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        // Parse the body once
        const bodyText = await request.text();
        const body = JSON.parse(bodyText);
        
        // If this is a client upload request (contains tokenPayload or blob properties)
        if (body.tokenPayload || body.blob) {
          // Create a new request with the same body for the handleUpload function
          const blobRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: bodyText
          });
          
          return await handleClientUpload(blobRequest);
        }
        
        // Otherwise, handle as a base64 upload from mobile
        return await handleBase64Upload(request, body as FileUploadData);
      } catch (error) {
        console.error("JSON parsing error:", error);
        return NextResponse.json<UploadResponse>(
          { success: false, error: "Invalid JSON format", retryable: false },
          { status: 400 }
        );
      }
    }
    
    // Handle as client upload request if not JSON
    // Create a clone for the handleUpload function
    const blobRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    return await handleClientUpload(blobRequest);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json<UploadResponse>(
      { 
        success: false, 
        error: "Server error during upload", 
        retryable: true 
      },
      { status: 500 }
    );
  }
}

/**
 * Handles client-side uploads via Vercel Blob
 */
async function handleClientUpload(request: Request): Promise<NextResponse> {
  try {
    // Check authentication using Clerk
    const { userId } = await auth();
    
    // If no userId, user is not authenticated
    if (!userId) {
      console.error("Unauthorized upload attempt - no userId");
      return NextResponse.json<UploadResponse>(
        { success: false, error: "Unauthorized", retryable: false },
        { status: 401 }
      );
    }
    
    const jsonResponse = await handleUpload({
      body: await request.json() as HandleUploadBody,
      request,
      onBeforeGenerateToken: async () => {
        // Authenticate user and validate upload permissions
        if (!userId) {
          throw new Error('Not authorized');
        }
        
        return {
          allowedContentTypes: [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'application/pdf',
            'text/plain',
            'text/markdown'
          ],
          tokenPayload: JSON.stringify({
            userId: userId
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        try {
          console.log('blob upload completed', blob);
          
          // Save to database just like in the original uploadFile implementation
          const { db, uploadedFiles } = await import("@/drizzle/schema");
          
          await db
            .insert(uploadedFiles)
            .values({
              userId,
              originalName: blob.pathname.split('/').pop() || 'unknown',
              fileType: blob.contentType || 'application/octet-stream',
              status: "uploaded",
              blobUrl: blob.url,
            });
            
        } catch (error) {
          console.error('Error in onUploadCompleted:', error);
        }
      },
    });
    
    // Determine a fileId from the blob response if available
    let fileId: string | undefined;
    let blobUrl: string | undefined;
    
    if (jsonResponse && typeof jsonResponse === 'object' && 'url' in jsonResponse) {
      const blobResponse = jsonResponse as BlobResponse;
      blobUrl = blobResponse.url;
      fileId = blobUrl.split('/').pop();
    }
    
    return NextResponse.json({
      success: true,
      status: 'completed',
      fileId,
      url: blobUrl
    });
  } catch (error) {
    console.error("Client upload error:", error);
    return NextResponse.json<UploadResponse>(
      { 
        success: false, 
        error: (error as Error).message || "Upload failed", 
        retryable: true 
      },
      { status: 400 }
    );
  }
}

/**
 * Handles base64 uploads from mobile clients
 */
async function handleBase64Upload(request: NextRequest, fileData: FileUploadData): Promise<NextResponse> {
  // Check authentication using Clerk
  const { userId } = await auth();
  
  // If no userId, user is not authenticated
  if (!userId) {
    console.error("Unauthorized upload attempt - no userId");
    return NextResponse.json<UploadResponse>(
      { success: false, error: "Unauthorized", retryable: false },
      { status: 401 }
    );
  }
  
  console.log("Received file data:", { 
    name: fileData.name, 
    type: fileData.type,
    base64Length: fileData.base64?.length 
  });

  const { name, type, base64 } = fileData;

  if (!name || !type || !base64) {
    console.error("Missing required fields");
    return NextResponse.json<UploadResponse>(
      { success: false, error: "Missing required fields", retryable: true },
      { status: 400 }
    );
  }

  try {
    console.log(`Processing base64 upload request with userId: ${userId}`);
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');
    
    // Upload to Vercel Blob
    const blob = await put(name, buffer, {
      access: 'public',
      contentType: type,
    });
    
    // Create database record like in the original uploadFile function
    // Import the database schema
    const { db, uploadedFiles } = await import("@/drizzle/schema");
    
    // Create database record
    const [file] = await db
      .insert(uploadedFiles)
      .values({
        userId,
        originalName: name,
        fileType: type,
        status: "uploaded",
        blobUrl: blob.url,
      })
      .returning();
    
    return NextResponse.json<UploadResponse>({
      success: true,
      fileId: file.id,
      status: file.status,
      url: blob.url
    });
  } catch (error) {
    console.error("Base64 upload error:", error);
    return NextResponse.json<UploadResponse>(
      { 
        success: false, 
        error: (error as Error).message || "Failed to upload file", 
        retryable: true 
      },
      { status: 500 }
    );
  }
}