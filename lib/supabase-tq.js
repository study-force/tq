import { createClient } from "@supabase/supabase-js";

// 현재 환경(Preview=dev / Production=prod)에서 TQ Supabase 접근.
// dev preview에서는 dev Supabase에 연결되어야 하므로 환경변수를 분리 설정함.

let _client = null;
let _prodClient = null;

export function isTqEnabled() {
  return !!(process.env.TQ_SUPABASE_URL && process.env.TQ_SUPABASE_SERVICE_ROLE_KEY);
}

export function isTqProdEnabled() {
  return !!(process.env.TQ_PROD_SUPABASE_URL && process.env.TQ_PROD_SUPABASE_SERVICE_ROLE_KEY);
}

function normalizeUrl(raw) {
  if (!raw) return "";
  return raw.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

export function getSupabaseTq() {
  if (!isTqEnabled()) {
    throw new Error("TQ_SUPABASE_URL / TQ_SUPABASE_SERVICE_ROLE_KEY 환경변수 필요");
  }
  if (!_client) {
    _client = createClient(
      normalizeUrl(process.env.TQ_SUPABASE_URL),
      process.env.TQ_SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _client;
}

export function getSupabaseTqProd() {
  if (!isTqProdEnabled()) {
    throw new Error("TQ_PROD_SUPABASE_URL / TQ_PROD_SUPABASE_SERVICE_ROLE_KEY 환경변수 필요");
  }
  if (!_prodClient) {
    _prodClient = createClient(
      normalizeUrl(process.env.TQ_PROD_SUPABASE_URL),
      process.env.TQ_PROD_SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _prodClient;
}
