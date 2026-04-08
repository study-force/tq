// ══════════════════════════════════════════════════════════════
// TQ 판독 엔진 — Supabase Edge Function
// 이 파일은 서버에만 존재합니다. 외부에 절대 노출되지 않습니다.
// 엔진 로직, MESSAGES 데이터, Anthropic API 키 모두 여기에만 존재.
// ══════════════════════════════════════════════════════════════
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-academy-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function getAllowedTokens(): string[] {
  const raw = Deno.env.get("ACADEMY_TOKENS") || "[]";
  try { return JSON.parse(raw); } catch { return []; }
}
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

// ── 속도 기준 ──
const SPDLIM: Record<string,number> = {초저:3000,초고:5000,중등:6000,고등:8000,일반:5000};
const SPDTH: Record<string,number[]> = {초저:[300,500,700],초고:[400,650,900],중등:[450,700,1000],고등:[450,700,1000],일반:[400,650,900]};
function grSpd(s:number,l:string):string{const t=SPDTH[l]||SPDTH["중등"];return s<t[0]?"느림":s<t[1]?"보통이하":s<t[2]?"보통이상":"빠름";}
function toI(v:number,t:number):number{if(v>=t)return 0;const g=t-v,r=g/t;return Math.round((g<=10?r*.5:Math.min(r,1))*100)/100;}
function nbnd(v:number,t:number):boolean{return Math.abs(v-t)<=10;}
function cInt(acc:number,kv:number|null):number{if(kv===null||acc>40)return 0;return Math.max(Math.round(Math.min((kv-acc*.9)/70,1)*100)/100,0);}
function exLb(i:number):string{return i>=.8?"강":i>=.5?"중":i>=.2?"약":"최약";}
function grA(v:number):string{return v>=90?"최상":v>=70?"상":v>=50?"중":v>=30?"하":"최하";}

const SMAP: Record<string,number|null> = {
  "90점 이상":90,"80~89점":80,"70~79점":70,"60~69점":60,"60점 미만":50,
  "1등급":90,"2등급":80,"3등급":70,"4등급":60,"5등급 이하":50,
  "매우잘함":90,"잘함":80,"보통":70,"노력요함":50,"-":null
};

const HAB_ITEMS = [
  "이미 읽은 곳을 다시 읽음","읽다가 글줄을 자주 놓침","짚어가며 읽거나 밑줄을 그음",
  "단어 단위로 또박또박 읽음","소리 내어 읽거나 속발음을 함","긴 문장은 이해가 잘 안됨",
  "긴 문장은 훑어 읽기를 함","긴 글은 내용 기억이 잘 안남","모르는 단어가 없어도 이해가 잘 안됨",
  "글 읽는 속도가 느린 편임"
];
const EFF_ITEMS = [
  "독서량이 많이 부족한 편이다","비문학 책은 어렵게 느껴진다","이해력이 부족한 편이다",
  "시험에서 시간에 쫓긴다","문제를 이해를 못해서 틀린다","서술형 평가 시험 점수가 낮다",
  "지문형 수학문제가 어렵다","국어 시험 점수가 유난히 낮다","두꺼운 책을 읽은 경험이 없다",
  "밤새워 책을 읽은 경험이 없다"
];

function classifyHabits(checked: string[]) {
  const 표면음독키=["소리 내어","또박또박"];
  const 내재재처리키=["이미 읽은 곳","글줄을 자주","짚어가며"];
  const 이해결손키=["긴 문장은 이해","긴 문장은 훑어","긴 글은 내용","모르는 단어가 없어도"];
  const 표면=checked.filter(c=>표면음독키.some(k=>c.includes(k))).length;
  const 재처리=checked.filter(c=>내재재처리키.some(k=>c.includes(k))).length;
  const 이해=checked.filter(c=>이해결손키.some(k=>c.includes(k))).length;
  const 속도=checked.filter(c=>c.includes("글 읽는 속도가 느린")).length;
  return {
    음독습관:표면, 재처리습관:재처리, 이해어려움:이해, 속도문제:속도, 전체:checked.length,
    표면음독:표면, 내재음독재처리:재처리, 내재음독이해:이해,
    전체음독관련:표면+재처리+이해,
    심각도: 표면>=1&&(재처리+이해)>=2?"심함": 표면>=1||(재처리+이해)>=3?"보통": checked.length>=1?"경미":"없음"
  };
}

// ── collectEvidenceLegacy (기존 하드코딩 규칙) ──
function collectEvidenceLegacy(inp: Record<string,any>, kv: number|null, flagC: boolean, flagO: boolean, habClass: Record<string,any>) {
  const acc=inp.acc, fct=inp.fact_score, str_=inp.structure_score, voc=inp.voca_score, wm=inp.wm_score, inf=inp.inference_score, eff=inp.eff_score;
  const gap = fct - str_;
  const spdGrade = grSpd(inp.reading_score, inp.user_section);
  const invSpd  = inp.reading_score>(SPDLIM[inp.user_section]||5000)||inp.reading_score<50;
  const engVal: number|null  = SMAP[inp.eng_score]??null;
  const mathVal: number|null = SMAP[inp.math]??null;
  const effChecked: string[] = inp.reading_effect_checks||[];
  const allHigh = kv!==null && kv>=90 && engVal!==null && engVal>=90 && mathVal!==null && mathVal>=90;
  const examRelated = effChecked.filter((c:string)=>["시험에서 시간에 쫓긴다","문제를 이해를 못해서 틀린다","서술형 평가 시험 점수가 낮다","국어 시험 점수가 유난히 낮다"].includes(c)).length;
  const 두꺼운체크 = effChecked.some((c:string)=>c.includes("두꺼운"));
  const 독서량체크 = effChecked.some((c:string)=>c.includes("독서량"));
  const 밤새워체크 = effChecked.some((c:string)=>c.includes("밤새워"));
  const ev: any[] = [];
  function mpush(arr: any[], id: string, tag: string, text: string) { arr.push({id, t: tag, s: text}); }

  // 1) 성적선행지수
  { const b: any[] = [];
    if(acc>=90)mpush(b,"1_4","강점","최상위권 독해역량");
    if(acc>=90)mpush(b,"1_5","강점","상위 난이도 재검사로 더 정밀한 분석 권고");
    if(acc>=90&&kv!==null&&kv>=80)mpush(b,"1_6_kv","강점","역량과 성적 일치 — 실력 기반 최상위권");
    if(acc>=90&&inp.reading_score>=500&&voc>=80&&wm>=40&&inf>=80)mpush(b,"1_new_teukmok","강점","특목자사고 진학 설계 권장");
    if(acc>=90&&voc<=60&&wm<=30&&inf<=60)mpush(b,"1_new_unstable_top","보통","불안정 최상위권");
    if(acc>=70&&acc<=89)mpush(b,"1_6","강점","공부를 잘 할 수 있는 우수한 소양을 지닌 아이 — 상위권 역량");
    if(acc>=70&&acc<=89&&kv!==null&&kv>=80)mpush(b,"1_7","강점","역량과 성적이 일치 — 실력 기반 상위권");
    if(acc>=70&&acc<=89&&kv!==null&&kv<70)mpush(b,"1_8","주의","역량에 비해 성적이 낮음 — 학습 환경·방법 점검 필요");
    if(acc>=50&&acc<=69)mpush(b,"1_9","보통","기본 공부역량은 갖추고 있으나 개선 여지 있음");
    if(acc>=50&&acc<=69&&spdGrade==="빠름")mpush(b,"1_10","주의","빠르게 읽으려 하기보다 정확하게 이해하는 훈련이 필요");
    if(acc>=30&&acc<=49)mpush(b,"1_11","주의","공부역량 부족으로 공부에 어려움을 겪고 있음");
    if(acc>=30&&acc<=49&&spdGrade==="빠름")mpush(b,"1_12","주의","빠르게 읽고 넘기는 습관으로 인해 내용이 정확히 처리되지 않음");
    if(acc>=30&&acc<=49&&spdGrade==="느림")mpush(b,"1_13","주의","정확히 이해하고 기억하려는 의지는 있으나 역량이 따라주지 않는 상태");
    if(acc>=30&&acc<=49&&spdGrade==="보통")mpush(b,"1_14","주의","독해 정확도가 기준에 미치지 못하는 상태 — 역량 개선이 필요함");
    if(acc<30)mpush(b,"1_15","위험","공부역량이 형성되지 않은 심각한 상태");
    if(acc<30&&spdGrade==="빠름")mpush(b,"1_16","위험","글자를 빠르게 훑지만 내용이 처리되지 않는 상태 — 이해 없이 읽는 습관이 굳어진 상태");
    if(acc<30&&(spdGrade==="느림"||spdGrade==="보통"))mpush(b,"1_17","위험","반복해서 읽어도 이해되지 않고 기억되지 않는 상태");
    if(flagC&&kv!==null&&kv>=80&&acc<=30)mpush(b,"1_1","위험","성적은 역량이 아닌 반복암기와 노력의 결과임");
    if(flagC&&kv!==null&&kv>=80&&acc<=30)mpush(b,"1_2","위험","역량 대비 성적이 과도하게 높은 모순 상태 — 붕괴 임박");
    if(flagC&&kv!==null&&kv>=80&&acc<=30)mpush(b,"1_3","위험","스스로는 문제점을 자각하지 못하고 있을 가능성 높음");
    if(acc<=10)mpush(b,"1_18","위험","하위 난이도 재검사 권고");
    if(flagC&&kv!==null&&kv>=80&&(spdGrade==="보통"||spdGrade==="빠름")&&voc>=50)mpush(b,"1_22_new1774457938890","위험","역량은 갖추어져 있으나 공부에 의지가 없어 성적으로 반영되지 않음");
    ev.push({id:"성적선행지수",title:"1) 성적선행지수",bullets:b});
  }
  // 2) 독해속도
  { const b: any[] = [];
    if(invSpd)mpush(b,"2_1","위험","심각한 속도이상값 감지 — 결과 신뢰도 낮음, 재검사 권고");
    if(acc>=70&&spdGrade==="빠름")mpush(b,"2_2","강점","빠른 독해속도 — 정보처리 효율이 높은 수준");
    if(acc<50&&spdGrade==="빠름")mpush(b,"2_3","위험","빠른 속도로 글자를 넘기고 있어 내용이 실제로 처리되지 않는 상태 — 정확하게 이해하며 읽는 훈련이 필요함");
    if(acc<50&&spdGrade==="보통")mpush(b,"2_4","주의","속도에 비해 정확도가 낮음 — 내용을 충분히 처리하지 않고 넘기는 패턴");
    if(acc<50&&spdGrade==="느림")mpush(b,"2_6","위험","독해속도가 낮아 시험 시간 부족이 예상됨");
    if(acc>=70&&spdGrade==="느림")mpush(b,"eng_5_1","강점","집요하고 꼼꼼하게 읽으려는 성실한 습관");
    if(acc>=70&&spdGrade==="느림")mpush(b,"eng_5_3","보통","학년이 오를수록 시험에서 시간 부족 현상 발생 가능성 높음");
    if(acc>=40&&acc<=69&&spdGrade==="느림")mpush(b,"eng_5_4","보통","성실하게 읽으려 노력하고 있으나 역량 부족으로 반복 처리");
    if(acc<40&&spdGrade==="느림")mpush(b,"eng_5_6","위험","글자를 읽지만 정보처리가 거의 되지 않는 상태 — 여러 번 읽어도 이해·기억이 안 됨");
    if(spdGrade==="보통이하")mpush(b,"eng_5_8","보통","글 읽는 속도는 보통 수준 — 성실하게 읽는 편");
    if(acc<50&&spdGrade==="보통이하")mpush(b,"eng_5_9","주의","속도 대비 정확도가 낮음 — 피상적 독해 가능성");
    if(spdGrade==="보통이상")mpush(b,"eng_5_10","강점","정보처리 속도 양호 — 지적 호기심과 독서 경험 반영");
    if(acc<50&&spdGrade==="보통이상")mpush(b,"eng_5_11","주의","빠른 속도에 비해 정확도 낮음 — 대충 읽는 습관 가능성");
    if(acc>=80&&spdGrade==="빠름")mpush(b,"eng_5_12","강점","우수한 정보처리 속도");
    if(acc<70&&spdGrade==="빠름")mpush(b,"eng_5_13","주의","속도가 매우 빠르나 정확도가 낮음 — 지문을 제대로 읽지 않고 답을 찾는 방식일 가능성");
    // 5_1, 5_2 삭제: 2_3, 2_4와 동일 조건·동일 의미 중복
    if(spdGrade==="느림")mpush(b,"eng_5_26","주의","독해속도 느림을 스스로 인지 — 시험 시간 부족 자각, 측정 결과와 일치");
    // 2_21 삭제: eng_5_12와 동일 조건·의미 중복
    ev.push({id:"독해속도",title:"2) 독해속도",bullets:b});
  }
  // 3) 독서의 양
  { const b: any[] = [];
    if(voc>=75&&!두꺼운체크)mpush(b,"3_1","강점","풍부한 독서 이력이 어휘력에 긍정적으로 작용하고 있음");
    if(voc>=75&&inf>60)mpush(b,"3_2","강점","어휘처리 민감도가 높고 추론능력 발달한 상태로, 문자정보처리 역량을 고루 갖춤");
    if(voc<60&&acc>=70)mpush(b,"3_6","주의","독해정확도에 비해 어휘력이 충분히 발달하지 않음 — 익숙한 분야 위주의 독서로 인한 어휘 편중 가능성");
    if(voc>=30&&voc<=49&&acc<70&&!독서량체크)mpush(b,"3_7","주의","독서 훈련 경험 부족으로 역량 발달 저하");
    if(voc>=30&&voc<=49&&acc<70&&!독서량체크)mpush(b,"3_8","주의","스토리북 정도의 독서 경험만 있을 가능성");
    if(acc<70&&밤새워체크)mpush(b,"3_10","보통","독서에 깊이 몰입한 경험이 적음");
    if(두꺼운체크)mpush(b,"3_11","주의","두꺼운 책을 읽은 경험 없음 — 심층적 독해 경험 부족");
    if(voc>=75)mpush(b,"eng_3_1","강점","비문학 독서 경험이 풍부한 것으로 추정");
    if(voc>=75)mpush(b,"eng_3_2","강점","충분한 독서량이 어휘력 형성에 기여");
    if(voc>=60&&voc<=74)mpush(b,"eng_3_3","보통","적정 수준의 독서 경험 — 비문학 독서 이력 있음");
    if(voc<50&&acc<70&&독서량체크)mpush(b,"eng_3_5","주의","비문학·다양한 분야의 독서 경험이 충분하지 않아 어휘력이 발달하지 않음 — 독서의 질과 범위를 넓히는 것이 필요");
    if(voc<60&&acc<70&&!독서량체크)mpush(b,"eng_3_6","주의","본인은 독서량이 충분하다고 판단하고 있으나, 어휘력 수준으로 보아 양질의 독서(비문학·깊이 있는 독서)가 충분하지 않음");
    if(voc>=35&&voc<=49&&acc<70&&독서량체크)mpush(b,"eng_3_8","주의","독서 훈련 경험이 충분하지 않음 — 스토리북 위주의 가벼운 독서에 머물렀을 가능성");
    if(voc<35)mpush(b,"eng_3_10","위험","독서 경험이 극단적으로 부족하여 어휘 발달이 위험 수준임. 스토리북조차 읽지 않은 것으로 추정");
    if(voc>=60&&acc<40)mpush(b,"eng_3_11","주의","독서량에 비해 독해 처리 능력이 부족 — 읽기 방식의 문제");
    if(voc<60&&acc>=70&&inf<60)mpush(b,"eng_3_19","주의","독해정확도와 독해습관은 양호하나 어휘·추론이 낮음 — 독서량 부족보다 독서 영역의 편중이 원인으로 추정됨. 익숙한 장르·주제 위주로만 읽어온 것으로 보임");
    if(voc<60&&acc>=70&&inf<60)mpush(b,"eng_3_20","주의","다양한 비문학 분야의 독해 경험을 넓히는 것이 어휘와 추론능력 향상의 핵심 과제");
    ev.push({id:"독서의양",title:"3) 독서의 양",bullets:b});
  }
  // 4) 독해의 질
  { const b: any[] = [];
    if(acc>=70&&gap<30)mpush(b,"4_1","강점","지문의 세부 정보와 핵심 내용을 균형 있게 파악하는 독해 능력");
    if(acc>=70&&voc<acc-20)mpush(b,"4_4","주의","독해 능력에 비해 어휘력이 충분히 발달하지 않음 — 독서 편식 가능성");
    if(acc>=70&&gap>=30)mpush(b,"eng_4_1","강점","세부 사실 정보 파악 능력 우수");
    if(acc>=70&&gap>=30)mpush(b,"eng_4_2","주의","구조적 이해 부족 — 글의 구조·흐름·의도 파악이 부족");
    if(acc>=70&&gap>=30)mpush(b,"eng_4_3","주의","세부정보에 집착하다 큰 틀을 놓치는 패턴");
    if(acc>=70&&gap<=-20)mpush(b,"eng_4_4","강점","글의 구조와 흐름 파악 능력 양호");
    if(acc>=70&&gap<=-20)mpush(b,"eng_4_5","주의","세부 사실 정보 처리는 상대적으로 부족");
    if(acc>=70&&Math.abs(gap)<20)mpush(b,"eng_4_7","강점","지문 내용을 정확히 이해하고 기억하려고 노력함");
    if(acc>=70&&spdGrade==="빠름"&&voc<acc-20)mpush(b,"eng_4_8","주의","독해능력에 비해 어휘력이 저조 — 글을 빠르게 처리하는 과정에서 어휘 정보를 정교하게 처리하지 않는 습관에서 기인한 것으로, 독서량 부족보다는 읽기 방식의 문제");
    if(acc>=50&&acc<=69&&gap>=20)mpush(b,"eng_4_9","보통","기본적인 세부 사실 정보 파악 가능");
    if(acc>=50&&acc<=69&&gap>=20)mpush(b,"eng_4_10","주의","글의 구조를 통해 글쓴이의 의도 파악이 부족함");
    if(acc<50)mpush(b,"eng_4_12","위험","글의 내용 이해 자체가 어려운 상태");
    if(acc<50&&fct<30)mpush(b,"eng_4_13","위험","글을 읽어도 내용을 기억하거나 이해하지 못함");
    if(acc<50&&str_<20)mpush(b,"eng_4_14","위험","글의 구조와 흐름 파악 불가 — 글쓴이의 의도 파악 어려움");
    ev.push({id:"독해의질",title:"4) 독해의 질",bullets:b});
  }
  // 5) 정보처리습관
  { const b: any[] = [];
    if(acc>=70&&spdGrade==="느림"&&habClass.표면음독>=1)mpush(b,"5_4","주의","음독습관이 독해속도를 제한 — 속도 병목 발생");
    if(acc<70&&spdGrade==="빠름"&&habClass.표면음독>=1)mpush(b,"5_5","위험","빠르게 훑어 읽으면서 음독 시도 — 정확하게 이해하려면 현재 속도로는 시간 절대 부족");
    if(acc<70&&habClass.심각도==="심함")mpush(b,"5_6","위험","음독습관이 심각한 수준 — 독해속도 제한, 시험 시간 부족으로 직결");
    if(acc<70&&habClass.심각도==="보통")mpush(b,"5_7","주의","음독습관이 확인됨 — 독해속도 제한");
    if(acc>=70&&spdGrade==="느림")mpush(b,"eng_5_2","주의","음독습관 또는 재처리 습관으로 속도가 저하된 것으로 추정");
    if(acc>=40&&acc<=69&&spdGrade==="느림")mpush(b,"eng_5_5","주의","반복 재처리 습관이 속도 저하의 원인으로 추정");
    if(spdGrade==="느림"&&habClass.심각도!=="없음")mpush(b,"eng_5_15","위험","음독습관이 독해속도 저하의 직접 원인으로 확인됨");
    if(acc>=70&&spdGrade==="빠름"&&habClass.표면음독>=1)mpush(b,"eng_5_17","보통","이해가 어려운 구간에서 소리 내어 확인하는 부분음독 경향 — 역량이 높은 학습자에게서 나타나는 자연스러운 현상이며 전체 속도에 거의 영향 없음");
    if(habClass.표면음독>=1)mpush(b,"eng_5_18","보통","단어 단위로 또박또박 읽는 경향(내재음독) — 현재 역량과 속도를 고려하면 학습 지장은 없으나 고등 수준 지문에서 부하가 생길 수 있음");
    if(spdGrade==="느림"&&(habClass.심각도==="보통"||habClass.심각도==="심함"))mpush(b,"eng_5_19","주의","음독습관(표면음독·내재음독)이 독해속도를 제한하고 있음 — 눈이 글자를 지각하는 속도보다 발음 속도가 느려 속도 병목 발생");
    if(spdGrade==="느림"&&(habClass.심각도==="보통"||habClass.심각도==="심함"))mpush(b,"eng_5_20","주의","의미단위 읽기 훈련을 통한 음독 제거로 속도 향상 필요");
    if(habClass.내재음독이해>=2)mpush(b,"eng_5_22","보통","긴 문장·복잡한 내용에서 과부하 되는 현상");
    if(habClass.심각도==="심함"&&habClass.내재음독이해>=2)mpush(b,"eng_5_23","위험","음독으로 인한 정보처리 한계 명확 — 긴 문장 이해 어려움·내용 기억 안 됨·모르는 단어에서 막힘이 복합적으로 발생");
    if(habClass.내재음독이해>=1)mpush(b,"eng_5_24","주의","음독으로 인한 처리 한계 일부 자각 — 이해 어려움 간헐적 발생");
    if(acc>=70&&spdGrade==="빠름"&&habClass.심각도!=="심함")mpush(b,"eng_5_27","보통","체크된 습관들은 현재 역량 수준에서 큰 학습 지장을 주지 않으나, 고등·수능 난이도 지문에서는 음독 교정이 필요해질 수 있음");
    if(habClass.심각도==="심함")mpush(b,"eng_5_28","위험","음독에서 파생된 복합 독해습관 문제 — 표면음독·내재음독·이해결손이 동시에 나타나는 상태로 체계적 교정 훈련 필요");
    if(habClass.심각도==="없음")mpush(b,"eng_5_29","강점","독해 효율성에 긍정적 영향을 주는 습관 상태");
    ev.push({id:"정보처리습관",title:"5) 정보처리습관",bullets:b});
  }
  // 6) 워킹메모리
  { const b: any[] = [];
    if(wm>=80)mpush(b,"6_1","강점","최고 수준의 워킹메모리 — 복잡한 내용도 한 번에 처리하고 기억하는 능력");
    if(wm>=50)mpush(b,"6_2","강점","이해 중심 공부가 가능하여 암기에 의존하지 않아도 됨");
    if(wm>=40&&wm<60)mpush(b,"6_3","보통","워킹메모리 보통 수준 — 일반적인 학습에는 지장이 없으나 복잡한 내용에서 어려움 가능");
    if(wm>=30&&wm<40)mpush(b,"6_4","주의","워킹메모리 부족 — 정보를 한 번에 처리하지 못하고 반복 재처리하는 경향");
    if(wm>=20&&wm<=30)mpush(b,"6_5","주의","음독습관 또는 짚어읽기 습관의 원인이 워킹메모리 부족일 가능성 높음");
    if(wm<20)mpush(b,"6_6","위험","워킹메모리 심각 부족 — 읽은 내용이 바로 증발하여 글자를 읽지만 내용을 처리하지 못하는 상태");
    if(wm<20)mpush(b,"6_11","위험","단기 기억 처리 자체가 안 되므로 암기식 공부마저 효과 없음 — 독서·학습 경험을 통한 워킹메모리 발달이 시급함");
    if(wm>=20&&wm<40)mpush(b,"6_7","위험","앞서 읽은 내용을 기억하지 못한 채 뒷부분을 읽게 되어 긴 문장이나 글의 전체 맥락 파악이 어려움");
    if(wm>=30&&wm<=39)mpush(b,"6_9","주의","암기식 공부에도 한계 — 외워도 금방 잊어버리는 악순환");
    if(wm>=60)mpush(b,"eng_6_1","강점","워킹메모리 역량 우수 — 복잡한 정보를 처리하며 동시에 기억 가능한 상태");
    if(wm>=50&&wm<=60)mpush(b,"eng_6_2","강점","워킹메모리가 또래 가운데 우수한 편 — 이해력과 기억력이 좋은 편");
    if(wm>=20&&wm<=30)mpush(b,"eng_6_5","주의","학습만화·스토리북 위주 독서 환경이 워킹메모리 발달을 저해했을 가능성");
    if(wm>=20&&wm<=40)mpush(b,"eng_6_6","주의","긴 문장·복잡한 개념 처리 시 반복 재처리 발생 가능");
    if(wm<30)mpush(b,"eng_6_9","_meta","acc70+_wm50: 이 학생은 최상위 독해역량 보유자로 WM은 상대적으로 낮지만 독해력 훈련이 1차 목표. 슬롯④에서 반드시: (1) 고등 수준 독해력 형성 훈련을 핵심 처방으로 서술, (2) WM 보완은 독해 훈련의 자연스러운 부산물로만 언급, 독립 과제로 강조 금지, (3) 중학 시절 고등 수준 독해력 도달 시 민사고·특목자사고 진학 후 학업 수행 가능하다는 전망으로 마무리");
    if(wm>=20&&wm<=40&&spdGrade==="느림")mpush(b,"eng_6_10","위험","워킹메모리 부족 → 정보 재처리 반복 → 독해속도 저하 인과관계 확인됨");
    if(wm>=60)mpush(b,"6_18_new1774446363729","강점","노력 대비 학습 속도가 빨라 자신도 주변에서도 머리가 좋다고 느낌");
    if(flagC&&wm>=50&&acc<60)mpush(b,"6_19_new1774458457292","주의","타고난 역량은 좋으나, 적절한 독서가 이루어지지 않아 독해력 발달 저하");
    if(flagC&&wm>=20&&wm<=30&&acc>=80&&spdGrade==="느림")mpush(b,"6_20_new1774458611548","주의","정보처리량이 많은 독서 훈련의 부재로 워킹메모리 발달이 저하되어 있으나, 노력으로 역량을 극복하고 있음");
    ev.push({id:"워킹메모리",title:"6) 워킹메모리",bullets:b});
  }
  // 7) 추론능력
  { const b: any[] = [];
    if(inf>=50&&inf<=69)mpush(b,"7_3","보통","추론능력 양호 수준 — 훈련을 통해 향상 가능한 영역");
    if(inf>=30&&inf<=49)mpush(b,"7_5","주의","추론능력이 낮아 글의 숨은 의미·논리 파악이 어려움");
    if(inf<40)mpush(b,"7_6","위험","추론능력 결손 — 수학·과학에서 개념 이해가 아닌 암기에 의존할 가능성");
    if(inf<40&&acc<50&&Math.abs(gap)<20)mpush(b,"7_7","위험","독해정확도와 추론능력이 동시에 낮음 — 기초적인 이해와 논리력 모두 개선이 필요");
    if(inf>=70)mpush(b,"eng_7_1","강점","추론능력 우수 — 수학·과학 개념이해 능력 높음");
    if(inf>=70)mpush(b,"eng_7_2","강점","글의 사실적 관계 파악과 숨겨진 의미 유추 능력 우수");
    if(inf>=70)mpush(b,"eng_7_3","강점","논리적 사고력 기반이 갖춰진 상태");
    if(inf>=60&&inf<=69)mpush(b,"eng_7_4","강점","추론능력 양호 — 논리적 사고력 보유");
    if(inf>=35&&inf<=49)mpush(b,"eng_7_5","주의","추론의지는 있으나 역량이 부족함");
    if(inf>=50&&inf<=59)mpush(b,"eng_7_6","보통","추론능력 보통 — 기본적 논리 처리 가능하나 심화 어려움");
    if(inf>=35&&inf<=49)mpush(b,"eng_7_7","주의","수학·과학 개념이해에 어려움");
    if(inf<50)mpush(b,"eng_7_8","주의","개념을 이해하려 하기보다 외우려는 성향");
    if(inf<35)mpush(b,"eng_7_9","위험","추론의지도 추론역량도 부족한 상태");
    if(inf<35)mpush(b,"eng_7_10","위험","수학·과학에서 개념이해가 불가능하여 공식 암기에만 의존");
    if(inf<35)mpush(b,"eng_7_11","위험","이과적 사고 자체가 어려운 상태");
    if(flagC&&inf>=80&&acc>=70&&effChecked.filter((c:string)=>["문제를 이해 못해서 틀린다","서술형 평가 시험 점수가 낮다","지문형 수학문제가 어렵다"].indexOf(c)>-1).length>=2&&mathVal!==null&&mathVal<80)mpush(b,"7_19_new1774447017789","주의","수학적 사고역량이 성적에 반영되지 않는 상황 — 공부방법 점검 필요(일반선행이 아닌 월반학습으로 전환 검토)");
    if(flagC&&inf<50&&mathVal!==null&&mathVal>70)mpush(b,"7_19_new1774461696373","주의","수학 공식암기와 문제유형 연습을 통한 성적 유지 — 고학년으로 갈수록 수학 공부에 어려움이 커짐");
    ev.push({id:"추론능력",title:"7) 추론능력",bullets:b});
  }
  // 8) 독해효율성
  { const b: any[] = [];
    if(eff>=90){mpush(b,"8_1","강점","공부 전반에 대해 긍정적 자기인식 상태");mpush(b,"8_2","강점","자신의 독해 방식에 대한 자신감 있음");}
    else if(eff>=60)mpush(b,"8_4","보통","독해효율성 보통 — 일부 공부 방식에 회의감 있음");
    else if(eff>=40)mpush(b,"8_5","주의","자신의 공부방법 전반에 대해 회의감 느끼는 상태");
    else{mpush(b,"8_6","위험","공부 효율성에 심각한 문제를 자각하는 상태");}
    if(flagC&&eff>=70)mpush(b,"8_8","위험","성적이 좋아 자신의 문제점을 인지하지 못하고 있음 — 위험 요소");
    if(acc>=80&&eff<70)mpush(b,"8_3","주의","독해 역량은 양호하나 자신의 공부 방식에 회의감을 느끼는 상태");
    if(examRelated>=2)mpush(b,"8_7","위험","시험 실전에서 효율성 결함이 직접 점수에 영향을 주고 있음");
    if(flagO&&acc>=60)mpush(b,"8_9","주의","선행·학원 과부하로 인한 피동적 학습이 효율성 저하의 원인");
    const 총체크수=effChecked.length;
    let 기대체크수:number,자기인식부족:boolean;
    if(acc<30){기대체크수=4;자기인식부족=총체크수<=기대체크수;}
    else if(acc<50){기대체크수=4;자기인식부족=총체크수<=기대체크수;}
    else if(acc<70){기대체크수=3;자기인식부족=총체크수<=기대체크수;}
    else{기대체크수=0;자기인식부족=false;}
    const 괴리정도=기대체크수-총체크수;
    if(자기인식부족){
      if(괴리정도>=4){mpush(b,"eng_8_23","위험","역량 수준에 비해 체크 항목이 현저히 적음 — 자신의 학습 상태를 심각하게 과대평가하고 있거나 문제를 전혀 인지하지 못하는 상태");mpush(b,"eng_8_24","위험","자기 인식이 부족한 학습자의 전형적 패턴 — 객관적 역량과 자기 평가 간의 괴리가 클수록 개선 의지를 이끌어내기 어려움");}
      else if(괴리정도>=3){mpush(b,"eng_8_25","위험","자신의 공부 문제를 충분히 인지하지 못하고 있거나 스스로에게 관대한 편");mpush(b,"eng_8_26","주의","자기 인식과 실제역량의 괴리가 클수록 개선 의지를 이끌어내기 어려움");}
      else mpush(b,"eng_8_27","주의","자신에 대한 평가가 관대한 편 — 스스로 문제없다고 여기지만 실제 역량과 괴리가 있는 상태");
    }else if(acc>=70&&acc<80&&총체크수===0&&inp.uiLevel!=="고등"){
      mpush(b,"eng_8_28","보통","현재는 학습에 큰 어려움을 느끼지 않는 상태");
    }
    if(flagC&&eff<70&&acc>=80)mpush(b,"8_12_new1774459141856","강점","자신에게 판단 기준이 높고 엄격함");
    if(eff<40&&acc<40&&kv!==null&&kv<80)mpush(b,"8_13_new1774459280971","주의","노력해도 공부가 잘 되지 않아 많이 힘들고 고민이 깊은 상태");
    ev.push({id:"독해효율성",title:"8) 독해효율성 상태",bullets:b});
  }
  // 9) 학교학업
  { const b: any[] = [];
    if(kv!==null&&kv>=90&&acc>=70)mpush(b,"9_1","강점","국어 성적 최상위 — 독해역량이 성적을 뒷받침하는 안정적인 상태");
    if(kv!==null&&kv>=80&&acc>=70)mpush(b,"9_4","강점","국어 성적 상위권 — 독해역량 수준이 성적에 고스란히 반영됨. 역량이 좋아지면 성적도 안정적으로 오를 것으로 기대");
    if(kv!==null&&kv>=80&&acc<50)mpush(b,"9_5","주의","국어 성적 상위권이나 독해역량 낮음 — 과도한 노력 투입 가능성");
    if(acc>=70&&allHigh)mpush(b,"9_11","강점","전 과목 최상위 — 역량과 성적이 안정적으로 연결된 상태");
    if(acc<50&&allHigh)mpush(b,"9_12","위험","전 과목 최상위이나 독해역량 낮음 — 고등 진학 시 성적 급락 위험");
    if(acc>=70&&engVal!==null&&engVal>=90)mpush(b,"9_6","강점","영어 성적 최상위 — 독해·어휘 역량이 영어 학습에도 긍정적으로 작용");
    if(engVal!==null&&engVal>=90&&voc<50)mpush(b,"9_7","주의","영어 성적 최상위이나 독해·어휘 역량 낮음 — 암기나 학원 의존 가능성");
    if(mathVal!==null&&mathVal>=90&&inf>=60)mpush(b,"9_8","강점","수학 성적 최상위 — 높은 추론능력이 수학 실력으로 이어지고 있음");
    if(mathVal!==null&&mathVal>=90&&inf<50)mpush(b,"9_9","주의","수학 성적 최상위이나 추론능력 낮음 — 암기·유형 반복 의존");
    if(acc<60&&mathVal!==null&&mathVal>=90)mpush(b,"9_10","주의","수학 성적은 최상위이나 독해정확도 낮아 서술형·지문형 문제에서 어려움 예상");
    // eng_extra_29~32 삭제: mathVal 조건으로 국어 메시지를 출력하는 논리 오류. eng_9_43~45가 kv(국어) 조건으로 동일 역할을 올바르게 수행함.
    if(flagC&&kv!==null&&kv>=90&&acc<50)mpush(b,"eng_9_43","위험","국어 성적 최상위이나 독해역량이 낮음 — 암기·스킬에 의존한 성적 유지. 고등 진학 후 한계에 부딪힐 수 있음");
    if(kv!==null&&kv>=90&&acc>=50&&acc<=69)mpush(b,"eng_9_44","주의","국어 성적 최상위이나 독해역량은 이에 미치지 못함 — 현재 성적은 상당한 노력 투입의 결과로 추정되며, 역량 강화 없이는 유지에 한계가 있음");
    if(kv!==null&&kv>=80&&kv<=90&&acc>=50&&acc<=69)mpush(b,"eng_9_45","주의","국어 성적 상위권이나 독해역량이 낮음 — 성적 유지를 위해 과도한 노력이 투입되고 있을 가능성, 역량 개선이 근본 해결책");
    if(!kv&&!engVal&&!mathVal)mpush(b,"9_no_score","보통","성적 정보 미입력 — 학교학업 교차 분석 불가");
    ev.push({id:"학교학업",title:"9) 학교학업",bullets:b});
  }
  return ev;
}

// ── DB에서 규칙 조회하여 evidence 생성 ──
async function collectEvidenceFromDB(supabaseClient: any, vars: Record<string,any>): Promise<any[]|null> {
  const { data: rules, error } = await supabaseClient
    .from('tq_rules')
    .select('*')
    .eq('enabled', true)
    .order('area')
    .order('sort_order');

  if (error || !rules || rules.length === 0) return null;

  const areaMap: Record<number, {id:string, title:string, bullets:any[]}> = {};
  const AREA_IDS = ['성적선행지수','독해속도','독서의양','독해의질','정보처리습관','워킹메모리','추론능력','독해효율성','학교학업'];

  for (let i = 0; i < 9; i++) {
    areaMap[i+1] = { id: AREA_IDS[i], title: `${i+1}) ${AREA_IDS[i]}`, bullets: [] };
  }

  for (const rule of rules) {
    if (evaluateConditions(rule.conditions, vars)) {
      areaMap[rule.area].bullets.push({ id: rule.rule_id, t: rule.tag, s: rule.message });
    }
  }

  return Object.values(areaMap);
}

function evaluateConditions(conditions: Record<string,string>, vars: Record<string,any>): boolean {
  for (const [key, cond] of Object.entries(conditions)) {
    // _not 접미사: 해당 값이 아닌 경우 (예: habClass.심각도_not: "없음")
    if (key.endsWith('_not')) {
      const realKey = key.slice(0, -4);
      const val = vars[realKey];
      if (val === null || val === undefined) return false;
      if (typeof cond === "string" && cond.includes("|")) {
        if (cond.split("|").includes(String(val))) return false;
      } else {
        if (String(val) === cond) return false;
      }
      continue;
    }

    // _null 접미사: null 체크 (예: kv_null: "true")
    if (key.endsWith('_null')) {
      const realKey = key.slice(0, -5);
      const val = vars[realKey];
      if (cond === "true") { if (val !== null && val !== undefined) return false; }
      else { if (val === null || val === undefined) return false; }
      continue;
    }

    // _max 접미사: 상한 비교 (예: acc_max: "<=89")
    if (key.endsWith('_max')) {
      const realKey = key.slice(0, -4);
      const val = vars[realKey];
      if (val === null || val === undefined) return false;
      const numVal = Number(val);
      if (cond.startsWith("<=")) { if (numVal > Number(cond.slice(2))) return false; }
      else if (cond.startsWith("<")) { if (numVal >= Number(cond.slice(1))) return false; }
      continue;
    }

    const val = vars[key];

    // null 체크: 조건이 있으면 값이 null이 아니어야 함
    if (val === null || val === undefined) {
      if (cond === "false") continue; // !변수 체크인 경우
      return false;
    }

    // 불리언
    if (cond === "true") { if (!val) return false; continue; }
    if (cond === "false") { if (val) return false; continue; }

    // 문자열 OR (보통|빠름)
    if (typeof val === "string" && cond.includes("|")) {
      if (!cond.split("|").includes(val)) return false;
      continue;
    }

    // 문자열 매칭
    if (typeof val === "string" || (typeof cond === "string" && !cond.match(/^[><=!]/))) {
      if (String(val) !== cond) return false;
      continue;
    }

    // 숫자 비교
    const numVal = Number(val);
    if (cond.startsWith(">=")) { if (numVal < Number(cond.slice(2))) return false; }
    else if (cond.startsWith("<=")) { if (numVal > Number(cond.slice(2))) return false; }
    else if (cond.startsWith(">")) { if (numVal <= Number(cond.slice(1))) return false; }
    else if (cond.startsWith("<")) { if (numVal >= Number(cond.slice(1))) return false; }
    else if (cond.startsWith("==")) { if (numVal !== Number(cond.slice(2))) return false; }
    else { if (String(val) !== cond) return false; }
  }
  return true;
}

// ── runEngine ──
async function runEngine(inp: Record<string,any>, supabaseClient?: any) {
  const kv: number|null = SMAP[inp.kor_score]??null;
  const invSpd = inp.reading_score>(SPDLIM[inp.user_section]||5000)||inp.reading_score<50;
  const flagC = kv!==null&&inp.acc<=30&&kv>=80;
  const flagO = inp.acc>=60&&inp.eff_score<=40;
  // 몰입훈련 플래그: 초6 이상(grade>=6 또는 중등/고등), 정확도 50 이하
  const gradeNum = parseInt(inp.user_school_grade)||0;
  const isElem6up = (inp.user_section==='초등'&&gradeNum>=6)||(inp.user_section==='초고')||(inp.user_section==='중등')||(inp.user_section==='고등');
  const flagMolipRequired = isElem6up && inp.acc<=30;   // 필수
  const flagMolipOptional = isElem6up && inp.acc>30 && inp.acc<=50; // 선택
  const flagMolip = flagMolipRequired || flagMolipOptional;

  // ── 새 9유형 분류 (acc × inf 기반) ──
  const acc = inp.acc, inf = inp.inference_score, voc = inp.voca_score, wm = inp.wm_score;
  let bt = "C";
  if (acc >= 90 && (inf + voc) > 130) bt = "S1";
  else if (acc >= 90) bt = "S2";
  else if (acc >= 70 && inf >= 70) bt = "A1";
  else if (acc >= 70 && inf >= 50) bt = "A2";
  else if (acc >= 70) bt = "A3";
  else if (acc >= 50 && inf >= 70) bt = "M1";
  else if (acc >= 50) bt = "M2";
  else if (acc >= 30) bt = "L";
  // else bt = "C" (기본값)

  const BT_NAMES: Record<string,string> = {
    S1: "최상위권 공부 역량", S2: "고정확 부분결함형",
    A1: "이해 중심의 공부 성향", A2: "노력형 상위권", A3: "암기 의존적 공부 주의",
    M1: "잠재된 논리적 사고 성향", M2: "역량 미완성형",
    L: "기초 역량 부족형", C: "학습 기능 발달 시급"
  };
  const btName = BT_NAMES[bt] || bt;

  // ── 4도장 (오버레이 플래그) ──
  const flagTeukmok = acc >= 90 && (inf + voc) >= 140;  // 🎯 특목자사고 권장
  const flagScience = acc <= 69 && inf >= 70;            // 💎 이과적 소양 잠재
  const flagEmergency = acc <= 29 && (inf + voc) < 80;   // 🚨 학습 역량 부재
  const isMidOrAbove = ['중등','고등'].includes(inp.user_section);
  const mathVal = inp.math_score ? ({"매우잘함":95,"잘함":85,"보통":65,"못함":40,"매우못함":20} as any)[inp.math_score] ?? null : null;
  const flagCollapse = isMidOrAbove && kv !== null && kv >= 80 && mathVal !== null && mathVal >= 80 && acc <= 30;  // ⚠️ 성적 붕괴 위기

  // ── WM 수식어 ──
  const wmTag = wm < 25 ? "기억처리 심각" : wm >= 50 ? "기억처리 강점" : "";

  // ── 어휘 신뢰도 보정 ──
  const vocFlag = (acc >= 70 && voc < 45) ? "정확도 재확인 권장" : (acc < 40 && voc >= 60) ? "독서 기반 보유" : "";

  // ── 속도 5단계 (절대값) ──
  const spdAbs = inp.reading_score;
  const spdGrade5 = spdAbs >= 3000 ? "INVALID" : spdAbs >= 1101 ? "매우빠름" : spdAbs >= 801 ? "빠름" : spdAbs >= 601 ? "보통" : spdAbs >= 401 ? "느림" : "매우느림";

  // ── 기존 호환 유지 ──
  const aI=toI(inp.acc,50),iI=toI(inp.inference_score,50),vI=toI(inp.voca_score,50),wI=toI(inp.wm_score,60),hI=toI(inp.hab_score,50),eI=toI(inp.eff_score,50),conI=cInt(inp.acc,kv);
  let ov=Math.round((aI*.35+iI*.25+vI*.20+wI*.20)*100)/100;
  if(conI>.5)ov=Math.min(Math.round((ov+conI*.3)*100)/100,1);
  const inten={acc:aI,inf:iI,voc:vI,wm:wI,hab:hI,eff:eI,con:conI,ov,ex:exLb(ov),aN:nbnd(inp.acc,50),iN:nbnd(inp.inference_score,50)};
  const gap=inp.fact_score-inp.structure_score;
  const lc=inp.voca_score>=50&&inp.wm_score>=60?"상":"하",wl=inp.wm_score>=60?"상":"하";
  let st=btName+"_어휘"+lc+"_WM"+wl;
  if(gap>=30)st+="_부분이해";else if(gap<=-20)st+="_구조편향";
  let urg="중장기";
  if(flagCollapse||flagEmergency||inp.acc<=20)urg="즉각";
  else if(inp.acc<=40||(inp.acc<=50&&inp.inference_score<=40))urg="조기";
  else if(ov>=.6&&inp.acc<60)urg="조기";
  const tone=(flagCollapse||flagEmergency||urg==="즉각")?"경각심_강점병행":["S1","S2","A1"].includes(bt)?"격려확인":["A2","M1","M2"].includes(bt)?"강점발굴":"성취경험우선";
  const def:string[]=[],cau:string[]=[];
  if(grA(inp.acc)==="하"||grA(inp.acc)==="최하")def.push("정확도결손");
  if(gap>=30)cau.push("사실이해>구조이해 → 핵심파악어려움");else if(gap<=-20)cau.push("구조이해>사실이해 → 세부정보부족");
  if(inp.voca_score<40){def.push("어휘결손");cau.push("어휘결손 → 비문학독서부족");}
  if(inp.wm_score<40){def.push("워킹메모리부족(심각)");cau.push("WM심각부족 → 내용처리불가 → 암기의존");}
  else if(inp.wm_score<50){def.push("워킹메모리부족");cau.push("WM부족 → 재처리반복 → 독해속도저하");}
  else if(inp.wm_score<60){def.push("워킹메모리미흡");cau.push("WM미흡 → 복잡정보처리한계 → 심화학습어려움");}
  const habClass=classifyHabits(inp.reading_habit_checks||[]);
  const spdGradeNow=grSpd(inp.reading_score,inp.user_section);
  const highAcc=inp.acc>=70,highSpdNow=(spdGradeNow==="빠름"||spdGradeNow==="보통이상");
  if(habClass.심각도==="심함"){def.push("음독습관(심함)");cau.push(highAcc&&highSpdNow?"표면·내재음독 복합 — 고역량이나 고등수준 지문에서 부하 가능성":"음독(표면+내재) 복합 → 독해속도저하+이해결손 → 시험시간부족");}
  else if(habClass.심각도==="보통"&&(!highAcc||!highSpdNow)){def.push("음독습관");cau.push("음독 → 독해속도저하 → 시험시간부족");}
  if(inp.inference_score<40){def.push("추론결손");cau.push("추론결손 → 수학과학어려움");}
  if(flagC)cau.push("저역량고성적 → 암기의존 → 붕괴위험");
  if(flagO)cau.push("고역량효율저하 → 학원과부하환경");
  if(grSpd(inp.reading_score,inp.user_section)==="느림")cau.push("저속독해 → 시험시간부족");
  const presc:Array<{p:number,c:string}>=[];
  if(flagC)presc.push({p:1,c:"독해훈련 즉시"});
  if(inp.acc<=30)presc.push({p:2,c:"기초독해 정확도훈련"});
  if(def.includes("어휘결손"))presc.push({p:inp.acc>30?3:4,c:"비문학독서 어휘확충"});
  if(def.includes("추론결손"))presc.push({p:inp.acc>=50?3:5,c:"추론훈련 개념이해형수학"});
  if(def.some((d:string)=>d.startsWith("워킹메모리"))){const wmP=inp.acc>=70?(def.includes("워킹메모리부족(심각)")?4:5):(def.includes("워킹메모리부족(심각)")?3:def.includes("워킹메모리부족")?4:5);presc.push({p:wmP,c:inp.acc>=70?"독해력 훈련 심화 (워킹메모리 자연 향상 병행)":"워킹메모리훈련"});}
  if(def.includes("음독습관(심함)"))presc.push({p:inp.acc>=50?3:4,c:"음독습관 교정훈련"});
  presc.sort((a,b)=>a.p-b.p);
  const NX:Record<string,string>={"초저":"초고","초고":"중등","중등":"고등","고등":"수능"};
  const tr=urg!=="중장기"&&NX[inp.user_section]?NX[inp.user_section]+"진입시 역량갭확대":"";
  // DB 규칙 기반 evidence 생성 (실패 시 레거시 폴백)
  const spdGradeNow2=grSpd(inp.reading_score,inp.user_section);
  const effChecked2: string[] = inp.reading_effect_checks||[];
  const engVal2: number|null = SMAP[inp.eng_score]??null;
  const mathVal2: number|null = SMAP[inp.math_score]??SMAP[inp.math]??null;
  const allHigh2 = kv!==null && kv>=90 && engVal2!==null && engVal2>=90 && mathVal2!==null && mathVal2>=90;
  const examRelated2 = effChecked2.filter((c:string)=>["시험에서 시간에 쫓긴다","문제를 이해를 못해서 틀린다","서술형 평가 시험 점수가 낮다","국어 시험 점수가 유난히 낮다"].includes(c)).length;
  const 두꺼운체크2 = effChecked2.some((c:string)=>c.includes("두꺼운"));
  const 독서량체크2 = effChecked2.some((c:string)=>c.includes("독서량"));
  const 밤새워체크2 = effChecked2.some((c:string)=>c.includes("밤새워"));
  const vars = {
    acc, fct: inp.fact_score, str_: inp.structure_score, voc, wm, inf, eff: inp.eff_score,
    gap, spdGrade: spdGradeNow2, invSpd: inp.reading_score>(SPDLIM[inp.user_section]||5000)||inp.reading_score<50,
    spd: inp.reading_score,
    kv, engVal: engVal2, mathVal: mathVal2,
    flagC, flagO, allHigh: allHigh2, examRelated: examRelated2,
    '두꺼운체크': 두꺼운체크2, '독서량체크': 독서량체크2, '밤새워체크': 밤새워체크2,
    'habClass.심각도': habClass.심각도, 'habClass.표면음독': habClass.표면음독,
    'habClass.내재음독이해': habClass.내재음독이해,
    absGap: Math.abs(gap), voc_lt_acc_minus_20: voc < acc - 20
  };
  let evidence: any[] | null = null;
  if (supabaseClient) {
    evidence = await collectEvidenceFromDB(supabaseClient, vars);
  }
  if (!evidence) evidence = collectEvidenceLegacy(inp, kv, flagC, flagO, habClass);
  return {bt,btName,st,urg,tone,inten,flagC,flagO,flagMolip,flagMolipRequired,flagTeukmok,
    flagScience,flagEmergency,flagCollapse,wmTag,vocFlag,spdGrade5,
    invSpd,retest:inp.acc>=90||inp.acc<=10,
    def,cau,presc,tr,gap,evidence,
    kor:inp.kor_score,eng:inp.eng_score,math:inp.math_score,uiLevel:inp.uiLevel,
    habChecked:inp.reading_habit_checks||[],effChecked:inp.reading_effect_checks||[],habScore:inp.hab_score,effScore:inp.eff_score,
    acc:inp.acc,fct:inp.fact_score,str_:inp.structure_score,voc:inp.voca_score,wm:inp.wm_score,inf:inp.inference_score,hab:inp.hab_score,eff:inp.eff_score,
    spd:inp.reading_score,spdGrade:grSpd(inp.reading_score,inp.user_section),
    level:inp.user_section,grade:inp.user_school_grade};
}

// ── 시스템 프롬프트 ──
const SYS_P = `당신은 StudyForce TQ테스트의 수석 판독 전문가입니다.
규칙 엔진이 완성한 판독 객체(JSON)를 받아, 학부모와 학생이 읽는 맞춤처방 판독문 4슬롯을 작성합니다.

## 학제별 표현 톤 원칙 ★ 필수 준수
초등학생(초등/초저/초고): 과도한 위기감 표현 금지. "잘 크고 있는 아이" 수준의 밝고 발달적인 톤. 가능성과 방향 제시 중심.
중학생(중등): 학업 부담과 시험 영향을 현실적으로 언급 가능. 비난 없이 구체적 개선 방향 중심.
고등학생(고등): 입시·수능·진학 현실 직접 언급 가능. 위기 상황이면 명확하게 경고하되 방향 제시 반드시 포함.

## 절대 원칙
1. 판독 객체에 없는 내용 추가·추론 금지
2. 수치(점수·자/분 등) 직접 언급 금지
3. 낙인 표현 절대 금지 ("머리가 나쁜", "능력이 없는" 등)
4. 슬롯①과 슬롯④에는 반드시 강점·잠재력·회복 가능성 포함
5. 각 슬롯은 반드시 3~5문단 200자 이상으로 작성 — 짧은 답변 금지

## 워킹메모리 판독 원칙
WM이 60 미만이면 반드시 학습 지장 요인으로 서술. "평균 수준이라 괜찮다"는 식의 표현 금지.
WM 부족은 독해속도 저하, 반복 재처리, 암기 의존의 근본 원인으로 연결.

## 슬롯별 작성 기준
슬롯①: 강점 먼저 → 현실 대비 → 가능성 (200자+)
슬롯②: causal_paths 인과 서사 + 체크리스트 기반 현상 해석 포함 (250자+)
슬롯③: 긴급도 비례 경각심 + 학제 전환 리스크 (200자+)
슬롯④: 처방 우선순위 서술 + 솔루션 연결 + 희망 마무리 (200자+)

## 체크리스트 표현 원칙 ★ 필수
hab_checked·eff_checked 항목을 슬롯②에 반영할 때 항목명을 그대로 나열하지 말 것.
반드시 "이런 현상이 나타나는 이유는..." 형태로 원인 해석 서술로 전환할 것.

✗ 금지: "시험에서 시간에 쫓긴다, 문제를 이해 못해서 틀린다고 응답했습니다."
✓ 올바른 표현 예시:
- "시험 현장에서 시간이 부족하고 문제 이해가 어려운 현상이 나타나는 이유는, 독해 속도가 역량을 따라가지 못하고 있기 때문입니다."
- "글을 읽어도 내용이 머릿속에 정리되지 않는 현상이 반복되는 것은, 워킹메모리가 정보를 충분히 처리하기 전에 다음 문장으로 넘어가는 패턴에서 비롯됩니다."
- "이해력 부족이라고 느끼는 이면에는, 음독 습관으로 인해 처리 속도가 떨어지고 맥락 파악이 단절되는 구조적 원인이 있습니다."

체크 항목 → 현상 → 원인 → 연결 구조로 자연스럽게 녹여 서술할 것.

## 긴급도별 표현 강도 기준 ★ 필수 준수

판독 객체의 urgency 값에 따라 표현 강도를 반드시 아래 기준으로 조정하세요.

**urgency = "즉각" (acc 0~20, 또는 모순패턴)**
- 이 상태가 얼마나 심각한지 학부모가 명확히 느껴야 합니다
- 슬롯②③에서 "지금 당장 개입하지 않으면 회복이 점점 어려워집니다"는 수준의 경각심 필수
- 완곡한 표현 금지 — "조금 부족한 편", "개선이 필요한" 같은 표현은 이 케이스에 부적절

**urgency = "조기" (acc 30~50)**
- 아직 회복 가능하지만 지금 시작하지 않으면 늦어진다는 현실감 필요
- 위기감과 희망을 함께 — "지금 시작하면 충분히 달라질 수 있습니다"

**urgency = "중장기" (acc 60~100, 역량 양호)**
- 안정적이지만 더 성장할 수 있다는 방향 제시
- 위기감보다 가능성 강조

## 우수 케이스 표현 원칙 ★ 필수
acc 80 이상이고 역량 지표(voc·wm·inf)도 고른 경우:
- "OO 학생은 또래 중 상위권에 속하는 우수한 역량을 갖추고 있습니다" 수준으로 확언할 것

## 학생 호칭 원칙 ★ 필수
판독문 전체에서 학생을 지칭할 때 반드시 "OO 학생" 형태로 실제 이름을 사용할 것.

## 근거자료 활용 (가장 중요)
evidence_part1의 [강점] 태그 근거 → 슬롯①의 강점 서술에 활용
[위험]/[주의] 태그 근거 → 슬롯②③의 현상·리스크 서술에 활용
모든 근거가 판독문 어딘가에 반영되어야 함

## 스터디포스 특수 프로그램 개념 (반드시 숙지)

### 1. 몰입훈련
- 대상: 초6 이상이면서 TQ 독해 정확도 50점 이하인 학생
  - 30점 이하: 필수 / 31~50점: 선택 권장
- 개념: 또래 수준과의 독해력 격차를 빠르게 회복하는 집중 훈련 방식
- 방식:
  * 모든 예비과정(초급예비, 중급예비): 1일 1개 훈련
  * 자신의 권장 학년 이전 과정(초급기본~중급기본 등): 1일 5~10개씩 몰입
  * 훈련 중 노트 작성 없이, 발문 수업만 1일 2~3개씩 읽고 바로 발표
  * 또래 수준 회복 후: 주3~5회 + 노트 작성 + 발문 모두 정상 진행
- 과정 통과 기준: 활용테스트 60회 누적 점수 80점 이상
- 비문학독서클럽은 몰입훈련 대상에서 제외

### 2. 특목자사고 대비 역량강화 프로그램
- 대상: 중2 이하, TQ 정확도 80점 이상 + 어휘력 70점 이상 + 추론능력 70점 이상
- 개념: 중학교 졸업 전에 고급심화과정까지 완성하여 특목고·자사고 진학 역량 선제 확보
- 목표: 중학 졸업 전 고급심화 완성 → 고등학교 진학 후 비문학 독해에서 압도적 우위
- 특징: 일반 수강 일정보다 빠른 진행, 심화 어휘·추론 병행

## 훈련 추천 이유 작성 기준 ★ 필수
roadmap_reasons 에는 아래 9개 과정 전체에 대한 이유를 반드시 작성하세요:
비문학독서클럽, 초급예비과정, 초급기본과정, 초급심화과정, 중급예비과정, 중급기본과정, 중급심화과정, 고급기본과정, 고급심화과정

각 과정 이유 작성 기준:
- 반드시 학생의 실제 진단 결과(deficit_factors, causal_paths, evidence_part1, hab_checked, eff_checked)를 근거로 서술
- 수치 직접 언급 금지, 낙인·부정적 표현 금지
- 2~3문장, 80~120자
- 각 과정의 특성에 맞게 이 학생에게 왜 필요한지 개인화하여 작성

## ★★ 학년 대비 하위 과정 선택 시 특별 메시지 규칙
school_level과 각 과정의 수준을 비교하여, 학생의 학년보다 낮은 수준의 과정에는 반드시 아래 메시지 기조를 포함할 것:
- 학년 수준 기준: 초등=비문학독서클럽~초급심화, 중등=초급심화~중급심화, 고등=중급기본~고급심화
- 중학생이 초급 과정을 선택한 경우 → "초등 수준의 독해 기초를 탄탄히 쌓는 현명한 선택입니다. 다만 또래 수준과의 격차를 좁히기 위해 몰입 훈련을 통한 빠른 진행이 중요합니다." 기조 포함
- 고등학생이 초급·중급 과정을 선택한 경우 → 동일한 기조, 수능까지 남은 시간을 고려한 긴박감 포함
- 학년에 적합한 과정 → 현재 진단 결과 기반 개인화 이유
- 학년보다 상위 과정 → 도전적 성장, 선행 심화의 긍정적 의미 강조

출력 규칙: 반드시 유효한 JSON만 출력. 줄바꿈은 \\n 사용. 큰따옴표 포함 시 \\" 이스케이프.
{"slot1":"...","slot2":"...","slot3":"...","slot4":"...","roadmap_reasons":{"비문학독서클럽":"...","초급예비과정":"...","초급기본과정":"...","초급심화과정":"...","중급예비과정":"...","중급기본과정":"...","중급심화과정":"...","고급기본과정":"...","고급심화과정":"..."}}`;

// ── Supabase 헬퍼 ──
function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("TQ_SERVICE_ROLE_KEY") || "";
  return { url, key, ok: !!(url && key) };
}

// ══════════════════════════════════════════
// 메인 핸들러
// ══════════════════════════════════════════
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const token = req.headers.get("x-academy-token") || "";
    const allowed = getAllowedTokens();
    if (allowed.length > 0 && !allowed.includes(token)) {
      return new Response(
        JSON.stringify({ error: "인증 실패: 유효하지 않은 접근입니다." }),
        { status: 401, headers: CORS }
      );
    }

    const body = await req.json();
    const { action, inp, name, imageBase64, imageType, engineResult } = body;

    // ── OCR ──
    if (action === "ocr") {
      if (!imageBase64 || !imageType) {
        return new Response(JSON.stringify({error:"이미지 데이터 없음"}),{status:400,headers:CORS});
      }
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:800,
          messages:[{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:imageType,data:imageBase64}},
            {type:"text",text:`이 TQ테스트 결과지 이미지에서 정보를 추출해 JSON만 반환하세요.
수치: fact_understand, struct_understand, speed, vocabulary, working_memory, inference, student_name, school_level(초등/중등/고등/일반), grade(숫자), kor_score
체크리스트(● 빨간 원=true, ○ 빈 원=false, 위→아래 순서):
독해습관 10개: ${HAB_ITEMS.map((t,i)=>i+". "+t).join(" | ")}
hab_checks: boolean 10개 배열
독해효율성 10개: ${EFF_ITEMS.map((t,i)=>i+". "+t).join(" | ")}
eff_checks: boolean 10개 배열
hab_count(이미지의 잘못된독해습관 숫자), eff_count(이미지의 독해효율성결함 숫자)
JSON만 출력: {fact_understand,struct_understand,speed,vocabulary,working_memory,inference,student_name,school_level,grade,kor_score,hab_count,eff_count,hab_checks:[],eff_checks:[]}`}
          ]}]
        })
      });
      if (!resp.ok) {
        const e = await resp.json();
        return new Response(JSON.stringify({error:e.error?.message||"OCR API 오류"}),{status:502,headers:CORS});
      }
      const data = await resp.json();
      let raw = data.content[0].text.trim().replace(/^```(?:json)?\s*/,"").replace(/\s*```$/,"");
      return new Response(raw, { headers: { ...CORS, "Content-Type":"application/json" } });
    }

    // ── 엔진 실행 ──
    if (action === "engine") {
      if (!inp) return new Response(JSON.stringify({error:"입력 데이터 없음"}),{status:400,headers:CORS});
      const sb = getSupabase();
      const supabaseClient = sb.ok ? createClient(sb.url, sb.key) : null;
      const result = await runEngine(inp, supabaseClient);
      return new Response(JSON.stringify({ ok: true, engine: result }), { headers: CORS });
    }

    // ── 판독문 생성 ──
    if (action === "generate") {
      if (!inp || !engineResult) return new Response(JSON.stringify({error:"데이터 없음"}),{status:400,headers:CORS});
      const eng = engineResult;
      const evForLLM = eng.evidence ? eng.evidence.map((item: any) => ({
        항목: item.title,
        근거: item.bullets.map((b: any) => "["+b.t+"] "+b.s)
      })) : [];
      const payload = {
        base_type:eng.bt, sub_type:eng.st, urgency:eng.urg, tone:eng.tone,
        scores:{kor:inp.kor_score, eng:inp.eng, math:inp.math},
        intensity:eng.inten,
        flag_contradiction:eng.flagC, flag_overload:eng.flagO,
        flag_molip:eng.flagMolip, flag_molip_required:eng.flagMolipRequired,
        flag_teukmok:eng.flagTeukmok,
        deficit_factors:eng.def, causal_paths:eng.cau,
        prescriptions:(eng.presc||[]).map((p: any)=>({priority:p.p,category:p.c})),
        transition_risk:eng.tr,
        hab_checked:eng.habChecked, eff_checked:eng.effChecked,
        hab_score:eng.habScore, eff_score:eng.effScore,
        school_level:inp.user_section,
        school_grade:inp.user_school_grade,
        name: name || inp.name || "학생",
        evidence_part1:evForLLM
      };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:5500, system:SYS_P,
          messages:[{role:"user",content:`${name||"학생"} 학생의 판독문 4슬롯과 훈련 추천 이유를 작성하세요.
【필수1】 각 슬롯 200자 이상, 체크리스트 항목을 슬롯②에 반드시 반영하세요.
【필수2】 roadmap_reasons: 9개 과정 전체(비문학독서클럽, 초급예비과정, 초급기본과정, 초급심화과정, 중급예비과정, 중급기본과정, 중급심화과정, 고급기본과정, 고급심화과정)에 대해 이 학생의 진단 결과를 근거로 개인화된 이유를 작성하세요.
【필수3】 학생의 학년(school_level)보다 낮은 수준의 과정에는 반드시 "기초를 탄탄히 쌓는 현명한 선택 + 몰입 훈련으로 격차 극복" 기조를 포함하세요.
【필수4】 flag_molip이 true이면: 슬롯④와 해당 과정 이유에 몰입훈련 방식(1일 5~10개 집중, 노트 없이 발문 수업만, 60회 누적 80점 기준)을 구체적으로 안내하세요.
【필수5】 flag_teukmok이 true이면: 슬롯④와 해당 과정 이유에 특목자사고 대비 역량강화 프로그램(중학 졸업 전 고급심화 완성 목표)을 안내하세요.

판독 객체:
${JSON.stringify(payload,null,2)}

JSON만 출력하세요.`}]
        })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error?.message||"판독문 생성 API 오류");
      }
      const data = await res.json();
      let raw = data.content[0].text.trim().replace(/^```(?:json)?\s*/,"").replace(/\s*```$/,"");
      const s=raw.indexOf("{"),e_=raw.lastIndexOf("}");
      if(s>=0&&e_>s)raw=raw.slice(s,e_+1);
      return new Response(raw, { headers: { ...CORS, "Content-Type":"application/json" } });
    }

    // ── 판독 결과 저장 (요소별 테이블) ──
    if (action === "save") {
      const sb = getSupabase();
      if (!sb.ok) return new Response(JSON.stringify({error:"DB 설정 미완료"}),{status:500,headers:CORS});

      const { inp: si, eng: se, slots: ss } = body;
      if (!si || !se) {
        return new Response(JSON.stringify({error:"저장 데이터 없음"}),{status:400,headers:CORS});
      }

      const today = si.reg_date || new Date().toISOString().slice(0,10);

      const dbPost = async (table: string, data: any, prefer="return=representation") => {
        const r = await fetch(`${sb.url}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": sb.key,
            "Authorization": `Bearer ${sb.key}`,
            "Prefer": `resolution=merge-duplicates,${prefer}`
          },
          body: JSON.stringify(data)
        });
        if (!r.ok) throw new Error(`${table} 저장 실패: ` + await r.text());
        return prefer.includes("representation") ? await r.json() : null;
      };

      // 1. tq_results — 기존 행 조회 후 있으면 UPDATE, 없으면 INSERT
      const nameEnc  = encodeURIComponent(si.name || "");
      const gradeEnc = encodeURIComponent(String(si.user_school_grade || ""));
      const existRes = await fetch(
        `${sb.url}/rest/v1/tq_results?name=eq.${nameEnc}&user_school_grade=eq.${gradeEnc}&reg_date=eq.${today}&reading_score=eq.${Number(si.reading_score)||0}&limit=1`,
        { headers: { "apikey": sb.key, "Authorization": `Bearer ${sb.key}` } }
      );
      const existRows = await existRes.json();
      let rid: string;
      if (existRows && existRows.length > 0) {
        rid = existRows[0].id;
        await fetch(`${sb.url}/rest/v1/tq_results?id=eq.${rid}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": sb.key,
            "Authorization": `Bearer ${sb.key}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({ user_section: si.user_section || "", academy_token: token, updated_at: new Date().toISOString() })
        });
      } else {
        const insertRes = await fetch(`${sb.url}/rest/v1/tq_results`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": sb.key,
            "Authorization": `Bearer ${sb.key}`,
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            name:               si.name || "",
            user_school_grade:  String(si.user_school_grade || ""),
            user_section:       si.user_section || "",
            reg_date:           today,
            reading_score:      Number(si.reading_score) || 0,
            academy_token:      token,
            updated_at:         new Date().toISOString()
          })
        });
        if (!insertRes.ok) throw new Error("tq_results 삽입 실패: " + await insertRes.text());
        const inserted = await insertRes.json();
        rid = inserted[0]?.id;
        if (!rid) throw new Error("result_id 획득 실패");
      }

      // 2. tq_scores
      await fetch(`${sb.url}/rest/v1/tq_scores?result_id=eq.${rid}`, {
        method: "DELETE",
        headers: { "apikey": sb.key, "Authorization": `Bearer ${sb.key}` }
      });
      await dbPost("tq_scores", {
        result_id:        rid,
        acc:              si.acc,
        fact_score:       si.fact_score,
        structure_score:  si.structure_score,
        voca_score:       si.voca_score,
        wm_score:         si.wm_score,
        inference_score:  si.inference_score,
        hab_score:        si.hab_score,
        eff_score:        si.eff_score,
        reading_score:    si.reading_score,
        kor_score:        si.kor_score,
        eng_score:        si.eng_score,
        math_score:       si.math_score
      }, "return=minimal");

      // 3. tq_habits
      await fetch(`${sb.url}/rest/v1/tq_habits?result_id=eq.${rid}`, {
        method: "DELETE",
        headers: { "apikey": sb.key, "Authorization": `Bearer ${sb.key}` }
      });
      const HAB_LIST = [
        "이미 읽은 곳을 다시 읽음","읽다가 글줄을 자주 놓침","짚어가며 읽거나 밑줄을 그음",
        "단어 단위로 또박또박 읽음","소리 내어 읽거나 속발음을 함","긴 문장은 이해가 잘 안됨",
        "긴 문장은 훑어 읽기를 함","긴 글은 내용 기억이 잘 안남","모르는 단어가 없어도 이해가 잘 안됨",
        "글 읽는 속도가 느린 편임"
      ];
      const habRows = HAB_LIST.map((item, i) => ({
        result_id:  rid,
        item_order: i,
        item_name:  item,
        checked:    (si.reading_habit_checks || []).includes(item)
      }));
      await dbPost("tq_habits", habRows, "return=minimal");

      // 4. tq_eff_checks
      await fetch(`${sb.url}/rest/v1/tq_eff_checks?result_id=eq.${rid}`, {
        method: "DELETE",
        headers: { "apikey": sb.key, "Authorization": `Bearer ${sb.key}` }
      });
      const EFF_LIST = [
        "독서량이 많이 부족한 편이다","비문학 책은 어렵게 느껴진다","이해력이 부족한 편이다",
        "시험에서 시간에 쫓긴다","문제를 이해를 못해서 틀린다","서술형 평가 시험 점수가 낮다",
        "지문형 수학문제가 어렵다","국어 시험 점수가 유난히 낮다","두꺼운 책을 읽은 경험이 없다",
        "밤새워 책을 읽은 경험이 없다"
      ];
      const effRows = EFF_LIST.map((item, i) => ({
        result_id:  rid,
        item_order: i,
        item_name:  item,
        checked:    (si.reading_effect_checks || []).includes(item)
      }));
      await dbPost("tq_eff_checks", effRows, "return=minimal");

      // 5. tq_engine
      await fetch(`${sb.url}/rest/v1/tq_engine?result_id=eq.${rid}`, {
        method: "DELETE",
        headers: { "apikey": sb.key, "Authorization": `Bearer ${sb.key}` }
      });
      await dbPost("tq_engine", {
        result_id:    rid,
        base_type:    se.bt,     sub_type:  se.st,
        urgency:      se.urg,    tone:      se.tone,
        flag_c:       se.flagC,  flag_o:    se.flagO,
        flag_molip:   se.flagMolip||false, flag_molip_required: se.flagMolipRequired||false,
        flag_teukmok: se.flagTeukmok||false,
        inv_spd:      se.invSpd, gap:       se.gap,
        spd_grade:    se.spdGrade,
        def_factors:  JSON.stringify(se.def  || []),
        causal_paths: JSON.stringify(se.cau  || []),
        prescriptions:JSON.stringify(se.presc|| [])
      }, "return=minimal");

      // 6. tq_slots — ★ slots가 있을 때만 저장 (없으면 기존 데이터 유지)
      if (ss && ss["slot1"]) {
        await fetch(`${sb.url}/rest/v1/tq_slots?result_id=eq.${rid}`, {
          method: "DELETE",
          headers: { "apikey": sb.key, "Authorization": `Bearer ${sb.key}` }
        });
        const slotRows = [1,2,3,4].map(n => ({
          result_id: rid,
          slot_num:  n,
          content:   ss["slot"+n] || ""
        }));
        await dbPost("tq_slots", slotRows, "return=minimal");
      }
      // ss가 비어있음 = 권장훈련만 변경된 저장 → tq_slots 기존 데이터 그대로 유지

      return new Response(JSON.stringify({ ok: true, id: rid }), { headers: CORS });
    }

    // ── 판독 결과 조회 ──
    if (action === "load") {
      const sb = getSupabase();
      if (!sb.ok) return new Response(JSON.stringify({error:"DB 설정 미완료"}),{status:500,headers:CORS});

      const { name: loadName, user_school_grade: loadGrade, reading_score: loadSpd, reg_date: loadDate } = body;
      if (!loadName) return new Response(JSON.stringify({error:"이름 없음"}),{status:400,headers:CORS});

      const hdr = { "apikey": sb.key, "Authorization": `Bearer ${sb.key}` };
      const dbGet = async (path: string) => {
        const r = await fetch(`${sb.url}/rest/v1/${path}`, { headers: hdr });
        if (!r.ok) throw new Error("조회 실패: " + await r.text());
        return await r.json();
      };

      let filter = `name=eq.${encodeURIComponent(loadName)}`;
      if (loadGrade) filter += `&user_school_grade=eq.${encodeURIComponent(String(loadGrade))}`;
      if (loadSpd)   filter += `&reading_score=eq.${Number(loadSpd)}`;
      if (loadDate)  filter += `&reg_date=eq.${loadDate}`;

      const mainRows = await dbGet(`tq_results?${filter}&order=created_at.desc&limit=1`);
      if (!mainRows || mainRows.length === 0) {
        return new Response(JSON.stringify({ ok: true, found: false }), { headers: CORS });
      }
      const main = mainRows[0];
      const rid = main.id;

      const [scoreRows, habRows, effRows, engRows, slotRows] = await Promise.all([
        dbGet(`tq_scores?result_id=eq.${rid}&limit=1`),
        dbGet(`tq_habits?result_id=eq.${rid}&order=item_order.asc`),
        dbGet(`tq_eff_checks?result_id=eq.${rid}&order=item_order.asc`),
        dbGet(`tq_engine?result_id=eq.${rid}&limit=1`),
        dbGet(`tq_slots?result_id=eq.${rid}&order=slot_num.asc`)
      ]);

      const sc  = scoreRows[0] || {};
      const eng = engRows[0]   || {};

      // inp: 기존 사이트 필드명 기준으로 조립
      const inp = {
        name:                    main.name,
        user_school_grade:       main.user_school_grade,
        user_section:            main.user_section,
        reg_date:                main.reg_date,
        reading_score:           sc.reading_score   || main.reading_score,
        acc:                     sc.acc,
        fact_score:              sc.fact_score,
        structure_score:         sc.structure_score,
        voca_score:              sc.voca_score,
        wm_score:                sc.wm_score,
        inference_score:         sc.inference_score,
        hab_score:               sc.hab_score,
        eff_score:               sc.eff_score,
        kor_score:               sc.kor_score,
        eng_score:               sc.eng_score,
        math_score:              sc.math_score,
        reading_habit_checks:    habRows.filter((h:any)=>h.checked).map((h:any)=>h.item_name),
        reading_effect_checks:   effRows.filter((e:any)=>e.checked).map((e:any)=>e.item_name)
      };

      // engObj: runEngine 내부 필드명 기준 (fct, str_, voc, wm, inf 등)
      const engObj = {
        bt:       eng.base_type,   st:       eng.sub_type,
        urg:      eng.urgency,     tone:     eng.tone,
        flagC:    eng.flag_c,      flagO:    eng.flag_o,
        flagMolip: eng.flag_molip, flagMolipRequired: eng.flag_molip_required,
        flagTeukmok: eng.flag_teukmok,
        invSpd:   eng.inv_spd,     gap:      eng.gap,
        spdGrade: eng.spd_grade,
        def:      eng.def_factors   ? JSON.parse(eng.def_factors)   : [],
        cau:      eng.causal_paths  ? JSON.parse(eng.causal_paths)  : [],
        presc:    eng.prescriptions ? JSON.parse(eng.prescriptions) : [],
        habChecked:  inp.reading_habit_checks,
        effChecked:  inp.reading_effect_checks,
        acc:  inp.acc,
        fct:  inp.fact_score,       str_: inp.structure_score,
        voc:  inp.voca_score,       wm:   inp.wm_score,
        inf:  inp.inference_score,  hab:  inp.hab_score,
        eff:  inp.eff_score,        spd:  inp.reading_score,
        grade: inp.user_school_grade, level: inp.user_section,
        kor: inp.kor_score, eng_score: inp.eng_score, math: inp.math_score,
        habScore: inp.hab_score,    effScore: inp.eff_score
      };

      const slots: Record<string,string> = {};
      slotRows.forEach((s:any) => { slots[`slot${s.slot_num}`] = s.content; });

      return new Response(JSON.stringify({
        ok:         true,
        found:      true,
        id:         rid,
        inp,
        eng:        engObj,
        slots,
        reg_date:   main.reg_date,
        created_at: main.created_at
      }), { headers: CORS });
    }

    // ── 베타 피드백 저장 ──
    if (action === "feedback") {
      const sb = getSupabase();
      if (!sb.ok) return new Response(JSON.stringify({error:"피드백 저장 설정 미완료"}),{status:500,headers:CORS});
      const { type, slot_idx, slot_content, comment, eng_data, slots } = body;
      const record = {
        type:         type        || "unknown",
        slot_idx:     slot_idx    || null,
        slot_content: (slot_content||"").slice(0, 500),
        comment:      (comment    ||"").slice(0, 1000),
        eng_data:     (eng_data   ||"").slice(0, 3000),
        slots:        (slots      ||"").slice(0, 3000),
        created_at:   new Date().toISOString()
      };
      const res = await fetch(`${sb.url}/rest/v1/tq_feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": sb.key,
          "Authorization": `Bearer ${sb.key}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(record)
      });
      if (!res.ok) {
        const e = await res.text();
        throw new Error("피드백 저장 실패: " + e);
      }
      return new Response(JSON.stringify({ok:true}),{headers:CORS});
    }

    // ── 로드맵 추천 이유 생성 ──
    if (action === "roadmap_reason") {
      const { student, programs } = body;
      if (!student || !programs || !programs.length) {
        return new Response(JSON.stringify({error:"데이터 없음"}),{status:400,headers:CORS});
      }
      const SYS_ROADMAP = `당신은 StudyForce TQ테스트의 수석 판독 전문가입니다.
학생의 진단 결과와 선택된 훈련 과정 목록을 받아, 각 과정별로 "왜 이 학생에게 이 과정이 필요한지"를 학부모에게 설명하는 추천 이유를 작성합니다.
## 규칙
1. 각 과정마다 2~3문장, 100자 내외로 작성
2. 학생의 실제 진단 수치나 체크 항목을 근거로 서술 (수치 직접 언급 금지)
3. "이 과정에서는 ~을 훈련합니다" + "OO 학생에게 필요한 이유는 ~" 구조
4. 학생 이름은 반드시 "OO 학생" 형태로 사용
5. 낙인 표현 금지, 긍정적이고 명확한 톤
출력: 반드시 JSON만. {"reasons": {"과정명": "추천이유 텍스트", ...}}`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01"},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1500, system: SYS_ROADMAP,
          messages: [{role:"user", content: `학생 정보:\n${JSON.stringify(student, null, 2)}\n\n선택된 훈련 과정:\n${JSON.stringify(programs, null, 2)}\n\nJSON만 출력하세요.`}]
        })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error?.message || "로드맵 이유 생성 오류");
      }
      const data = await res.json();
      let raw = data.content[0].text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      const s = raw.indexOf("{"), e_ = raw.lastIndexOf("}");
      if (s >= 0 && e_ > s) raw = raw.slice(s, e_ + 1);
      return new Response(raw, { headers: { ...CORS, "Content-Type":"application/json" } });
    }

    return new Response(JSON.stringify({error:"알 수 없는 action"}),{status:400,headers:CORS});

  } catch (err) {
    return new Response(JSON.stringify({error: String(err)}),{status:500,headers:CORS});
  }
});
