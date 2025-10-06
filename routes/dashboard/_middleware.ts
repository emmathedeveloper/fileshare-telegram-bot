import { getCookies } from "@std/http";
import { define } from "../../utils.ts";


export default define.middleware((ctx) => {

    const cookies = getCookies(ctx.req.headers)

    if(!cookies.logged_in) return ctx.redirect('/login')

    return ctx.next()
})