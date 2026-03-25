# Memory: Use Web Search for Failed API/SDK Implementations

Date: 2024-07-30

## Learning

When attempting to implement functionality using an external API or SDK (like Clerk's backend client) and encountering repeated type errors or incorrect method usage despite multiple attempts based on assumed knowledge, it indicates a gap in understanding the specific API contract.

## Application

In such situations, instead of looping through slightly different variations based on assumptions or linter errors alone, the next immediate step should be to **perform a targeted web search**. 

Example search queries:
*   "[Library/SDK Name] [Specific Task] example [Framework Name]"
    *   e.g., "Clerk backend API token authentication example Next.js API route"
*   "[Library/SDK Name] authenticate request from header token"
*   Searching for the specific error message (e.g., "ClerkClient Property 'authenticateRequest' does not exist")

This helps gather accurate, up-to-date documentation or community examples to correct the implementation, preventing wasted attempts and ensuring the correct API usage is found efficiently. 