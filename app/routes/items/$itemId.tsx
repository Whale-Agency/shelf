import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";

import { requireAuthSession, commitAuthSession } from "~/modules/auth";
import { deleteItem, getItem } from "~/modules/item";
import { assertIsDelete, getRequiredParam } from "~/utils";

export async function loader({ request, params }: LoaderArgs) {
  const { userId } = await requireAuthSession(request);

  const id = getRequiredParam(params, "itemId");

  const item = await getItem({ userId, id });
  if (!item) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ item });
}

export async function action({ request, params }: ActionArgs) {
  assertIsDelete(request);
  const id = getRequiredParam(params, "itemId");
  const authSession = await requireAuthSession(request);

  await deleteItem({ userId: authSession.userId, id });

  return redirect("/items", {
    headers: {
      "Set-Cookie": await commitAuthSession(request, { authSession }),
    },
  });
}

export default function ItemDetailsPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h3 className="text-2xl font-bold">{data.item.title}</h3>
      <p className="py-6">{data.item.description}</p>
      <hr className="my-4" />
      <Form method="delete">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white focus:bg-blue-400 hover:bg-blue-600"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Item not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
