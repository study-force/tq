  function initResizer() {
    var r = document.getElementById('layoutResizer');
    var lp = document.querySelector('.L');
    if (!r || !lp) return;
    var sx=0, sw=0, drag=false;
    r.addEventListener('mousedown', function(e) {
      drag=true; sx=e.clientX; sw=lp.offsetWidth;
      r.classList.add('dragging');
      document.body.style.cursor='col-resize';
      document.body.style.userSelect='none';
      e.preventDefault();
    });
    window.addEventListener('mousemove', function(e) {
      if(!drag) return;
      lp.style.width = Math.min(600,Math.max(180,sw+(e.clientX-sx)))+'px';
      e.preventDefault();
    });
    window.addEventListener('mouseup', function() {
      if(!drag) return;
      drag=false; r.classList.remove('dragging');
      document.body.style.cursor='';
      document.body.style.userSelect='';
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initResizer);
  else initResizer();
})();

// ══════════════════════════════════════════════════════
// 새 창 리포트 출력 — standalone 구조
// ══════════════════════════════════════════════════════
var HABIT_ITEMS_RPT = ["이미 읽은 곳을 다시 읽음","읽다가 글줄을 자주 놓침","짚어가며 읽거나 밑줄을 그음","단어 단위로 또박또박 읽음","소리내어 읽거나 속발음을 함","긴 문장은 이해하기 잘 안됨","긴 문장은 줄여 읽기를 함","긴 글은 내용 기억이 잘 안됨","단어를 다 알아도 이해가 안됨","글 읽는 속도가 느린 편임"];
var EFF_ITEMS_RPT   = ["독서량이 많이 부족한 편이다","비문학 책은 어렵게 느껴진다","이해력이 부족한 편이다","시험에서 시간에 쫓긴다","문제를 이해 못해서 틀린다","서술형 평가 시험 점수가 낮다","지문형 수학문제가 어렵다","국어시험 점수가 유난히 낮다","두꺼운 책을 읽은 경험이 없다","밤새워 책을 읽은 경험이 없다"];
var FC_RPT = {어휘력:"#9589D9",워킹메모리:"#68C1F4",추론능력:"#8ED962",독해습관:"#7EBF6F",독해효율성:"#647AB3"};
var FL_RPT = {어휘력:"어휘의 의미를 정확히 파악하고 실제 문장 속에서 활용할 수 있는 능력.",워킹메모리:"문장을 읽을 때마다 실시간 정보를 처리하고 그것을 다시 단위로 재처리하여 생성하는 작업기억 능력.",추론능력:"글의 사실적 전개과정에서 한 단계 더 나아가 논리적 개연성 속에서 전반의 내용을 추론하는 능력.",독해습관:"공부 효율에 결정적 영향을 미치는 글을 읽고 이해하는 능력의 품질과 성능에 관여하는 세부 기준.",독해효율성:"인지·이해·기억 등 독해 관련 활동 전반에 치명적 영향을 미치는 독해효율성의 문제점과 개선점 진단."};
var TC_RPT = {"최상위 완성 역량형":"#059669","고역량 잠재력 미개방형":"#0d9488","성실한 암기 의존형":"#dc2626","논리 두뇌 미발현형":"#2563eb","조용한 학습 위기형":"#e11d48","전반 역량 미완성형":"#d97706","기초 회복 가능 위기형":"#ea580c","심각한 학습 기능 마비형":"#991b1b","전반 역량 공백형":"#475569","역량 모순 붕괴 예고형":"#7c3aed"};
var UC_RPT = {"즉각":"#B91C1C","조기":"#B45309","중장기":"#047857"};
var SC_RPT = ["#1E40AF","#0BA98E","#B45309","#7C3AED"];
var SLOT_T_RPT = ["어떤 학습자인가?","지금 어떤 상태인가?","지금 개선하지 않으면?","지금 무엇을 해야 하는가?"];
var SLOT_D_RPT = ["강점과 가능성을 중심으로","현재 역량 상태와 원인 분석","지금 개선하지 않을 때의 리스크","맞춤 처방과 앞으로의 방향"];


// ══════════════════════════════════════════════════════
// DEV_BYPASS — false 로 바꾸면 원래 동작 복귀
// ══════════════════════════════════════════════════════
var DEV_BYPASS = false;
var DEV_ENG = {
  // ── 유형 ──
  bt:"고역량 잠재력 미개방형", btDisplay:"고역량 잠재력 미개방형",
  st:"기억력 강화 시 상위권 완전 안착 가능", stDisplay:"기억력 강화 시 상위권 완전 안착 가능",
  urg:"조기", tone:"격려확인",
  // ── 플래그 ──
  flagC:false, flagO:false, invSpd:false, retest:false,
  // ── 수치 ──
  acc:65, fct:72, str_:58, voc:64, wm:38, inf:71,
  hab:60, eff:70, spd:680,
  spdGrade:"보통이상",
  spdDesc:"또래 평균보다 빠른 편으로, 정보처리 효율이 양호합니다.",
  // ── 학생 정보 ──
  level:"중등", grade:2, uiLevel:"중등",
  date:(function(){var d=new Date();return d.getFullYear()+"년 "+(d.getMonth()+1)+"월 "+d.getDate()+"일";})(),
  // ── 성적 ──
  kor:"80~89점", eng:"70~79점", math:"80~89점",
  // ── 결손/인과/처방 ──
  def:["워킹메모리부족"],
  cau:["WM부족 → 재처리반복 → 독해속도저하","독해속도저하 → 시험시간 부족 위험"],
  presc:[{p:1,c:"워킹메모리 강화 훈련"},{p:2,c:"비문학 독서 확충 — 어휘력 향상"},{p:3,c:"독해 정확도 정밀 훈련"}],
  tr:"고등 진입 시 역량 갭 확대",
  gap:14,
  // ── 체크리스트 ──
  habChecked:["이미 읽은 곳을 다시 읽음","짚어가며 읽거나 밑줄을 그음","단어 단위로 또박또박 읽음","긴 글은 내용 기억이 잘 안됨"],
  effChecked:["비문학 책은 어렵게 느껴진다","시험에서 시간에 쫓긴다","서술형 평가 시험 점수가 낮다"],
  habScore:60, effScore:70,
  // ── 강도 ──
  inten:{acc:0.35,inf:0.1,voc:0.18,wm:0.55,hab:0.2,eff:0.15,con:0,ov:0.32,ex:"약",aN:false,iN:false},
  // ── 근거 카드 (9개 항목) ──
  evidence:[
    {id:"성적선행지수", title:"1) 성적선행지수", bullets:[
      {id:"1_6", t:"강점", s:"공부를 잘 할 수 있는 우수한 소양을 지닌 아이 — 상위권 역량"},
      {id:"1_7", t:"강점", s:"역량과 성적이 일치 — 실력 기반 상위권"}
    ]},
    {id:"독해속도", title:"2) 독해속도", bullets:[
      {id:"eng_5_8", t:"보통", s:"글 읽는 속도는 보통 수준 — 성실하게 읽는 편"},
      {id:"eng_5_10", t:"강점", s:"정보처리 속도 양호 — 지적 호기심과 독서 경험 반영"}
    ]},
    {id:"독서의양", title:"3) 독서의 양", bullets:[
      {id:"eng_3_3", t:"보통", s:"적정 수준의 독서 경험 — 비문학 독서 이력 있음"},
      {id:"3_6", t:"주의", s:"독해정확도에 비해 어휘력이 발달하지 않음 — 독서 편중 가능성 높음"}
    ]},
    {id:"독해의질", title:"4) 독해의 질", bullets:[
      {id:"eng_4_7", t:"강점", s:"지문 내용을 정확히 이해하고 기억하려고 노력함"},
      {id:"eng_4_2", t:"주의", s:"구조적 이해 부족 — 글의 구조·흐름·의도 파악이 부족"}
    ]},
    {id:"정보처리습관", title:"5) 정보처리습관", bullets:[
      {id:"5_8", t:"주의", s:"긴 문장에서 이해 결손이 생기는 패턴 — 워킹메모리 부족과 연관"},
      {id:"eng_5_21", t:"보통", s:"재독·짚어읽기 경향 — 꼼꼼하게 확인하려는 습관"}
    ]},
    {id:"워킹메모리", title:"6) 워킹메모리", bullets:[
      {id:"6_4", t:"주의", s:"워킹메모리 부족 — 정보를 한 번에 처리하지 못하고 반복 재처리하는 경향"},
      {id:"6_7", t:"위험", s:"앞서 읽은 내용을 기억하지 못한 채 뒷부분을 읽게 되어 긴 문장이나 글의 전체 맥락 파악이 어려움"}
    ]},
    {id:"추론능력", title:"7) 추론능력", bullets:[
      {id:"7_2", t:"강점", s:"수학·과학 등 논리적 사고가 필요한 과목에서 강점 발휘 가능"},
      {id:"eng_7_4", t:"강점", s:"추론능력 양호 — 논리적 사고력 보유"}
    ]},
    {id:"독해효율성", title:"8) 독해효율성 상태", bullets:[
      {id:"8_4", t:"보통", s:"독해효율성 보통 — 일부 공부 방식에 회의감 있음"},
      {id:"8_7", t:"위험", s:"시험 실전에서 효율성 결함이 직접 점수에 영향을 주고 있음"}
    ]},
    {id:"학교학업", title:"9) 학교학업", bullets:[
      {id:"9_4", t:"강점", s:"국어 성적 상위권 — 독해역량 수준이 성적에 고스란히 반영됨"}
    ]}
  ],
  // ── 판독문 슬롯 ──
  slots:{
    slot1:"김지우 학생은 독해력과 추론능력이 또래 가운데 상위권으로 발달한 상태입니다. 글을 읽고 사실적인 정보를 파악하는 능력이 탄탄하며, 논리적 사고력도 갖추고 있어 수학·과학 등 이과 계열 과목에서도 두각을 나타낼 수 있는 소양을 지니고 있습니다. 현재 성적이 역량을 고스란히 반영하고 있다는 점 역시 긍정적인 신호입니다. 다만 워킹메모리 하나가 전체 역량의 발현을 막고 있는 구조로, 이 부분만 강화된다면 상위권 완전 안착이 충분히 가능한 학생입니다.",
    slot2:"현재 가장 주목해야 할 지점은 워킹메모리 역량입니다. 글을 읽는 과정에서 앞 내용을 기억하지 못한 채 뒷 내용을 읽게 되는 패턴이 반복되고 있으며, 이로 인해 긴 문장이나 복잡한 지문에서 전체 맥락 파악이 어려워지는 현상이 나타납니다. 독해습관 체크리스트에서 '이미 읽은 곳을 다시 읽음', '짚어가며 읽거나 밑줄을 그음' 항목이 확인된 것도 이와 직결됩니다. 재처리 반복이 독해 속도를 낮추고, 시험 현장에서 시간이 부족한 이유가 여기에 있습니다.",
    slot3:"지금 개선하지 않으면 고등학교 진입 시점에 역량 갭이 크게 벌어질 수 있습니다. 현재 중학교 수준에서는 독해역량과 성적이 균형을 이루고 있지만, 고등학교 지문의 난이도와 분량이 급증하면 워킹메모리 부족이 결정적인 약점으로 작용합니다. 특히 수능 국어와 탐구 영역에서는 긴 지문을 단번에 처리하는 능력이 핵심인 만큼, 지금이 개입의 골든타임입니다.",
    slot4:"우선순위는 워킹메모리 강화 훈련입니다. 정보를 한 번에 처리하고 기억하는 훈련을 통해 재처리 반복 습관을 끊어야 합니다. 동시에 비문학 분야의 독서 범위를 넓혀 어휘력과 배경지식을 쌓는 것이 두 번째 과제입니다. 독해 정확도를 더 높이는 정밀 훈련까지 병행한다면, 현재의 상위권 역량이 최상위권으로 도약하는 것은 충분히 현실적인 목표입니다."
  },
  log:[]
};
var DEV_INP = {
  name:"김지우", level:"중등", grade:2, uiLevel:"중등",
  acc:65, fct:72, str:58, str_:58, spd:680, voc:64, wm:38, inf:71, hab:60, eff:70,
  kor:"80~89점", eng:"70~79점", math:"80~89점",
  habChecked:DEV_ENG.habChecked, effChecked:DEV_ENG.effChecked
};
if (DEV_BYPASS) {
  window.addEventListener('load', function() {
    window.__eng = DEV_ENG; window.__nm = DEV_INP.name; window.__inp = DEV_INP;
    var _ev = document.getElementById("emptyView"); if (_ev) _ev.style.display = "none";
    var _rv = document.getElementById("resultView");
    if (_rv) _rv.innerHTML = window.renderResult(DEV_ENG, DEV_INP.name);
    window.showResultPage(DEV_INP.name);
    if (_rv) window.runEntryAnimation(_rv, DEV_ENG, DEV_INP);
    var _bB = document.getElementById("btnB"); if (_bB) _bB.disabled = false;
  });
}
