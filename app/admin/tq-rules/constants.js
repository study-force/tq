export const AREAS = [
  { id: 1, name: "성적선행지수" },
  { id: 2, name: "독해속도" },
  { id: 3, name: "독서의양" },
  { id: 4, name: "독해의질" },
  { id: 5, name: "정보처리습관" },
  { id: 6, name: "워킹메모리" },
  { id: 7, name: "추론능력" },
  { id: 8, name: "독해효율성" },
  { id: 9, name: "학교학업" },
];

export const TAG_LIST = ["강점", "보통", "주의", "위험", "_meta"];

export const COND_COLS = [
  { key: "flagC",            label: "모순패턴",   width: 70 },
  { key: "flagO",            label: "과부하",     width: 60 },
  { key: "acc",              label: "독해정확도", width: 90 },
  { key: "kv",               label: "국어성적",   width: 70 },
  { key: "spdGrade",         label: "속도등급",   width: 70 },
  { key: "voc",              label: "어휘",       width: 60 },
  { key: "wm",               label: "워킹메모리", width: 70 },
  { key: "inf",              label: "추론",       width: 60 },
  { key: "eff",              label: "효율성",     width: 60 },
  { key: "gap",              label: "gap",        width: 60 },
  { key: "habClass.심각도",   label: "음독심각도", width: 70 },
  { key: "habClass.표면음독", label: "표면음독",   width: 60 },
];

export const COND_KEY_SET = new Set(COND_COLS.map(c => c.key));
