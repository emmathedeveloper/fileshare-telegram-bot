import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import { page } from "fresh";
import { getCookies } from "@std/http";

export const handler = define.handlers({
  GET: ctx => {

    const cookies = getCookies(ctx.req.headers)

    return page({ logged_in: !!cookies.logged_in })
  }
})

export default define.page(function Home(ctx) {

  return (
    <>
      <Head>
        <title>Adams</title>
      </Head>
      <div class="mx-auto min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 class="text-3xl md:text-5xl lg:text-7xl">Adams</h1>
        <p>File sharing telegram bot</p>
      </div>
    </>
  );
});
