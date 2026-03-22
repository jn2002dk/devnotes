import { NextResponse } from "next/server";
import { defaultWorkspaceCollection } from "@/data/defaultWorkspace";
import { getStoredWorkspaceCollection, saveStoredWorkspaceCollection } from "@/lib/server/workspace-repository";
import { parseWorkspacePayload } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store"
};

export async function GET() {
  try {
    const collection = await getStoredWorkspaceCollection();

    return NextResponse.json(
      {
        collection: collection ?? defaultWorkspaceCollection,
        hasPersisted: Boolean(collection)
      },
      {
        headers: noStoreHeaders
      }
    );
  } catch {
    return NextResponse.json(
      {
        error: "Unable to load workspace data."
      },
      {
        status: 500,
        headers: noStoreHeaders
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as {
      collection?: unknown;
    } | unknown;
    const collection = parseWorkspacePayload(
      typeof payload === "object" && payload !== null && "collection" in payload
        ? payload.collection
        : payload
    );

    if (!collection) {
      return NextResponse.json(
        {
          error: "A valid workspace collection is required."
        },
        {
          status: 400,
          headers: noStoreHeaders
        }
      );
    }

    const savedCollection = await saveStoredWorkspaceCollection(collection);

    return NextResponse.json(
      {
        collection: savedCollection
      },
      {
        headers: noStoreHeaders
      }
    );
  } catch {
    return NextResponse.json(
      {
        error: "Unable to save workspace data."
      },
      {
        status: 500,
        headers: noStoreHeaders
      }
    );
  }
}