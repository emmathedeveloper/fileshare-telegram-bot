import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import { page } from "fresh";
import { getCookies } from "@std/http";
import { FaArrowRight } from "react-icons/fa";

export const handler = define.handlers({
  GET: ctx => {

    const cookies = getCookies(ctx.req.headers)

    return page({ logged_in: !!cookies.logged_in })
  }
})

export default define.page<typeof handler>(function Home({ data }) {

  return (
    <>
      <Head>
        <title>Adams</title>
      </Head>
      <div class="mx-auto min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 class="text-3xl md:text-5xl lg:text-7xl">Adams</h1>
        <p>File sharing telegram bot</p>

        <a href={data.logged_in ? '/dashboard' : 'login'} class="btn btn-wide btn-primary">
          {data.logged_in ? 'DASHBOARD' : 'LOGIN'}
          <FaArrowRight />
        </a>
      </div>
    </>
  );
});
