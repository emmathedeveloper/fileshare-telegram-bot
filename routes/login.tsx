import { page } from "fresh";
import { setCookie } from "@std/http";
import { define } from "../utils.ts";

export const handler = define.handlers({
  POST: async (ctx) => {
    const form_data = await ctx.req.formData();

    const password = form_data.get("password");

    if (password !== Deno.env.get("ADMIN_CODE")) {
      return page({ error: "incorrect password" });
    }

    const headers = new Headers();

    headers.set("location", "/dashboard");

    setCookie(headers, {
      name: "logged_in",
      value: "yes",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });

    return new Response(null, {
      headers,
      status: 303,
    });
  },
});

export default define.page<typeof handler>(({ data }) => {
  return (
    <main class="size-full flex items-center justify-center flex-col p-4">
      <form class="card w-full md:w-[400px] bg-base-200" method="post">
        <div class="card-body flex flex-col items-center gap-4">
          <h2 class="card-title">Login</h2>

          {data.error &&
            <small class="text-error">{data.error}</small>}

          <input
            class={`input w-full ${data.error && "input-error"}`}
            type="password"
            required
            name="password"
            placeholder="Password"
          />

          <button class="w-full btn btn-primary">LOGIN</button>
        </div>
      </form>
    </main>
  );
});
