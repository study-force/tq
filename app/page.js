import { redirect } from "next/navigation";

// 기존 index.html(meta refresh)을 대체. 루트(/) 접속 시 응시 페이지로.
export default function Page() {
  redirect("/tq_v5_prod.html");
}
