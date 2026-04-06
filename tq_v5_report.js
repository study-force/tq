// ★ 리포트 렌더 엔진 (standalone_v2 이식)
// ════════════════════════════════════════════════════════

// D는 렌더 함수 호출 시 window.__RPT_D로부터 주입
var D = null;





var HABIT_ITEMS = ["이미 읽은 곳을 다시 읽음","읽다가 글줄을 자주 놓침","짚어가며 읽거나 밑줄을 그음","단어 단위로 또박또박 읽음","소리 내어 읽거나 속발음을 함","긴 문장은 이해하기 잘 안됨","긴 문장은 줄여 읽기를 함","긴 글은 내용 기억이 잘 안됨","모르는 단어가 없어도 이해가 잘 안됨","글 읽는 속도가 느린 편임"];
var EFF_ITEMS   = ["독서량이 많이 부족한 편이다","비문학 책은 어렵게 느껴진다","이해력이 부족한 편이다","시험에서 시간에 쫓긴다","문제를 이해 못해서 틀린다","서술형 평가 시험 점수가 낮다","지문형 수학문제가 어렵다","국어 시험 점수가 유난히 낮다","두꺼운 책을 읽은 경험이 없다","밤새워 책을 읽은 경험이 없다"];
var FACTOR_COLORS = {어휘력:"#9589D9",워킹메모리:"#68C1F4",추론능력:"#8ED962",독해습관:"#7EBF6F",독해효율성:"#647AB3"};
var FACTOR_LABEL = {어휘력:"어휘의 의미를 문장의 맥락을 통해 정확하게 파악하고 정교하게 처리하는 능력",워킹메모리:"실시간으로 정보를 처리하고 그것을 다시 하나의 단위로 재처리하여 생성하는 작업기억 능력",추론능력:"글의 사실적 전개과정에서 한 단계 더 나아가 논리적 개연성 속에서 전반의 내용을 추론하는 능력",독해습관:"공부 효율에 결정적 영향을 미치는 글을 읽고 이해하는 능력의 품질과 성능에 관여하는 세부 기준",독해효율성:"인지·이해·기억 등 독해 관련 활동 전반에 치명적 영향을 미치는 독해효율성의 문제점과 개선점 진단"};
var TC = {"통합완성형":"#0BA98E","사실강점형":"#2563EB","추론잠재형":"#D97706","기초개발형":"#DC2626"};
var RPT_UC = {"즉각":"#B91C1C","조기":"#B45309","중장기":"#047857"};
var RPT_UBG = {"즉각":"#FEF2F2","조기":"#FFFBEB","중장기":"#ECFDF5"};
var RPT_SC = ["#1E40AF","#0BA98E","#B45309","#7C3AED"];
var RPT_SLOT_T      = ["어떤 학습자인가?","지금 어떤 상태인가?","지금 개선하지 않으면?","지금 무엇을 해야 하는가?"];
var RPT_SLOT_JOSA   = ["은","은","이","이"]; // "학생" 뒤 — 받침 있으므로 은/이 고정

// 이름 마지막 글자 받침 여부로 조사 자동 선택 (이름+조사 조합에 사용)
function rptJosa(name, pair) {
  var code = name.charCodeAt(name.length - 1);
  var hasBatchim = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
  var parts = pair.split('/');
  return hasBatchim ? parts[0] : parts[1];
}
var RPT_SLOT_DESC = ["강점과 가능성을 중심으로","현재 역량 상태와 원인 분석","지금 개선하지 않을 때의 리스크","맞춤 처방과 앞으로의 방향"];

// 진단일: TQ 테스트 날짜 (D.date = inp.reg_date)
var RPT_dateStr = (function(){
  var raw = (D && D.date) || (window.__inp && window.__inp.reg_date) || '';
  if (raw) {
    var parts = raw.slice(0,10).split('-');
    if (parts.length === 3) return parts[0]+'년 '+parseInt(parts[1])+'월 '+parseInt(parts[2])+'일';
  }
  var d = new Date(); return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일';
})();
var lvMap = {초등:"초등학교",초저:"초등학교",초고:"초등학교",중등:"중학교",고등:"고등학교"};
// RPT_lvLabel은 renderReportTab() 호출 후 D가 주입된 시점에 사용

// ── PolarArea SVG ──
function buildPolar(factors, size) {
  var cx=size/2, cy=size/2, maxR=size*0.355, n=factors.length, step=(Math.PI*2)/n;
  var segs = factors.map(function(d,i){
    var sa=-Math.PI/2-(Math.PI/5)+i*step, ea=sa+step;
    var r=Math.max((Math.min(d.score,100)/100)*maxR,2);
    var x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa),x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea);
    var mid=sa+step/2, lR=maxR*1.38;
    var lxOff=d.name==="독해효율성"?5:d.name==="워킹메모리"?-5:0;
    var lyOff=d.name==="독해습관"?-5:d.name==="추론능력"?-5:0;
    return {
      path:'M '+cx.toFixed(1)+' '+cy.toFixed(1)+' L '+x1.toFixed(1)+' '+y1.toFixed(1)+' A '+r.toFixed(1)+' '+r.toFixed(1)+' 0 0 1 '+x2.toFixed(1)+' '+y2.toFixed(1)+' Z',
      color:d.color, label:d.name, value:d.score, needsBadge:d.score<=60,
      lx:cx+lR*Math.cos(mid)+lxOff, ly:cy+lR*Math.sin(mid)+lyOff
    };
  });
  // 배경 링: 0-20, 40-60, 80-100 구간
  function ringPath(r1, r2) {
    // r1=안쪽, r2=바깥쪽 — evenodd로 링 생성
    var p = 'M '+(cx+r2)+' '+cy+' A '+r2+' '+r2+' 0 1 0 '+(cx-r2)+' '+cy+' A '+r2+' '+r2+' 0 1 0 '+(cx+r2)+' '+cy;
    if(r1 > 0) p += ' M '+(cx+r1)+' '+cy+' A '+r1+' '+r1+' 0 1 0 '+(cx-r1)+' '+cy+' A '+r1+' '+r1+' 0 1 0 '+(cx+r1)+' '+cy;
    return p;
  }
  var r0 = 0, r20=(20/100)*maxR, r40=(40/100)*maxR, r60=(60/100)*maxR, r80=(80/100)*maxR, r100=maxR;
  var bg = '<path d="'+ringPath(r0,r20)+'" fill="#E8EDF2" fill-opacity="0.5" fill-rule="evenodd"/>'
    +'<path d="'+ringPath(r40,r60)+'" fill="#E8EDF2" fill-opacity="0.5" fill-rule="evenodd"/>'
    +'<path d="'+ringPath(r80,r100)+'" fill="#E8EDF2" fill-opacity="0.5" fill-rule="evenodd">'+'</path>';
  var grids = [20,40,60,80,100].map(function(g){
    return '<circle cx="'+cx+'" cy="'+cy+'" r="'+((g/100)*maxR).toFixed(1)+'" fill="none" stroke="#D1D5DB" stroke-width="0.7"/>';
  }).join('');
  var lines = factors.map(function(_,i){
    var a=-Math.PI/2-(Math.PI/5)+i*step;
    return '<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+maxR*Math.cos(a)).toFixed(1)+'" y2="'+(cy+maxR*Math.sin(a)).toFixed(1)+'" stroke="#D1D5DB" stroke-width="0.7"/>';
  }).join('');
  var paths = segs.map(function(s){ return '<path d="'+s.path+'" fill="'+s.color+'" fill-opacity="0.65" stroke="white" stroke-width="1.2" style="filter:drop-shadow(1px 2px 3px rgba(0,0,0,0.18))"/>'; }).join('');
  var pcts = [0,20,40,60,80,100].map(function(pct){
    return '<text x="'+(cx+4)+'" y="'+(cy+(pct/100)*maxR+9).toFixed(1)+'" text-anchor="start" dominant-baseline="middle" font-size="11" fill="#000" fill-opacity="0.6" font-weight="600" font-family="\'Noto Sans KR\',sans-serif">'+pct+'%</text>';
  }).join('');
  var labels = segs.map(function(s){
    return '<text x="'+s.lx.toFixed(1)+'" y="'+(s.ly-10).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#555" font-weight="700" font-family="\'Noto Sans KR\',sans-serif">'+s.label+'</text>'
          +'<text x="'+s.lx.toFixed(1)+'" y="'+(s.ly+11).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="20" fill="'+(s.value<=60?"#EF4444":"#1E293B")+'" font-weight="900" font-family="Tahoma,sans-serif">'+s.value+'</text>';
  }).join('');
  var badges = segs.filter(function(s){return s.needsBadge;}).map(function(s){
    return '<rect x="'+(s.lx-24).toFixed(1)+'" y="'+(s.ly+20).toFixed(1)+'" width="48" height="18" rx="3" fill="#EF4444"/>'
          +'<text x="'+s.lx.toFixed(1)+'" y="'+(s.ly+30).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="white" font-weight="800" font-family="\'Noto Sans KR\',sans-serif">개선 필요</text>';
  }).join('');
  return '<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'" overflow="visible">'+bg+grids+lines+paths+pcts+labels+badges+'</svg>';
}

// ── 공통 회색 푸터 ──
function buildFooter(pageNum, total) {
  var RPT_lvLabel = (lvMap[D.level]||D.level||"")+(D.grade?" "+D.grade+"학년":"");
  return '<div style="background:#666666;padding:7px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
    +'<div style="display:flex;align-items:center;gap:8px">'
    +''
    +'<span style="font-size:9px;color:rgba(255,255,255,.7);letter-spacing:.5px">STUDYFORCE · TQ 독해역량 판독 리포트</span>'
    +'<span style="font-size:8px;color:rgba(255,255,255,.3);letter-spacing:.3px;margin-left:8px">v5.93</span>'
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:12px">'
    +'<span style="font-size:9px;color:rgba(255,255,255,.6)">'+D.name+'</span>'
    +'<span style="font-size:9px;color:rgba(255,255,255,.3)">'+pageNum+' / '+total+'</span>'
    +'</div>'
    +'</div>';
}

// ══════════════════════════
// 페이지 1 — TQ 결과지
// ══════════════════════════
function buildPage1() {
  var TOTAL = 4;
  var RPT_lvLabel = (lvMap[D.level]||D.level||"")+(D.grade?" "+D.grade+"학년":"");
  var factual    = D.fct>0 ? D.fct : D.acc;
  var structural = D.str_>0 ? D.str_ : D.acc;
  var avgAcc     = Math.round((factual+structural)/2);
  var accColor   = avgAcc<=60?"#EF4444":avgAcc<=70?"#F97316":avgAcc<=80?"#EAB308":avgAcc<=90?"#22C55E":"#3B82F6";

  var habChecked = HABIT_ITEMS.map(function(item){ return Array.isArray(D.habChecked) && D.habChecked.indexOf(item)>-1; });
  var effChecked = EFF_ITEMS.map(function(item){ return Array.isArray(D.effChecked) && D.effChecked.indexOf(item)>-1; });
  var habitCount = habChecked.filter(Boolean).length;
  var effCount   = effChecked.filter(Boolean).length;

  var FACTORS = [
    {name:"어휘력",    score:D.voc,  color:FACTOR_COLORS["어휘력"]},
    {name:"워킹메모리",score:D.wm,   color:FACTOR_COLORS["워킹메모리"]},
    {name:"추론능력",  score:D.inf,  color:FACTOR_COLORS["추론능력"]},
    {name:"독해습관",  score:D.hab,  color:FACTOR_COLORS["독해습관"]},
    {name:"독해효율성",score:D.eff,  color:FACTOR_COLORS["독해효율성"]},
  ];

  var habitRows = HABIT_ITEMS.map(function(item,i){
    var on=habChecked[i];
    return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3.5px">'
      +'<span style="color:'+(on?"#cc0000":"#CBD5E1")+';font-size:15px;min-width:13px;line-height:1">'+(on?"●":"○")+'</span>'
      +'<span style="font-size:14.5px;color:'+(on?"#1E293B":"#64748B")+';font-weight:400;letter-spacing:'+(item==="모르는 단어가 없어도 이해가 잘 안됨"?"-0.08em":"-0.02em")+';white-space:nowrap">'+item+'</span></div>';
  }).join('');

  var effRows = EFF_ITEMS.map(function(item,i){
    var on=effChecked[i];
    return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3.5px">'
      +'<span style="color:'+(on?"#cc0000":"#CBD5E1")+';font-size:15px;min-width:13px;line-height:1">'+(on?"●":"○")+'</span>'
      +'<span style="font-size:14.5px;color:'+(on?"#1E293B":"#64748B")+';font-weight:400;letter-spacing:-0.02em">'+item+'</span></div>';
  }).join('');

  var factorRows = FACTORS.map(function(f){
    return '<div style="display:grid;grid-template-columns:100px 1fr;gap:10px;align-items:flex-start;margin-bottom:10px;margin-left:20px">'
      +'<div style="text-align:center;padding:5px 4px;background:#F1F5F9;border-radius:6px;border:1px solid #DDE3ED">'
      +'<div style="font-size:16px;font-weight:400;color:#111">'+f.name+'</div></div>'
      +'<div style="font-size:12px;color:#475569;line-height:1.55">'+FACTOR_LABEL[f.name]+'</div></div>';
  }).join('');

  var div = document.createElement('div');
  div.className = 'page';
  div.innerHTML =
    // 헤더
    '<div style="background:#666666;padding:24px 24px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;min-height:0">'
    +'<div style="display:flex;align-items:center;gap:24px">'
    +'<svg id="_레이어_1" data-name="레이어_1" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 384.01 157.95" height="63" style="display:block;"> <defs> </defs> <polyline fill="#fff" points="0 24.54 75.25 24.54 75.25 47.14 49.97 47.14 49.97 115.73 25.28 115.73 25.28 47.14 0 47.14 0 24.54"/> <path fill="#fff" d="M149.3,103.88c3.09,2.44,5.11,3.97,6.06,4.59,1.42.91,3.33,1.96,5.73,3.16l-6.88,15.72c-3.45-1.9-6.87-4.16-10.25-6.77-3.38-2.62-5.74-4.59-7.09-5.91-5.46,2.69-12.31,4.03-20.53,4.03-12.16,0-21.75-3.61-28.77-10.83-8.3-8.54-12.45-20.55-12.45-36.03s3.63-26.68,10.89-35c7.26-8.32,17.4-12.48,30.43-12.48s23.54,4.07,30.76,12.2c7.22,8.14,10.84,19.78,10.84,34.93,0,13.49-2.91,24.28-8.73,32.37h0ZM130.36,89.47c1.98-4.02,2.96-10.03,2.96-18.04,0-9.21-1.51-15.78-4.51-19.72-3.01-3.94-7.15-5.91-12.44-5.91-4.92,0-8.91,2.01-11.97,6.03-3.06,4.02-4.59,10.31-4.59,18.85,0,9.95,1.49,16.94,4.47,20.96,2.98,4.02,7.07,6.03,12.27,6.03,1.67,0,3.25-.19,4.75-.56-2.08-2.28-5.36-4.44-9.84-6.47l3.86-10.14c2.2.46,3.9,1.02,5.13,1.68,1.23.66,3.61,2.41,7.16,5.23.84.66,1.76,1.35,2.74,2.05"/> <polyline fill="#c9c9c9" points="178.39 115.82 178.39 33.75 151.71 33.75 151.71 24.66 215.02 24.66 215.02 33.75 188.7 33.75 188.7 115.82 178.39 115.82"/> <polyline fill="#c9c9c9" points="219.83 115.82 219.83 24.66 264.29 24.66 264.29 34.68 230.14 34.68 230.14 63.46 260.02 63.46 260.02 72.56 230.14 72.56 230.14 105.79 266.95 105.79 266.95 115.82 219.83 115.82"/> <path fill="#c9c9c9" d="M267.21,95.21h10.32v.59c0,5.06,1.53,8.58,4.6,10.55,3.07,1.98,7.14,2.97,12.23,2.97,4.44,0,8.18-1.5,11.19-4.52,3.02-3.01,4.52-6.99,4.52-11.92,0-3.99-1.3-7.26-3.9-9.81-2.6-2.5-6.56-5.01-11.87-7.52l-4.1-1.94c-5.57-2.66-9.74-5.29-12.5-7.9-2.75-2.6-4.81-5.49-6.16-8.66-1.35-3.17-2.02-6.71-2.02-10.63,0-6.89,2.1-12.7,6.3-17.44,4.21-4.74,10.79-7.11,19.73-7.11,8.21,0,13.98,1.74,17.33,5.23,3.34,3.49,5.01,7.55,5.01,12.2v.58h-10.31v-.58c0-1.46-.51-2.89-1.53-4.31-1.02-1.42-2.56-2.44-4.6-3.08-2.05-.63-4.3-.95-6.74-.95-4.99,0-8.69,1.46-11.09,4.38-2.4,2.92-3.6,6.24-3.6,9.95,0,2.51.57,4.87,1.71,7.08,1.14,2.21,2.72,4.04,4.72,5.49,2,1.45,5.37,3.39,10.11,5.81l4.79,2.41c7.66,3.87,12.79,7.94,15.39,12.2,2.56,4.26,3.83,8.86,3.83,13.78,0,4.58-1.05,9.01-3.14,13.29-2.09,4.28-4.99,7.53-8.7,9.74-3.71,2.21-8.65,3.31-14.82,3.31s-10.76-.81-14.69-2.43c-3.93-1.62-6.91-4.29-8.95-8-2.04-3.71-3.06-7.78-3.06-12.19v-.59"/> <polyline fill="#c9c9c9" points="347.37 115.82 347.37 33.75 320.69 33.75 320.69 24.66 384.01 24.66 384.01 33.75 357.68 33.75 357.68 115.82 347.37 115.82"/> <g> <path fill="#fff" d="M90.33,140.62c.02.26-.08.41-.29.44-.21.03-.33-.1-.36-.39-.3-2.53-.72-4.05-1.24-4.55-.52-.51-1.73-.76-3.64-.76-.69,0-1.12.05-1.28.16-.17.11-.25.39-.25.84v13.52c0,.95.12,1.5.35,1.65.23.15.93.23,2.1.23.4,0,.6.11.61.33s-.2.33-.61.33h-6.14c-.4,0-.6-.11-.6-.33s.2-.33.6-.33c1.18,0,1.89-.08,2.11-.23.22-.16.34-.71.34-1.65v-13.52c0-.46-.08-.74-.24-.84s-.58-.16-1.27-.16c-1.89,0-3.1.25-3.64.76-.54.51-.95,2.02-1.24,4.55-.03.29-.16.43-.37.39-.22-.03-.32-.18-.3-.44l.29-5.46c.03-.18.09-.29.17-.34s.2-.07.36-.07h13.75c.18,0,.3.02.38.07.08.05.13.16.14.34l.26,5.46Z"/> <path fill="#fff" d="M99.76,142.28c.85,1.24,1.3,2.56,1.37,3.97.02.16.01.3-.01.4-.02.11-.12.16-.28.16h-9.43c0,1.68.42,3,1.27,3.95.85.96,2.1,1.4,3.74,1.33,1.01-.03,1.86-.35,2.54-.94.69-.6,1.17-1.2,1.44-1.82.13-.26.3-.33.52-.22.22.11.27.29.16.51-.45.98-1.09,1.77-1.92,2.38-.83.6-1.95.91-3.36.91-1.71,0-3.1-.58-4.16-1.74-1.06-1.16-1.6-2.56-1.6-4.21,0-1.73.52-3.25,1.55-4.57,1.03-1.31,2.45-1.97,4.26-1.97s3.06.62,3.91,1.86ZM99.48,145.91c.1-.12.16-.38.16-.77,0-.96-.31-1.88-.94-2.74-.62-.87-1.6-1.3-2.93-1.3-1.47,0-2.54.54-3.22,1.63-.67,1.09-1.04,2.21-1.1,3.37h7.22c.43,0,.7-.06.8-.18Z"/> </g> <g> <path fill="#fff" d="M108.55,152.46c-.37,0-.55-.11-.55-.32s.18-.32.55-.32c.99,0,1.56-.05,1.7-.15.14-.1.04-.4-.31-.91l-2.42-3.48-2.57,3.48c-.4.52-.54.83-.42.92.12.09.62.13,1.5.13.37,0,.55.11.55.32s-.18.32-.55.32h-4.46c-.37,0-.55-.11-.55-.32s.18-.32.55-.32c.7,0,1.18-.05,1.42-.13.24-.09.54-.38.89-.87l3.14-4.19-2.95-4.26c-.34-.49-.62-.78-.85-.87-.23-.09-.72-.13-1.45-.13-.37,0-.56-.1-.56-.31,0-.2.18-.31.56-.31h5.04c.4,0,.6.1.59.31,0,.2-.2.31-.59.31-.91,0-1.44.05-1.57.15-.14.1-.03.4.32.91l2.23,3.18,2.42-3.18c.4-.52.54-.83.42-.92-.12-.09-.6-.13-1.45-.13-.35,0-.53-.1-.53-.31s.18-.31.53-.31h4.3c.38,0,.58.1.58.31s-.19.31-.58.31c-.67,0-1.11.05-1.31.15s-.48.38-.85.86l-3.02,3.94,3.17,4.51c.34.47.62.76.86.86.24.1.8.15,1.68.15.4,0,.6.11.59.32,0,.21-.2.32-.59.32h-5.45Z"/> <path fill="#fff" d="M123.11,148.15c.26-.02.38.13.38.45,0,1-.25,1.96-.76,2.9-.5.94-1.39,1.41-2.65,1.41-.74,0-1.35-.26-1.85-.77-.5-.51-.74-1.17-.74-1.97v-8.42h-2.33c-.37,0-.55-.1-.55-.31s.18-.31.55-.31c1.28,0,2.06-.42,2.34-1.26.28-.84.48-1.99.61-3.44.03-.33.14-.49.34-.49s.29.16.29.49v4.6h3.34c.4,0,.6.12.59.36,0,.24-.2.35-.59.35h-3.34v8.18c0,.64.13,1.15.4,1.53.26.38.76.58,1.5.58.8,0,1.34-.42,1.63-1.25.29-.83.44-1.53.46-2.11,0-.33.13-.5.38-.53Z"/> </g> <g> <path fill="#fff" d="M134.08,152.68c-.11.02-.19,0-.24-.06-.05-.06-.07-.15-.07-.28v-2.5c-.3.78-.87,1.49-1.7,2.12-.83.63-1.73.94-2.69.94-1.25,0-2.22-.43-2.92-1.29-.7-.86-1.04-1.9-1.04-3.12v-5.88c0-.55-.1-.89-.3-.99-.2-.11-.75-.16-1.64-.16-.37,0-.55-.1-.55-.29s.18-.3.55-.32l2.93-.22c.1-.02.16,0,.2.06.04.06.06.15.06.28v7.59c0,1.08.31,1.9.94,2.47.62.57,1.34.86,2.16.86,1.15,0,2.1-.49,2.84-1.47.74-.98,1.12-1.92,1.12-2.82v-4.97c0-.55-.1-.89-.3-.99-.2-.11-.75-.16-1.64-.16-.37,0-.55-.1-.55-.29s.18-.3.55-.32l2.9-.22c.11-.02.19,0,.23.06.04.06.06.15.06.28v9.72c0,.52.1.84.29.94.19.11.76.16,1.7.16.37,0,.55.1.55.29s-.18.31-.55.34l-2.88.22Z"/> <path fill="#fff" d="M150.39,151.15c.08.03.1.1.05.2-.18.39-.48.71-.91.94-.43.24-.83.34-1.2.31-.53-.05-.94-.28-1.22-.69s-.46-.91-.5-1.52c-.58.72-1.34,1.31-2.28,1.79-.94.47-1.96.71-3.05.71-.96,0-1.81-.24-2.56-.72-.74-.48-1.12-1.24-1.12-2.29,0-1.81,1.2-3.03,3.59-3.65,2.39-.62,4.21-.94,5.46-.96v-2.01c0-.82-.36-1.4-1.09-1.74-.73-.34-1.59-.51-2.58-.51-.46,0-.99.08-1.57.23-.58.15-1,.4-1.24.75-.11.16-.16.3-.13.42.02.11.11.24.25.37.13.11.25.23.36.34.11.11.16.28.14.49-.02.38-.14.65-.37.83s-.52.27-.85.27c-.37,0-.66-.13-.89-.38-.22-.25-.34-.56-.34-.92,0-.52.2-1,.61-1.42.41-.42.84-.74,1.28-.93.54-.24,1.08-.42,1.6-.53.52-.11,1.08-.15,1.67-.13,1.78.05,2.95.43,3.53,1.15.58.72.86,1.62.86,2.69v6.07c0,.88.27,1.35.82,1.4.54.05,1.02-.11,1.42-.49.1-.08.18-.11.26-.07ZM146.55,148.59c.06-.61.1-1.51.1-2.71-1.22.07-2.8.34-4.75.83s-2.93,1.48-2.93,2.96c0,.8.26,1.39.77,1.76.51.38,1.21.56,2.09.56.82,0,1.58-.16,2.28-.48.7-.32,1.25-.71,1.63-1.16.48-.57.75-1.16.82-1.78Z"/> </g> <g> <path fill="#fff" d="M151.08,152.46c-.4,0-.6-.11-.6-.32s.2-.32.6-.32c.9,0,1.43-.09,1.61-.26.18-.17.26-.66.26-1.46v-13.62c0-.54-.1-.86-.31-.97-.21-.11-.76-.16-1.66-.16-.37,0-.55-.1-.55-.31s.18-.31.55-.33l2.93-.22c.11-.02.19,0,.23.06s.06.15.06.28v15.18c0,.85.09,1.36.28,1.53.18.17.76.26,1.72.26.37,0,.55.11.55.32s-.18.32-.55.32h-5.11Z"/> <path fill="#fff" d="M180.24,152.98c.21.02.32.15.34.39.03,1.03-.24,1.91-.83,2.63-.58.73-1.34,1.06-2.27.99-1.23-.08-2.05-.64-2.45-1.67-.4-1.03-.63-2.01-.7-2.94-.4.15-.84.26-1.31.34-.47.08-.93.12-1.38.12-2.46,0-4.5-.93-6.12-2.79-1.62-1.86-2.42-4.01-2.42-6.44s.81-4.66,2.42-6.5c1.62-1.84,3.66-2.76,6.12-2.76s4.5.92,6.12,2.76c1.62,1.84,2.42,4,2.42,6.5,0,1.67-.4,3.24-1.21,4.73-.81,1.49-1.93,2.64-3.37,3.45.06,1,.26,1.93.59,2.79.33.86.93,1.3,1.81,1.3.72,0,1.21-.31,1.48-.92.26-.61.4-1.15.42-1.6.02-.28.13-.41.34-.39ZM177.58,148.55c.75-1.04,1.13-2.69,1.13-4.92,0-2.35-.62-4.35-1.86-5.99-1.24-1.64-2.97-2.46-5.19-2.46s-3.91.82-5.16,2.47c-1.25,1.65-1.87,3.64-1.87,5.98,0,1.81.34,3.31,1.02,4.49.68,1.18,1.46,2.11,2.34,2.78-.18-1.18.07-2.25.73-3.22.66-.97,1.57-1.46,2.72-1.46,1.22,0,2.15.42,2.81,1.27.66.85,1.09,1.96,1.3,3.33.61-.47,1.29-1.23,2.04-2.28ZM173.06,151.94c.47-.11.89-.24,1.26-.4-.06-1.32-.29-2.41-.67-3.27-.38-.86-1.18-1.29-2.38-1.29-.67,0-1.22.28-1.66.83-.43.55-.66,1.16-.7,1.81-.02.42-.02.8,0,1.14.02.33.03.58.05.72.38.16.81.31,1.27.43.46.12.94.18,1.42.18s.93-.05,1.4-.16Z"/> </g> <g> <path fill="#fff" d="M192.06,152.68c-.11.02-.19,0-.24-.06-.05-.06-.07-.15-.07-.28v-2.5c-.3.78-.87,1.49-1.7,2.12-.83.63-1.73.94-2.69.94-1.25,0-2.22-.43-2.92-1.29-.7-.86-1.04-1.9-1.04-3.12v-5.88c0-.55-.1-.89-.3-.99-.2-.11-.75-.16-1.64-.16-.37,0-.55-.1-.55-.29s.18-.3.55-.32l2.93-.22c.1-.02.16,0,.2.06.04.06.06.15.06.28v7.59c0,1.08.31,1.9.94,2.47.62.57,1.34.86,2.16.86,1.15,0,2.1-.49,2.84-1.47.74-.98,1.12-1.92,1.12-2.82v-4.97c0-.55-.1-.89-.3-.99-.2-.11-.75-.16-1.64-.16-.37,0-.55-.1-.55-.29s.18-.3.55-.32l2.9-.22c.11-.02.19,0,.23.06.04.06.06.15.06.28v9.72c0,.52.1.84.29.94.19.11.76.16,1.7.16.37,0,.55.1.55.29s-.18.31-.55.34l-2.88.22Z"/> <path fill="#fff" d="M205.4,142.25c1.06,1.22,1.6,2.7,1.6,4.43s-.53,3.18-1.6,4.4c-1.06,1.22-2.5,1.82-4.31,1.82s-3.22-.61-4.28-1.82c-1.06-1.22-1.6-2.68-1.6-4.4s.53-3.21,1.6-4.43c1.06-1.22,2.49-1.84,4.28-1.84s3.24.61,4.31,1.84ZM204.53,150.53c.7-1.13,1.06-2.41,1.06-3.85s-.35-2.78-1.06-3.89c-.7-1.11-1.85-1.67-3.43-1.67s-2.71.56-3.42,1.68c-.71,1.12-1.07,2.41-1.07,3.88s.36,2.72,1.07,3.85c.71,1.13,1.85,1.69,3.42,1.69s2.73-.56,3.43-1.69Z"/> </g> <g> <path fill="#fff" d="M215.45,148.15c.26-.02.38.13.38.45,0,1-.25,1.96-.76,2.9-.5.94-1.39,1.41-2.65,1.41-.74,0-1.35-.26-1.85-.77-.5-.51-.74-1.17-.74-1.97v-8.42h-2.33c-.37,0-.55-.1-.55-.31s.18-.31.55-.31c1.28,0,2.06-.42,2.34-1.26.28-.84.48-1.99.61-3.44.03-.33.14-.49.34-.49s.29.16.29.49v4.6h3.34c.4,0,.6.12.59.36,0,.24-.2.35-.59.35h-3.34v8.18c0,.64.13,1.15.4,1.53.26.38.76.58,1.5.58.8,0,1.34-.42,1.63-1.25.29-.83.44-1.53.46-2.11,0-.33.13-.5.38-.53Z"/> <path fill="#fff" d="M216.72,152.45c-.4,0-.6-.11-.6-.32s.2-.32.6-.32c.9,0,1.43-.09,1.61-.26.18-.17.26-.66.26-1.46v-7.45c0-.55-.1-.89-.31-.99-.21-.11-.76-.16-1.66-.16-.37,0-.55-.1-.55-.29s.18-.3.55-.32l2.93-.22c.11-.02.19,0,.23.06.04.06.06.15.06.28v9.01c0,.85.09,1.36.28,1.53.18.17.76.26,1.72.26.37,0,.55.11.55.32s-.18.32-.55.32h-5.11ZM219.86,135.15c.22.22.34.49.34.82s-.11.58-.34.8c-.22.22-.5.33-.82.33-.34,0-.62-.11-.84-.33-.22-.22-.34-.49-.34-.8,0-.33.11-.6.34-.82.22-.22.5-.33.84-.33s.59.11.82.33Z"/> </g> <g> <path fill="#fff" d="M232,142.28c.85,1.24,1.3,2.56,1.37,3.97.02.16.01.3-.01.4-.02.11-.12.16-.28.16h-9.43c0,1.68.42,3,1.27,3.95.85.96,2.1,1.4,3.74,1.33,1.01-.03,1.86-.35,2.54-.94.69-.6,1.17-1.2,1.44-1.82.13-.26.3-.33.52-.22.22.11.27.29.16.51-.45.98-1.09,1.77-1.92,2.38-.83.6-1.95.91-3.36.91-1.71,0-3.1-.58-4.16-1.74-1.06-1.16-1.6-2.56-1.6-4.21,0-1.73.52-3.25,1.55-4.57,1.03-1.31,2.45-1.97,4.26-1.97s3.06.62,3.91,1.86ZM231.73,145.91c.1-.12.16-.38.16-.77,0-.96-.31-1.88-.94-2.74-.62-.87-1.6-1.3-2.93-1.3-1.47,0-2.54.54-3.22,1.63-.67,1.09-1.04,2.21-1.1,3.37h7.22c.43,0,.7-.06.8-.18Z"/> <path fill="#fff" d="M242.43,152.44c-.4,0-.6-.11-.6-.32s.2-.32.6-.32c.9,0,1.44-.09,1.62-.26.18-.17.28-.66.28-1.46v-5.36c0-1.06-.29-1.91-.88-2.55-.58-.64-1.3-.96-2.15-.96-1.15,0-2.11.52-2.88,1.56-.77,1.04-1.15,2.01-1.15,2.93v4.31c0,.85.09,1.36.28,1.53.18.17.76.26,1.72.26.38,0,.58.11.58.32s-.19.32-.58.32h-5.11c-.4,0-.6-.11-.6-.32s.2-.32.6-.32c.9,0,1.43-.09,1.61-.26.18-.17.26-.66.26-1.46v-7.47c0-.55-.1-.89-.3-.99-.2-.11-.75-.16-1.64-.16-.38,0-.58-.1-.58-.29s.19-.3.58-.32l2.9-.22c.11-.02.19,0,.23.06.04.06.06.15.06.28v2.47c.35-.77.92-1.46,1.7-2.09.78-.63,1.64-.94,2.57-.94,1.25,0,2.23.44,2.95,1.32.72.88,1.08,1.94,1.08,3.18v5.09c0,.85.1,1.36.29,1.53.19.17.75.26,1.68.26.38,0,.58.11.58.32s-.19.32-.58.32h-5.11Z"/> </g> <g> <path fill="#fff" d="M255.76,148.15c.26-.02.38.13.38.45,0,1-.25,1.96-.76,2.9-.5.94-1.39,1.41-2.65,1.41-.74,0-1.35-.26-1.85-.77-.5-.51-.74-1.17-.74-1.97v-8.42h-2.33c-.37,0-.55-.1-.55-.31s.18-.31.55-.31c1.28,0,2.06-.42,2.34-1.26.28-.84.48-1.99.61-3.44.03-.33.14-.49.34-.49s.29.16.29.49v4.6h3.34c.4,0,.6.12.59.36,0,.24-.2.35-.59.35h-3.34v8.18c0,.64.13,1.15.4,1.53.26.38.76.58,1.5.58.8,0,1.34-.42,1.63-1.25.29-.83.44-1.53.46-2.11,0-.33.13-.5.38-.53Z"/> <path fill="#fff" d="M277.76,140.62c.02.26-.08.41-.29.44-.21.03-.33-.1-.36-.39-.3-2.53-.72-4.05-1.24-4.55-.52-.51-1.73-.76-3.64-.76-.69,0-1.12.05-1.28.16s-.25.39-.25.84v13.52c0,.95.12,1.5.35,1.65.23.15.93.23,2.1.23.4,0,.6.11.61.33s-.2.33-.61.33h-6.14c-.4,0-.6-.11-.6-.33s.2-.33.6-.33c1.18,0,1.89-.08,2.11-.23.22-.16.34-.71.34-1.65v-13.52c0-.46-.08-.74-.24-.84s-.58-.16-1.27-.16c-1.89,0-3.1.25-3.64.76-.54.51-.95,2.02-1.24,4.55-.03.29-.16.43-.37.39-.22-.03-.32-.18-.3-.44l.29-5.46c.03-.18.09-.29.17-.34.08-.05.2-.07.36-.07h13.75c.18,0,.3.02.38.07.08.05.13.16.14.34l.26,5.46Z"/> </g> <g> <path fill="#fff" d="M287.18,142.28c.85,1.24,1.3,2.56,1.37,3.97.02.16.01.3-.01.4-.02.11-.12.16-.28.16h-9.43c0,1.68.42,3,1.27,3.95.85.96,2.1,1.4,3.74,1.33,1.01-.03,1.86-.35,2.54-.94.69-.6,1.17-1.2,1.44-1.82.13-.26.3-.33.52-.22.22.11.27.29.16.51-.45.98-1.09,1.77-1.92,2.38-.83.6-1.95.91-3.36.91-1.71,0-3.1-.58-4.16-1.74-1.06-1.16-1.6-2.56-1.6-4.21,0-1.73.52-3.25,1.55-4.57,1.03-1.31,2.45-1.97,4.26-1.97s3.06.62,3.91,1.86ZM286.91,145.91c.1-.12.16-.38.16-.77,0-.96-.31-1.88-.94-2.74-.62-.87-1.6-1.3-2.93-1.3-1.47,0-2.54.54-3.22,1.63-.67,1.09-1.04,2.21-1.1,3.37h7.22c.43,0,.7-.06.8-.18Z"/> <path fill="#fff" d="M299.1,148.06c.21.33.31.75.31,1.27,0,1.09-.43,1.96-1.28,2.61-.86.64-1.9.97-3.13.97-.77,0-1.55-.16-2.35-.47-.8-.31-1.47-.69-2.02-1.15l-.55,1.27c-.1.21-.22.33-.38.36-.16.02-.24-.09-.24-.36v-4.29c0-.24.07-.36.22-.35.14,0,.25.13.31.35.35,1.14.95,2.09,1.8,2.83.85.74,1.95,1.11,3.31,1.11.72,0,1.42-.22,2.09-.65.67-.43,1.01-1.03,1.01-1.8,0-1.18-.54-1.92-1.62-2.23-1.08-.31-2.36-.63-3.83-.95-.83-.18-1.56-.5-2.18-.97-.62-.47-.94-1.11-.94-1.95,0-1.01.39-1.81,1.16-2.39.78-.58,1.71-.87,2.8-.87.62,0,1.29.11,2,.33.71.22,1.3.62,1.76,1.21l.58-1.2c.11-.23.24-.34.37-.34s.2.14.2.42v3.5c0,.25-.08.37-.23.37s-.28-.11-.37-.32c-.35-.91-.85-1.69-1.49-2.33-.64-.64-1.58-.96-2.81-.96-.78,0-1.46.18-2.03.55-.57.37-.85.89-.85,1.58,0,.91.35,1.54,1.06,1.89.7.34,1.39.58,2.06.71.74.16,1.55.34,2.45.53.9.19,1.57.47,2.02.85.32.25.58.53.79.86Z"/> <path fill="#fff" d="M308.21,148.15c.26-.02.38.13.38.45,0,1-.25,1.96-.76,2.9-.5.94-1.39,1.41-2.65,1.41-.74,0-1.35-.26-1.85-.77-.5-.51-.74-1.17-.74-1.97v-8.42h-2.33c-.37,0-.55-.1-.55-.31s.18-.31.55-.31c1.28,0,2.06-.42,2.34-1.26.28-.84.48-1.99.61-3.44.03-.33.14-.49.34-.49s.29.16.29.49v4.6h3.34c.4,0,.6.12.59.36,0,.24-.2.35-.59.35h-3.34v8.18c0,.64.13,1.15.4,1.53.26.38.76.58,1.5.58.8,0,1.34-.42,1.63-1.25.29-.83.44-1.53.46-2.11,0-.33.13-.5.38-.53Z"/> </g></svg>'
    +'<div style="padding-left:4px;color:#F5C518;font-size:32px;font-weight:400;letter-spacing:-0.05em;font-family:\'S-CoreDream\',\'Noto Sans KR\',sans-serif;white-space:nowrap;display:flex;align-items:center">문자정보 처리역량 테스트</div>'
    +'</div>'
    +'<div style="text-align:right">'
    +'<div style="color:white;font-weight:400;font-size:18px;white-space:nowrap"><span style="font-size:13px">'+RPT_lvLabel+'</span>&nbsp;&nbsp;<span style="font-size:26px">'+D.name+'</span></div>'
    +'<div style="margin-top:4px"><span style="background:#888;border-radius:4px;padding:2px 8px;color:#fff;font-size:13px;white-space:nowrap">진단일 : '+RPT_dateStr+'</span></div>'
    +'</div></div>'

    // 본문
    +'<div style="flex:1;padding:20px 24px;display:grid;grid-template-rows:1fr auto 1fr;gap:0;min-height:0;overflow:hidden">'

    // 상단 3열
    +'<div style="display:grid;grid-template-columns:40fr 30fr 30fr;gap:8px">'

    // 열1
    +'<div style="padding-right:20px;display:flex;flex-direction:column;align-items:center">'
    +'<div style="margin-bottom:20px;width:100%;display:flex;flex-direction:column;align-items:center;padding-top:20px">'
    +'<div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:33px;font-weight:400;color:#475569;letter-spacing:-0.04em">독해정확도</span><span style="font-size:16px;color:#666;font-weight:400">(%)</span></div>'
    +'<div style="font-size:128px;font-weight:900;color:'+accColor+';line-height:1;margin-top:-4px;font-family:Tahoma,sans-serif">'+avgAcc+'</div>'
    +'<div style="margin-top:8px;width:calc(97% - 30px)">'
    +'<div style="display:flex;justify-content:space-between;margin-bottom:3px">'
    +'<span style="font-size:11px;color:#64748B">사실적 이해</span>'
    +'<span style="font-size:11px;color:#64748B">구조적 이해</span>'
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:5px">'
    +'<span style="font-size:18px;font-weight:700;color:#3B82F6;font-family:Tahoma,sans-serif;min-width:24px;text-align:right">'+factual+'</span>'
    +'<div style="flex:1;display:flex;height:8px;border-radius:4px;overflow:hidden;background:#E2E8F0">'
    +'<div style="flex:1;display:flex;justify-content:flex-end"><div style="width:'+factual+'%;background:#3B82F6;height:100%;border-radius:4px 0 0 4px"></div></div>'
    +'<div style="width:2px;background:#fff;flex-shrink:0"></div>'
    +'<div style="flex:1;display:flex;justify-content:flex-start"><div style="width:'+structural+'%;background:#84CC16;height:100%;border-radius:0 4px 4px 0"></div></div>'
    +'</div>'
    +'<span style="font-size:18px;font-weight:700;color:#84CC16;font-family:Tahoma,sans-serif;min-width:24px;text-align:left">'+structural+'</span>'
    +'</div>'
    +'</div></div>'
    +'<div style="width:100%;display:flex;flex-direction:column;align-items:center">'
    +'<div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:33px;font-weight:400;color:#475569;letter-spacing:-0.04em">독해속도</span><span style="font-size:16px;color:#666;font-weight:400">(자/분)</span></div>'
    +'<div style="font-size:92px;font-weight:900;color:#1E293B;line-height:1;margin-top:-4px;font-family:Tahoma,sans-serif">'+Number(D.spd).toLocaleString()+'</div>'
    +'</div></div>'

    // 열2
    +'<div style="display:flex;flex-direction:column;padding-top:50px;width:max-content;transform:scaleX(0.95);transform-origin:left center;letter-spacing:-0.03em;padding-left:30px">'
    +'<div style="margin-bottom:8px"><span style="font-size:23px;font-weight:400;color:#1E293B;letter-spacing:-0.04em;display:inline-block;font-family:\'S-CoreDream\',\'Noto Sans KR\',sans-serif;">독해습관</span></div>'
    +habitRows
    +'<div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center"><div style="display:inline-flex;align-items:center;width:100%;border-top:3px solid #1E293B;padding-top:6px;">'
    +'<span style="color:#1E293B;font-size:15px">잘못된 독해습관</span><span style="margin-left:auto;color:#EF4444;font-size:28px;font-weight:400;font-family:Tahoma,sans-serif">'+habitCount+'</span></div></div></div>'

    // 열3
    +'<div style="display:flex;flex-direction:column;padding-top:50px;width:max-content;transform:scaleX(0.95);transform-origin:left center;letter-spacing:-0.03em;padding-left:30px">'
    +'<div style="margin-bottom:8px"><span style="font-size:23px;font-weight:400;color:#1E293B;letter-spacing:-0.04em;display:inline-block;font-family:\'S-CoreDream\',\'Noto Sans KR\',sans-serif;">독해효율성</span></div>'
    +effRows
    +'<div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center"><div style="display:inline-flex;align-items:center;width:100%;border-top:3px solid #1E293B;padding-top:6px;">'
    +'<span style="color:#1E293B;font-size:15px">독해효율성 결합증상</span><span style="margin-left:auto;color:#EF4444;font-size:28px;font-weight:400;font-family:Tahoma,sans-serif">'+effCount+'</span></div></div></div>'
    +'</div>'

    // 구분선
    +'<div style="border-top:1px dashed #CBD5E1;margin:12px 0"></div>'

    // 하단: 차트 + 요인분석
    +'<div style="display:grid;grid-template-columns:45fr 55fr;gap:20px;align-items:start">'
    +'<div style="display:flex;flex-direction:column;align-items:center;padding-top:50px">'+buildPolar(FACTORS,317)+'</div>'
    +'<div style="padding-right:20px;padding-top:30px;padding-left:25px">'
    +'<div style="font-size:23px;font-weight:400;color:#1E293B;letter-spacing:-0.04em;margin-bottom:12px;margin-left:20px;margin-top:20px">독해역량 요인분석</div>'
    +factorRows
    +'</div></div>'
    +'</div>'

    // 푸터
    +buildFooter(1, TOTAL);

  return div;
}

// ══════════════════════════
// ══════════════════════════
// 페이지 2~3 — 2슬롯 1페이지
// ══════════════════════════
function buildSlotBlock(i) {
  var slotColor = RPT_SC[i-1];
  var txt = D.slots["slot"+i] || "";
  var lightBg = ["#EFF6FF","#F0FDF4","#FFFBEB","#FAF5FF"][i-1] || "#F8FAFC";
  var iconBg = ["#DBEAFE","#DCFCE7","#FEF3C7","#F3E8FF"][i-1] || "#E2E8F0";

  var M = '72px';
  return ''
    +'<div style="padding:0 '+M+' 8px '+M+';flex-shrink:0;display:flex;align-items:center;gap:14px;">'
    +'<div style="width:38px;height:38px;border-radius:50%;background:'+slotColor+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    +'<span style="font-size:16px;font-weight:700;color:#fff;font-family:\'Noto Sans KR\',sans-serif;">'+i+'</span>'
    +'</div>'
    +'<div>'
    +'<div style="font-size:10px;color:#94A3B8;letter-spacing:1.5px;font-family:\'Noto Sans KR\',sans-serif;margin-bottom:2px;">'+RPT_SLOT_DESC[i-1]+'</div>'
    +'<div style="font-size:20px;font-weight:600;color:#1A2332;letter-spacing:-.5px;font-family:\'Noto Sans KR\',sans-serif;">'+D.name+' 학생'+RPT_SLOT_JOSA[i-1]+' '+RPT_SLOT_T[i-1]+'</div>'
    +'</div>'
    +'</div>'
    +'<div style="flex:1;min-height:0;margin:0 '+M+';background:'+lightBg+';border-radius:8px;padding:24px 30px 24px 34px;position:relative;overflow:hidden;">'
    +'<div style="position:absolute;top:0;left:0;width:4px;height:100%;background:'+slotColor+';border-radius:4px 0 0 4px;"></div>'
    +'<div style="position:absolute;bottom:10px;right:14px;font-size:52px;color:'+slotColor+';opacity:.05;font-family:\'Noto Serif KR\',serif;line-height:1;pointer-events:none;font-weight:700;">'+i+'</div>'
    +'<div style="font-size:15px;line-height:2.05;color:#1E293B;word-break:keep-all;letter-spacing:-.02em;font-family:\'Noto Serif KR\',serif;font-weight:400;white-space:pre-wrap;">'
    +(txt||'<span style="color:#8E9BB0;font-size:13px;font-family:\'Noto Sans KR\',sans-serif;">판독문이 생성되지 않았습니다.</span>')
    +'</div>'
    +'</div>';
}

function buildDualSlotPage(a, b, pageNum, total) {
  var RPT_lvLabel = (lvMap[D.level]||D.level||"")+(D.grade?" "+D.grade+"학년":"");
  var RPT_dateStr = (function(){ var d=new Date(); return d.getFullYear()+"년 "+(d.getMonth()+1)+"월 "+d.getDate()+"일"; })();
  var div = document.createElement('div');
  div.className = 'page';
  div.innerHTML =
    // 페이지 본문: flex-column으로 슬롯A/B 균등 분배
    '<div style="flex:1;display:flex;flex-direction:column;min-height:0;background:#fff;">'

    // 상단 여백
    +'<div style="height:40px;flex-shrink:0;"></div>'

    // 슬롯 A — flex:1로 균등 분배
    +'<div style="flex:1;min-height:0;display:flex;flex-direction:column;">'
    +buildSlotBlock(a)
    +'</div>'

    // 슬롯 간 여백
    +'<div style="height:16px;flex-shrink:0;"></div>'

    // 슬롯 B — flex:1로 균등 분배
    +'<div style="flex:1;min-height:0;display:flex;flex-direction:column;">'
    +buildSlotBlock(b)
    +'</div>'

    // 날짜 영역 — 슬롯 밖, 하단 고정
    +'<div style="padding:10px 72px 16px;flex-shrink:0;">'
    +'<p style="font-size:11.5px;color:#94A3B8;font-family:\'Noto Sans KR\',sans-serif;margin:0;text-align:center;">'+D.name+' '+RPT_lvLabel+' - '+RPT_dateStr+' 검사</p>'
    +'</div>'

    +'</div>'
    +buildFooter(pageNum, total);
  return div;
}

// ══════════════════════════
// 마지막 페이지 — 훈련 로드맵
// ══════════════════════════

// ── 코스 패키지 정의 (PDF 확정본 기준) ──
var COURSES = {
  PK06_1: { name:"초급0", code:"PK06-1", steps:["비문학독서클럽","초급예비과정","초급기본과정"] },
  PK06:   { name:"초급1", code:"PK06",   steps:["초급예비과정","초급기본과정","초급심화과정"] },
  PK07:   { name:"초급2", code:"PK07",   steps:["초급예비과정","초급심화과정","중급기본과정"] },
  PK08:   { name:"중급1", code:"PK08",   steps:["중급예비과정","중급기본과정","중급심화과정"] },
  PK09:   { name:"중급2", code:"PK09",   steps:["중급심화과정","고급기본과정","고급심화과정"] },
  PK10:   { name:"고급1", code:"PK10",   steps:["고급기본과정","고급심화과정"] }
};

// ── 학년·수준별 코스 추천 함수 ──
function recommendCourse(level, grade, acc, kor) {
  var SMAP = {"90점 이상":90,"80~89점":80,"70~79점":70,"60~69점":60,"60점 미만":50,
              "1등급":90,"2등급":80,"3등급":70,"4등급":60,"5등급 이하":50,
              "매우잘함":90,"잘함":80,"보통":70,"노력요함":50,"-":null};
  var kv = SMAP[kor] !== undefined ? SMAP[kor] : null;

  // PDF 확정본 기준: TQ정확도 + 학교성적 교차로 수준 판별
  // 초등: TQ만 사용
  // 중등: TQ 하(~30) = 하 / TQ 중(40~70) = 중 / TQ 상(80~) = 상
  // 고등: 성적 5등급이하 = 하 / 3~4등급 = 중 / 2등급이상 = 상
  function getLev(a, kv, lv, gr) {
    if (lv === "초등") return a <= 30 ? "하" : a <= 70 ? "중" : "상";
    if (lv === "중등") return a <= 39 ? "하" : a <= 79 ? "중" : "상";
    if (lv === "고등") {
      if (kv === null) return a <= 39 ? "하" : a <= 79 ? "중" : "상";
      return kv <= 50 ? "하" : kv < 90 ? "중" : "상";
    }
    return "중";
  }
  var lev = getLev(acc, kv, level, grade);

  if (level === "초등") {
    if (grade <= 3) return "PK06_1";                                    // 초3 이하 전체
    if (grade === 4) return lev === "상" ? "PK06" : "PK06_1";           // 초4: 상=초급1, 하/중=초급0
    if (grade === 5) return lev === "상" ? "PK07" : "PK06";             // 초5: 상=초급2, 하/중=초급1
    if (grade === 6) return lev === "상" ? "PK08" : "PK07";             // 초6: 상=중급1, 하/중=초급2
  }
  if (level === "중등") {
    if (grade === 1) {
      if (lev === "하") return "PK07";
      if (lev === "중") return "PK08";
      return "PK09";
    }
    // 중2~3
    if (lev === "하") return "PK08";
    if (lev === "중") return "PK09";
    return "PK10";
  }
  if (level === "고등") {
    if (lev === "하") return "PK09";
    return "PK10";
  }
  return "PK08";
}

var ALL_PROGRAMS = [
  { key:"비문학독서클럽", label1:"비문학독서클럽",
    goal:"환경·과학·역사·사회 등 6개 비문학 분야의 지문을 읽고 핵심 내용을 파악하는 독서 훈련. 배경지식과 어휘력의 기초를 동시에 형성하여 본격 독해 훈련의 토대를 만듭니다.",
    sessions:50, period:"2개월",
    reasonFn: function(d){
      var r=[];
      if(d.voc<50) r.push("어휘력이 부족하여 비문학 지문에서 낯선 단어에 막히는 현상이 반복되고 있습니다.");
      if(d.effChecked&&d.effChecked.indexOf("비문학 책은 어렵게 느껴진다")>-1) r.push("비문학 글을 어렵게 느끼는 상태로, 다양한 분야의 읽기 경험을 먼저 쌓는 것이 필요합니다.");
      if(d.effChecked&&d.effChecked.indexOf("독서량이 많이 부족한 편이다")>-1) r.push("독서량이 부족하여 읽기 자체에 대한 기초 체력이 부족한 상태입니다.");
      if(!r.length) r.push("독해 훈련 전 비문학 분야의 독서 경험을 쌓아 어휘와 배경지식의 기반을 형성합니다.");
      return r.join(" ");
    }
  },
  { key:"초급예비과정", label1:"초급예비",
    goal:"독해 훈련에 앞서 워킹메모리 용량을 집중 향상하는 준비 과정. 정보를 읽으면서 동시에 기억·처리하는 능력을 키워 본격 독해 훈련의 효과를 높입니다.",
    sessions:60, period:"3~5개월",
    reasonFn: function(d){
      var r=[];
      if(d.wm<50) r.push("워킹메모리가 부족하여 읽은 내용이 바로 휘발되는 상태입니다. 이 상태에서 독해 훈련을 시작하면 효과가 반감되므로 워킹메모리 향상 훈련이 선행되어야 합니다.");
      if(d.habChecked&&(d.habChecked.indexOf("긴 문장은 이해하기 잘 안됨")>-1||d.habChecked.indexOf("긴 글은 내용 기억이 잘 안됨")>-1)) r.push("긴 문장을 읽을 때 앞 내용이 기억나지 않는 현상이 나타나고 있어 워킹메모리 확장 훈련이 먼저 필요합니다.");
      if(!r.length) r.push("독해 훈련의 효과를 극대화하기 위해 워킹메모리 기초 역량을 먼저 확보합니다.");
      return r.join(" ");
    }
  },
  { key:"초급기본과정", label1:"초급기본",
    goal:"사실적 이해와 구조적 이해를 균형 있게 훈련하는 초급 독해 핵심 과정. 글의 세부 정보를 정확히 파악하고 전체 흐름을 파악하는 능력을 동시에 형성합니다.",
    sessions:60, period:"3~5개월",
    reasonFn: function(d){
      var r=[];
      var avg=Math.round(((d.fct||d.acc)+(d.str_||d.acc))/2);
      if(avg<50) r.push("독해 정확도가 기준에 미치지 못해 글을 읽어도 내용을 정확히 파악하지 못하는 상태입니다. 기초 독해 정확도 훈련이 가장 시급합니다.");
      if(d.habChecked&&d.habChecked.indexOf("읽다가 글줄을 자주 놓침")>-1) r.push("읽는 중 글줄을 놓치는 습관이 있어 체계적인 읽기 방식 훈련이 필요합니다.");
      if(!r.length) r.push("독해 정확도를 체계적으로 높여 안정적인 독해 기반을 형성합니다.");
      return r.join(" ");
    }
  },
  { key:"초급심화과정", label1:"초급심화",
    goal:"초급 수준의 독해 속도와 정확도를 통합적으로 높이는 심화 과정. 다양한 비문학 주제 지문을 빠르고 정확하게 처리하는 능력을 완성합니다.",
    sessions:60, period:"3~5개월",
    reasonFn: function(d){ return "초급기본과정에서 형성한 독해 정확도를 속도와 결합하여 실전 독해 능력으로 완성하는 단계입니다. 비문학 지문의 핵심 정보를 빠르게 처리하는 훈련이 본격화됩니다."; }
  },
  { key:"중급예비과정", label1:"중급예비",
    goal:"중급 독해 훈련 진입 전 워킹메모리를 중급 수준으로 향상하는 준비 과정. 중학 교과 수준의 복잡한 지문을 처리할 수 있는 인지 기반을 마련합니다.",
    sessions:60, period:"3~5개월",
    reasonFn: function(d){ return "중급 독해 지문은 정보 밀도가 높아 워킹메모리가 충분하지 않으면 훈련 효과가 제한됩니다. 중급 과정 진입 전 워킹메모리를 집중적으로 강화합니다."; }
  },
  { key:"중급기본과정", label1:"중급기본",
    goal:"중학 교과 수준 지문의 사실적·구조적 이해와 추론능력을 통합 훈련하는 핵심 과정. 논리적 읽기 능력과 글의 의도 파악 능력을 형성합니다.",
    sessions:60, period:"3~5개월",
    reasonFn: function(d){
      var r=[];
      if(d.inf<50) r.push("추론능력이 충분히 발달하지 않아 글의 논리적 흐름과 의도를 파악하는 데 어려움이 있습니다.");
      r.push("중학 수준의 비문학 지문을 정확하고 빠르게 읽는 능력을 훈련하며, 추론능력과 어휘력을 통합적으로 강화합니다.");
      return r.join(" ");
    }
  },
  { key:"중급심화과정", label1:"중급심화",
    goal:"중급 수준의 속도·정확도·추론을 통합하는 심화 과정. 고등 수준 독해 진입을 위한 교량 역할을 합니다.",
    sessions:60, period:"3~5개월",
    reasonFn: function(d){ return "중급 독해 역량을 완성하고 고등 수준 지문 처리를 위한 고급 추론 능력을 준비하는 단계입니다."; }
  },
  { key:"고급기본과정", label1:"고급기본",
    goal:"고등 수준 지문의 논리적 구조 파악과 복합 추론을 훈련하는 과정. 수능형 비문학 독해의 기초를 완성합니다.",
    sessions:60, period:"3~5개월",
    reasonFn: function(d){ return "고난도 지문에서 필요한 논리적 사고력과 복합 추론 능력을 체계적으로 훈련합니다."; }
  },
  { key:"고급심화과정", label1:"고급심화",
    goal:"수능·고난도 비문학 지문을 제한 시간 내에 정확하게 독해하는 최종 완성 과정. 실전 시험 대응 능력을 극대화합니다.",
    sessions:60, period:"3~5개월",
    reasonFn: function(d){ return "수능 및 고난도 시험에서 비문학 지문을 빠르고 정확하게 처리하는 실전 능력을 완성합니다."; }
  }
];

// ── 코스 기반 presc 자동 생성 ──
function buildPrescFromCourse(courseCode) {
  var course = COURSES[courseCode];
  if (!course) return [];
  return course.steps.map(function(key, i){ return { p: i+1, c: key }; });
}

function buildLastPage(total, activeKeysOverride) {
  var ALL_KEYS = ALL_PROGRAMS.map(function(p){ return p.key; });
  var activeKeys;
  if (activeKeysOverride && activeKeysOverride.length > 0) {
    // applyEdit에서 직접 전달한 경우 우선 사용
    activeKeys = activeKeysOverride;
  } else {
    var prescKeys = (D.presc||[]).map(function(p){ return p.c; });
    var validPresc = prescKeys.filter(function(k){ return ALL_KEYS.indexOf(k) > -1; });
    if (validPresc.length > 0) {
      activeKeys = validPresc;
    } else {
      var recCode = recommendCourse(D.uiLevel||D.level, D.grade, D.acc, D.kor);
      activeKeys = buildPrescFromCourse(recCode).map(function(p){ return p.c; });
    }
  }

  // 모던 그라디언트 팔레트 — 활성 단계 공통 색 (진행감)
  var STEP_COLORS = [
    "#F47A20","#F5C518","#F5C518","#F5C518","#7CB342",
    "#7CB342","#7CB342","#4A90D9","#4A90D9"
  ];
  // 카드 배경 — 각 색의 극연 tint
  var STEP_BG = [
    "#FEF3EA","#FFFDE7","#FFFDE7","#FFFDE7","#F1F8E9",
    "#F1F8E9","#F1F8E9","#E3F2FD","#E3F2FD"
  ];

  var activePrograms = ALL_PROGRAMS.filter(function(p){
    return activeKeys.indexOf(p.key) > -1;
  });
  activePrograms.sort(function(a,b){
    return activeKeys.indexOf(a.key) - activeKeys.indexOf(b.key);
  });

  // 전체 과정은 ALL_PROGRAMS 순서 고정 (비문학독서클럽이 항상 맨 앞)
  var allSteps = ALL_PROGRAMS.slice();
  var n = allSteps.length;
  var actN = activePrograms.length;

  // 활성 노드의 색상 인덱스를 ALL_PROGRAMS 순서 기준으로 매핑
  // 색상은 ALL_PROGRAMS 절대 위치(k) 기준 — 과정명과 색상이 항상 1:1 매칭
  var activeColorMap = {};
  allSteps.forEach(function(step, k){
    if(activeKeys.indexOf(step.key) > -1){
      activeColorMap[step.key] = k;
    }
  });

  // ── 활성 구간 대표색 (마지막 활성 노드 색)
  var lastActiveIdx = -1;
  allSteps.forEach(function(step, k){ if(activeKeys.indexOf(step.key) > -1) lastActiveIdx = k; });
  var accentColor = lastActiveIdx >= 0 ? STEP_COLORS[activeColorMap[allSteps[lastActiveIdx].key]] : "#6366F1";

  // ── 로드맵 SVG — chevron 화살표 노드 ──
  // Roadmap SVG - chevron nodes
  var nw=57, nh=78, ntp=16, ngp=1;
  var cy3 = nh / 2;
  var svgW = n * nw + (n - 1) * (ntp + ngp);
  var svgH = nh + 8;
  var svgParts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+svgW+' '+svgH+'" width="100%" style="overflow:visible;display:block;">'];
  // 과정명에서 '과정' 제거 후 2글자씩 줄바꿈
  var NODE_LABELS = {
    '비문학독서클럽': ['독서','클럽'],
    '초급예비과정':   ['초급','예비'],
    '초급기본과정':   ['초급','기본'],
    '초급심화과정':   ['초급','심화'],
    '중급예비과정':   ['중급','예비'],
    '중급기본과정':   ['중급','기본'],
    '중급심화과정':   ['중급','심화'],
    '고급기본과정':   ['고급','기본'],
    '고급심화과정':   ['고급','심화']
  };
  allSteps.forEach(function(step, k){
    var isAct  = activeKeys.indexOf(step.key) > -1;
    var colIdx = activeColorMap[step.key] !== undefined ? activeColorMap[step.key] : 0;
    var col    = isAct ? (STEP_COLORS[colIdx] || '#F47A20') : '#D1D5DB';
    var isLast = (k === n - 1);
    var ox = k * (nw + ntp + ngp);
    var pts = isLast
      ? 'M '+ox+' 0 L '+(ox+nw+5)+' 0 L '+(ox+nw+5)+' '+nh+' L '+ox+' '+nh+' Z'
      : 'M '+ox+' 0 L '+(ox+nw)+' 0 L '+(ox+nw+ntp)+' '+cy3+' L '+(ox+nw)+' '+nh+' L '+ox+' '+nh+' Z';
    var DARK={'#F47A20':'#C85F00','#F5C518':'#C89B00','#7CB342':'#5A8A1E','#4A90D9':'#2B6BAD','#D1D5DB':'#C8D0DC'};
    var strokeCol = DARK[col] || col;
    var strokeAttr = ' stroke="'+strokeCol+'" stroke-width="1.5"';
    svgParts.push('<path d="'+pts+'" fill="'+(isAct ? col : '#F1F5F9')+'"'+strokeAttr+'/>');
    var tx = isLast ? ox + nw/2 : ox + nw/2 + ntp/2;
    var sp = NODE_LABELS[step.key] || ['??','??'];
    var txtFill = isAct ? '#fff' : '#C4CDD6';
    var fw = isAct ? '500' : '400';
    svgParts.push('<text x="'+(isLast ? tx+2 : tx-3)+'" y="'+(cy3-11.5)+'" text-anchor="middle" dominant-baseline="central" font-size="21" font-weight="'+fw+'" fill="'+txtFill+'" font-family="\'Noto Sans KR\',sans-serif">'+sp[0]+'</text>');
    svgParts.push('<text x="'+(isLast ? tx+2 : tx-3)+'" y="'+(cy3+9.5)+'" text-anchor="middle" dominant-baseline="central" font-size="21" font-weight="'+fw+'" fill="'+txtFill+'" font-family="\'Noto Sans KR\',sans-serif">'+sp[1]+'</text>');
  });
  svgParts.push('</svg>');
  var svgHtml = svgParts.join('');

  // Card block: 3개까지 풀카드, 4개 이상 간략 표시
  var detailCards = activePrograms.map(function(step, k){
    var absIdx = ALL_PROGRAMS.indexOf(step);
    var col = STEP_COLORS[absIdx >= 0 ? absIdx : k] || '#F47A20';
    if (k >= 3) {
      // 4번째 이상: 이름 + 기간만
      return '<div style="border:1px solid '+col+'55;background:#fff;padding:8px 16px 8px 18px;position:relative;display:flex;align-items:center;gap:10px;">'
        +'<div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:'+col+';"></div>'
        +'<span style="font-size:12px;font-weight:700;color:#64748B;font-family:Noto Sans KR,sans-serif;">'+(k+1)+'. '+(step.label1||step.key)+'</span>'
        +'<span style="margin-left:auto;font-size:11px;color:#94A3B8;white-space:nowrap;">'+step.sessions+'회 · '+step.period+'</span>'
        +'</div>';
    }
    var reason = (D.roadmapReasons && D.roadmapReasons[step.key]) ? D.roadmapReasons[step.key] : (typeof step.reasonFn === 'function' ? step.reasonFn(D) : (step.desc || ''));
    return '<div style="border:1px solid '+col+';background:#fff;padding:13px 20px 13px 18px;position:relative;">'
      +'<div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:'+col+';"></div>'
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px;">'
      +'<svg width="25" height="24" viewBox="0 0 25 24" style="flex-shrink:0;overflow:visible;">'
      +'<path d="M 0 0 L 17 0 L 25 12 L 17 24 L 0 24 Z" fill="'+col+'" stroke="'+(col==="#F5C518"?"#C89B00":col==="#F47A20"?"#C85F00":col==="#7CB342"?"#5A8A1E":col==="#4A90D9"?"#2B6BAD":"#C8D0DC")+'" stroke-width="1.2"/>'
      +'<text x="10" y="12" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="700" fill="#fff" font-family="Noto Sans KR,sans-serif">'+(k+1)+'</text>'
      +'</svg>'
      +'<span style="font-size:14px;font-weight:700;color:#1A2332;font-family:Noto Sans KR,sans-serif;letter-spacing:-.3px;">'+(step.label1||step.key)+'</span>'
      +'<span style="margin-left:auto;font-size:11px;color:'+(col==="#F5C518"?"#B8860B":col)+';padding:2px 10px;border:1px solid '+col+';font-family:Noto Sans KR,sans-serif;white-space:nowrap;font-weight:600;">'+step.sessions+'회 · '+step.period+'</span>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">'
      +'<div style="border-right:1px solid '+col+'15;padding-right:20px;">'
      +'<div style="font-size:10px;font-weight:700;color:'+(col==="#F5C518"?"#B8860B":col)+';letter-spacing:1.2px;margin-bottom:6px;font-family:Noto Sans KR,sans-serif;">훈련 목표</div>'
      +'<div style="font-size:12px;color:#374151;line-height:1.7;font-family:Noto Sans KR,sans-serif;word-break:keep-all;">'+(step.goal||step.desc)+'</div>'
      +'</div>'
      +'<div style="padding-left:4px;">'
      +'<div style="font-size:10px;font-weight:700;color:'+(col==="#F5C518"?"#B8860B":col)+';letter-spacing:1.2px;margin-bottom:6px;font-family:Noto Sans KR,sans-serif;">권장 이유</div>'
      +'<div style="font-size:12px;color:#475569;line-height:1.7;font-family:Noto Sans KR,sans-serif;word-break:keep-all;">'+reason+'</div>'
      +'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  var div = document.createElement('div');
  div.className = 'page';
  div.innerHTML =
    '<div style="background:#666666;border-bottom:2px solid '+accentColor+';padding:26px 72px 22px;flex-shrink:0;position:relative;overflow:hidden;">'
    +'<div style="font-size:9.5px;color:rgba(255,255,255,.55);letter-spacing:0.8px;margin-bottom:2px;font-family:\'Noto Sans KR\',sans-serif;">RECOMMENDED TRAINING ROADMAP</div>'
    +'<div style="font-size:31px;font-weight:700;color:#fff;letter-spacing:-.5px;font-family:\'Noto Sans KR\',sans-serif;">권장훈련 로드맵</div>'
    +'</div>'
    +'<div style="height:3px;background:linear-gradient(90deg,'+accentColor+' 0%,'+STEP_COLORS[0]+' 100%);flex-shrink:0;"></div>'
    +'<div style="flex:1;background:#fff;padding:42px 72px 20px;display:flex;flex-direction:column;gap:16px;min-height:0;">'
    +'<div style="font-size:17px;color:#1A2332;font-family:\'Noto Sans KR\',sans-serif;padding-bottom:8px;text-align:center;font-weight:400;">'+D.name+' 학생에게는 다음 '+actN+'단계 훈련을 권장합니다.</div>'
    +'<div style="padding:4px 0 0;">'
    +svgHtml
    +'</div>'
    +'<div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'    +'<div style="font-size:11px;color:#94A3B8;letter-spacing:1.8px;font-family:\'Noto Sans KR\',sans-serif;">훈련 목표 &amp; 권장 이유</div>'    +'<div style="font-size:10px;color:#94A3B8;font-family:\'Noto Sans KR\',sans-serif;">훈련 시작 후 학생의 성실도와 누적 훈련결과에 따라 과정이 조정될 수 있습니다.</div>'    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:12px;">'+detailCards+'</div>'
    +'</div>'
    +'<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:0 20px;">'
    +'<div style="font-size:11.5px;color:#94A3B8;line-height:1.9;text-align:center;font-family:\'Noto Sans KR\',sans-serif;word-break:keep-all;">'
    +'<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:0 20px;">'
    +'<div style="font-size:11.5px;color:#94A3B8;line-height:2.0;text-align:center;font-family:\'Noto Sans KR\',sans-serif;word-break:keep-all;">'
    +''
    +'<span style="color:#64748B;font-weight:600;">★ 독해력은 공부가 심화되는 고등학교 진학 후에 더 큰 영향을 미치기 때문에<br>중학교 졸업 전에 고급과정을 마치는 것을 최종 목표로 삼아야 합니다.</span>'
    +'</div>'
    +'</div>'
    +'</div>'
    +'</div>'
    +(D.flagMolip ? (
      '<div style="margin:12px 40px 0;border-left:4px solid #F97316;background:#FFF7ED;padding:14px 18px;border-radius:0 8px 8px 0;">'
      +'<div style="font-size:11px;font-weight:800;color:#EA580C;letter-spacing:.5px;margin-bottom:8px;">⚡ 몰입훈련 안내'+(D.flagMolipRequired?' (필수)':' (권장)')+'</div>'
      +'<div style="font-size:11px;color:#7C2D12;line-height:1.9;">'
      +'<strong>시간</strong> — 1일 4~6시간, 주 5회<br>'
      +'<strong>목표</strong> — 또래 수준의 역량 회복 기간을 최대한 단축하는 것이 목표<br>'
      +'<strong>기간</strong> — 2~3개월 소요<br>'
      +'· 예비과정: 1일 1개 / 그 외 기초 과정: 1일 5~10개 집중 진행<br>'
      +'· 훈련 중 노트 없이 발문 수업 1일 2~3개 읽고 바로 발표<br>'
      +'· 과정 통과 기준: 활용테스트 60회 누적 <strong>80점 이상</strong>'
      +'</div></div>'
    ) : '')
    +(D.flagTeukmok ? (
      '<div style="margin:12px 40px 0;border-left:4px solid #7C3AED;background:#F5F3FF;padding:14px 18px;border-radius:0 8px 8px 0;">'
      +'<div style="font-size:11px;font-weight:800;color:#6D28D9;letter-spacing:.5px;margin-bottom:6px;">🎯 특목자사고 대비 역량강화 프로그램</div>'
      +'<div style="font-size:11px;color:#3B0764;line-height:1.9;">'
      +'<strong>목표</strong> — 중학교 졸업 전 <strong>고급심화과정 완성</strong><br>'
      +'· 고등 진학 후 학습역량 압도적 우위<br>'
      +'· 일반 수강보다 빠른 진행 + 심화 어휘·추론 병행 권장'
      +'</div></div>'
    ) : '')
    +((D.flagMolip||D.flagTeukmok) ? (
      '<div style="margin:12px 40px 0;background:#F1F5F9;padding:10px 18px;border-radius:6px;border:1px solid #E2E8F0;">'
      +'<div style="font-size:11px;color:#475569;line-height:1.7;">'
      +'💡 <strong>공통</strong> — 전 과목에 영향을 미치는 독해력 향상이 최우선 해결 과제입니다.'
      +'</div></div>'
    ) : '')
    +'</div>'
    +buildFooter(total, total);
  return div;
}

// ── 렌더링 — 로드맵을 1번째로 ──

// ══════════════════════════════════════════════
// 로드맵 편집 시스템
// ══════════════════════════════════════════════

var TQ_API_URL_RM   = TQ_API_URL;
var TQ_API_TOKEN_RM = TQ_API_TOKEN;

// 현재 활성 과정 목록 (presc 기반, 편집 가능)
var currentActiveKeys = [];

// ── 편집 UI 생성 ──
function buildEditBar() {
  // D가 null일 수 있으므로 __inp/__eng로 안전하게 폴백
  var _bd = D || window.__RPT_D || {};
  var _bi = window.__inp || {};
  var _be = window.__eng || {};
  var _uiLevel = _bd.uiLevel || _bd.level || _bi.uiLevel || _bi.level || '';
  var _grade   = _bd.grade   != null ? _bd.grade   : (_bi.grade || 0);
  var _acc     = _bd.acc     != null ? _bd.acc     : (_be.acc   || 0);
  var _kor     = _bd.kor     || _bi.kor || '-';
  var recCode = recommendCourse(_uiLevel, _grade, _acc, _kor);
  var recCourse = COURSES[recCode];
  // currentActiveKeys가 비어있으면 추천 코스로 채움 (어떤 경로로 호출되든 보장)
  if (!currentActiveKeys.length) {
    currentActiveKeys = buildPrescFromCourse(recCode).map(function(p){ return p.c; });
    currentCourseCode = recCode;
  }

  var bar = document.createElement('div');
  bar.id = 'editBar';
  bar.style.cssText = [
    'position:fixed;bottom:0;left:0;right:0;z-index:200',
    'background:#1E293B;border-top:2px solid #6366F1',
    'padding:14px 32px',
    'box-shadow:0 -4px 24px rgba(0,0,0,.3)',
    'font-family:\'Noto Sans KR\',sans-serif'
  ].join(';');

  // 코스 버튼 생성
  var courseBtns = Object.keys(COURSES).map(function(code) {
    var c = COURSES[code];
    var isRec = (code === recCode);
    var isSel = (currentCourseCode === code);
    return '<button onclick="selectCourse(\'' + code + '\')" '
      + 'style="padding:6px 14px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;margin-right:4px;'
      + (isSel ? 'background:#6366F1;color:#fff;border:2px solid #6366F1;'
               : 'background:transparent;color:#94A3B8;border:1.5px solid rgba(255,255,255,.2);')
      + '">' + c.name + (isRec ? ' ★' : '') + '</button>';
  }).join('');

  // 과정 개별 버튼
  var STEP_COLORS_E = ["#F47A20","#F5C518","#F5C518","#F5C518","#7CB342","#7CB342","#7CB342","#4A90D9","#4A90D9"];
  var stepBtns = ALL_PROGRAMS.map(function(p, k) {
    var isAct = currentActiveKeys.indexOf(p.key) > -1;
    var col = STEP_COLORS_E[k] || '#6366F1';
    return '<button onclick="toggleProgram(\'' + p.key.replace(/'/g, "\\'") + '\')" '
      + 'style="padding:4px 10px;border-radius:4px;font-size:10.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;margin-right:3px;margin-bottom:3px;'
      + (isAct
        ? 'background:' + col + ';color:#fff;border:1.5px solid ' + col + ';'
        : 'background:transparent;color:' + (editUnlocked ? '#64748B' : 'rgba(255,255,255,.25)') + ';border:1.5px solid rgba(255,255,255,.1);')
      + '">' + (p.label1||p.key) + '</button>';
  }).join('');

  // 읽기전용: 전체 알파 처리 / 편집 시: 불투명
  var wrapOpacity  = editUnlocked ? '1' : '0.5';
  var lockStyle    = editUnlocked ? '' : 'pointer-events:none;';

  // 우측 버튼 — 3가지 상태
  var rightBtn;
  if (editUnlocked) {
    // 편집 중: 완료 버튼
    rightBtn = '<button onclick="lockEditBar()" style="padding:7px 16px;background:#22C55E;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;">✓ 완료</button>';
  } else if (editBarReady) {
    // 리포트 완료 + 읽기전용: 수정하기 활성
    rightBtn = '<button onclick="unlockEditBar()" style="padding:7px 16px;background:#6366F1;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">✏️ 수정하기</button>';
  } else {
    // 리포트 생성 전: 수정하기 비활성
    rightBtn = '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">'
      + '<button disabled style="padding:7px 16px;background:rgba(99,102,241,.25);color:rgba(255,255,255,.3);border:1px solid rgba(99,102,241,.2);border-radius:6px;font-size:11px;font-weight:600;cursor:not-allowed;font-family:inherit;white-space:nowrap;">✏️ 수정하기</button>'
      + '<span style="font-size:9px;color:rgba(255,255,255,.3);white-space:nowrap;">판독 완료 후 수정 가능</span>'
      + '</div>';
  }

  bar.innerHTML =
    // 전체 레이아웃: 좌측 콘텐츠(opacity 조절) + 우측 버튼(항상 불투명) 분리
    '<div style="display:flex;align-items:center;gap:16px;">'

    // 좌측: 레이블 + 코스 + 과정 (opacity로 읽기전용 표시)
    +'<div style="display:flex;align-items:center;gap:20px;flex:1;flex-wrap:wrap;opacity:' + wrapOpacity + ';transition:opacity .3s;">'
    +'<div style="font-size:11px;font-weight:700;color:#A78BFA;white-space:nowrap;flex-shrink:0;">권장 훈련 로드맵</div>'
    +'<div style="flex-shrink:0;">'
    +'<div style="font-size:9px;color:#64748B;letter-spacing:1px;margin-bottom:4px;">코스 선택 (★ = 자동 추천)</div>'
    +'<div style="' + lockStyle + '">' + courseBtns + '</div>'
    +'</div>'
    +'<div style="flex:1;">'
    +'<div style="font-size:9px;color:#64748B;letter-spacing:1px;margin-bottom:4px;">과정 개별 조정</div>'
    +'<div id="editBtns" style="' + lockStyle + '">' + stepBtns + '</div>'
    +'</div>'
    +'</div>'

    // 우측: 버튼 (opacity 1 독립 — 부모 opacity 영향 없음)
    +'<div style="flex-shrink:0;">'
    + rightBtn
    +'</div>'
    +'</div>';

  return bar;
}


// 편집 잠금 해제 / 잠금
function unlockEditBar() {
  editUnlocked = true;
  // currentActiveKeys가 비어있으면 현재 presc 또는 추천 코스로 복원
  if (!currentActiveKeys.length) {
    var _src = window.__RPT_D || (window.__eng ? {
      presc: window.__eng.presc||[], uiLevel: (window.__inp&&window.__inp.uiLevel)||'',
      level: (window.__inp&&window.__inp.user_section)||'', grade: (window.__inp&&window.__inp.user_school_grade)||0,
      acc: (window.__eng&&window.__eng.acc)||0, kor: (window.__inp&&window.__inp.kor_score)||'-'
    } : null);
    if (_src) {
      currentActiveKeys = (_src.presc||[]).map(function(p){ return p.c; })
        .filter(function(k){ return ALL_PROGRAMS.some(function(p){ return p.key===k; }); });
      if (!currentActiveKeys.length) {
        var rc = recommendCourse(_src.uiLevel||_src.level, _src.grade, _src.acc, _src.kor);
        currentActiveKeys = buildPrescFromCourse(rc).map(function(p){ return p.c; });
        currentCourseCode = rc;
      } else {
        // currentActiveKeys와 일치하는 코스 찾아 currentCourseCode 동기화
        var _mc = '';
        Object.keys(COURSES).forEach(function(code) {
          var steps = COURSES[code].steps;
          if (steps.length === currentActiveKeys.length &&
              steps.every(function(s){ return currentActiveKeys.indexOf(s) > -1; })) {
            _mc = code;
          }
        });
        currentCourseCode = _mc;
      }
    }
  }
  rebuildEditBar();
}
function lockEditBar() {
  editUnlocked = false;
  rebuildEditBar();
}
function rebuildEditBar() {
  var old = document.getElementById('editBar');
  if (!old) return;
  // D 안전하게 확보
  var _savedD = D;
  var _useD = window.__RPT_D;
  if (!_useD && window.__eng && window.__inp) {
    _useD = {
      name: window.__inp.name||'', level: window.__inp.uiLevel||window.__inp.user_section||'',
      uiLevel: window.__inp.uiLevel||window.__inp.user_section||'',
      grade: window.__inp.user_school_grade||0, kor: window.__inp.kor_score||'-',
      acc: window.__eng.acc||0, presc: []
    };
  }
  if (!_useD) return;
  // currentActiveKeys가 비어있으면 추천 과정으로 채움
  if (!currentActiveKeys.length) {
    var _rc = recommendCourse(_useD.uiLevel||_useD.level, _useD.grade, _useD.acc, _useD.kor);
    currentActiveKeys = buildPrescFromCourse(_rc).map(function(p){ return p.c; });
    currentCourseCode = _rc;
  } else {
    // currentActiveKeys와 일치하는 코스 패키지를 찾아 currentCourseCode 동기화
    var _matched = '';
    Object.keys(COURSES).forEach(function(code) {
      var steps = COURSES[code].steps;
      if (steps.length === currentActiveKeys.length &&
          steps.every(function(s){ return currentActiveKeys.indexOf(s) > -1; })) {
        _matched = code;
      }
    });
    if (_matched) currentCourseCode = _matched;
  }
  D = _useD;
  var newBar = buildEditBar();
  D = _savedD;
  newBar.style.position = 'fixed';
  newBar.style.bottom = '0';
  newBar.style.left = '0';
  newBar.style.right = '0';
  newBar.style.zIndex = '200';
  old.replaceWith(newBar);
}window.rebuildEditBar = rebuildEditBar;

window.unlockEditBar = unlockEditBar;
window.lockEditBar = lockEditBar;

// 코스 단위 선택
var currentCourseCode = '';
function selectCourse(code) {
  var course = COURSES[code];
  if (!course) return;
  currentCourseCode = code;
  currentActiveKeys = course.steps.slice();
  aiReasonCache = {};
  // 로드맵 반영 + 저장
  applyEdit();
}window.selectCourse = selectCourse;


function renderEditBtns(container) {
  var STEP_COLORS_E = ["#F47A20","#F5C518","#F5C518","#F5C518","#7CB342","#7CB342","#7CB342","#4A90D9","#4A90D9"];
  container.innerHTML = ALL_PROGRAMS.map(function(p, k) {
    var isAct = currentActiveKeys.indexOf(p.key) > -1;
    var col = STEP_COLORS_E[k] || '#6366F1';
    return '<button onclick="toggleProgram(\'' + p.key.replace(/'/g, "\\'") + '\')" '
      + 'style="padding:4px 10px;border-radius:4px;font-size:10.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;margin-right:3px;margin-bottom:3px;'
      + (isAct
        ? 'background:' + col + ';color:#fff;border:1.5px solid ' + col + ';'
        : 'background:transparent;color:#64748B;border:1.5px solid rgba(255,255,255,.12);')
      + '">' + p.key + '</button>';
  }).join('');
}

function toggleProgram(key) {
  var idx = currentActiveKeys.indexOf(key);
  if (idx > -1) {
    currentActiveKeys.splice(idx, 1);
  } else {
    if (currentActiveKeys.length >= 6) { alert('최대 6단계까지 선택 가능합니다.'); return; }
    var allKeys = ALL_PROGRAMS.map(function(p){ return p.key; });
    var newList = allKeys.filter(function(k){ return currentActiveKeys.indexOf(k) > -1 || k === key; });
    currentActiveKeys = newList;
  }
  // 개별 조정 시 코스 선택 표시 해제 (어떤 묶음 코스와도 일치하지 않을 수 있음)
  var matchedCode = '';
  Object.keys(COURSES).forEach(function(code) {
    var steps = COURSES[code].steps;
    if (steps.length === currentActiveKeys.length &&
        steps.every(function(s){ return currentActiveKeys.indexOf(s) > -1; })) {
      matchedCode = code;
    }
  });
  currentCourseCode = matchedCode; // 정확히 일치하는 코스가 있으면 표시, 없으면 해제
  aiReasonCache = {};
  applyEdit();
}window.toggleProgram = toggleProgram;


// AI 추천 이유 캐시
var aiReasonCache = {};

function requestAiReasons() {
  var btn = document.getElementById('btnAiReason');
  if (!TQ_API_URL_RM) { showToastRM('API URL 미설정 — 규칙 기반 이유가 사용됩니다.'); applyEdit(); return; }
  if (!currentActiveKeys.length) { alert('과정을 1개 이상 선택해 주세요.'); return; }

  btn.disabled = true;
  btn.textContent = '생성 중...';

  var programs = ALL_PROGRAMS
    .filter(function(p){ return currentActiveKeys.indexOf(p.key) > -1; })
    .map(function(p){ return { key: p.key, goal: p.goal || p.desc || '' }; });

  var student = {
    name: D.name,
    level: D.uiLevel || D.level,
    grade: D.grade,
    acc: D.acc, fct: D.fct, str_: D.str_,
    voc: D.voc, wm: D.wm, inf: D.inf,
    hab: D.hab, eff: D.eff,
    spd: D.spd,
    bt: D.bt, urg: D.urg,
    habChecked: D.habChecked || [],
    effChecked: D.effChecked || [],
    kor: D.kor, math: D.math
  };

  fetch(TQ_API_URL_RM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-academy-token': TQ_API_TOKEN_RM },
    body: JSON.stringify({ action: 'roadmap_reason', student: student, programs: programs })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if (data.reasons) {
      aiReasonCache = data.reasons;
      showToastRM('AI 추천 이유가 생성되었습니다. 적용 버튼을 눌러 반영하세요.');
    } else {
      alert('생성 실패: ' + (data.error || '알 수 없는 오류'));
    }
  })
  .catch(function(e){ alert('오류: ' + e.message); })
  .finally(function(){
    btn.disabled = false;
    btn.textContent = 'AI 추천 이유 생성';
  });
}

function applyEdit() {
  if (!currentActiveKeys.length) return;
  var TOTAL = 4;

  // 1. currentActiveKeys → newPresc 변환
  var newPresc = currentActiveKeys.map(function(k, i){ return { p: i+1, c: k }; });

  // 2. 모든 presc 소스 동기화
  if (D) D.presc = newPresc;
  if (window.__RPT_D) window.__RPT_D.presc = newPresc;
  if (window.__eng) window.__eng.presc = newPresc;

  // 3. currentCourseCode 동기화 (currentActiveKeys와 일치하는 코스 찾기)
  var _mc = '';
  Object.keys(COURSES).forEach(function(code) {
    var steps = COURSES[code].steps;
    if (steps.length === currentActiveKeys.length &&
        steps.every(function(s){ return currentActiveKeys.indexOf(s) > -1; })) {
      _mc = code;
    }
  });
  currentCourseCode = _mc;

  // 4. 리포트 로드맵 페이지 재렌더 (rptPageWrap에 children 있으면)
  var wrap = document.getElementById('rptPageWrap');
  if (wrap && wrap.children.length > 0) {
    var newPage = buildLastPage(TOTAL, currentActiveKeys.slice());
    wrap.replaceChild(newPage, wrap.lastChild);
  }

  // 5. 편집바 재렌더 (editBar가 DOM에 있으면)
  var existingBar = document.getElementById('editBar');
  if (existingBar) {
    var _savedD = D;
    D = window.__RPT_D || _savedD;
    var newBar = buildEditBar();
    D = _savedD;
    newBar.style.cssText = existingBar.style.cssText;
    existingBar.replaceWith(newBar);
  }

  showToastRM('로드맵이 업데이트되었습니다.');

  // 6. DB 저장
  if (window.__inp && window.__eng && window.__TQ_SLOTS) {
    saveTqResult(window.__inp, window.__eng, window.__TQ_SLOTS);
  }
}window.applyEdit = applyEdit;


function showToastRM(msg) {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:10px 20px;border-radius:8px;font-size:12px;z-index:9999;font-family:\'Noto Sans KR\',sans-serif;border:1px solid #6366F1;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3000);
}

// 편집 모드 토글
var editMode = false;
var editUnlocked = false; // 읽기전용/편집모드 토글
var editBarReady = false;  // 리포트 생성 완료 후 true
function toggleEditMode(on) {
  editMode = (on !== undefined) ? on : !editMode;
  var existing = document.getElementById('editBar');
  if (editMode) {
    var _D = window.__RPT_D || D;
    if (!_D) return;
    currentActiveKeys = (_D.presc||[]).map(function(p){ return p.c || p.category; }).filter(Boolean);
    if (!currentActiveKeys.length) {
      currentActiveKeys = buildPrescFromCourse(recommendCourse(_D.uiLevel||_D.level, _D.grade, _D.acc, _D.kor)).map(function(p){ return p.c; });
    }
    currentCourseCode = recommendCourse(_D.uiLevel||_D.level, _D.grade, _D.acc, _D.kor);
    aiReasonCache = {};
    if (!existing) { var _eb=buildEditBar(); document.getElementById('resultPane_판독').appendChild(_eb); }
  } else {
    if (existing) existing.remove();
  }
}



// ── 편집 버튼을 print-bar에 추가 ──



// ── 리포트 탭 렌더 진입점 ──
function renderReportTab() {
  var eng   = window.__eng;
  var inp   = window.__inp;
  var slots = window.__TQ_SLOTS;
  if (!eng || !inp || !slots) return;

  // D 조립 (standalone 형식)
  var imgEl  = document.getElementById('imgPreview');
  var imgSrc = imgEl && imgEl.src && imgEl.src.startsWith('data:') ? imgEl.src : null;
  D = {
    name:       inp.name || '',
    level:      inp.uiLevel || inp.user_section || '',
    uiLevel:    inp.uiLevel || inp.user_section || '',
    grade:      inp.user_school_grade || 0,
    kor:        inp.kor_score,
    eng:        inp.eng_score,
    math:       inp.math_score,
    bt:  eng.btDisplay || eng.bt || '',
    st:  eng.stDisplay || eng.st || '',
    urg: eng.urg || '',
    flagC: eng.flagC, flagO: eng.flagO,
    flagMolip: eng.flagMolip, flagMolipRequired: eng.flagMolipRequired,
    flagTeukmok: eng.flagTeukmok,
    acc:  eng.acc  || 0,
    fct:  eng.fct  || 0,
    str_: eng.str_ || 0,
    spd:  eng.spd  || inp.reading_score || 0,
    inf:  eng.inf  || 0,
    voc:  eng.voc  || 0,
    wm:   eng.wm   || 0,
    hab:  eng.hab  || 0,
    eff:  eng.eff  || 0,
    habChecked: eng.habChecked || [],
    effChecked: eng.effChecked || [],
    presc:  (window.__RPT_D && window.__RPT_D.presc && window.__RPT_D.presc.length ? window.__RPT_D.presc : eng.presc) || [],
    roadmapReasons: (window.__RPT_D && window.__RPT_D.roadmapReasons) || (eng.roadmapReasons) || null,
    date:   eng.date || (window.__inp && window.__inp.reg_date ? window.__inp.reg_date.slice(0,10) : null),
    slots:  slots,
    imgSrc: imgSrc
  };
  window.__RPT_D = D;

  // 기존 페이지 초기화
  var wrap = document.getElementById('rptPageWrap');
  var placeholder = document.getElementById('reportInlinePlaceholder');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';
  wrap.style.gap = '24px';
  wrap.style.padding = '28px 16px 60px';
  if (placeholder) placeholder.style.display = 'none';

  // 페이지 빌드
  var TOTAL = 4;
  try { wrap.appendChild(buildPage1()); } catch(e){ console.error('[buildPage1]', e); }
  try { wrap.appendChild(buildDualSlotPage(1, 2, 2, TOTAL)); } catch(e){ console.error('[buildDualSlotPage 1-2]', e); }
  try { wrap.appendChild(buildDualSlotPage(3, 4, 3, TOTAL)); } catch(e){ console.error('[buildDualSlotPage 3-4]', e); }
  try { wrap.appendChild(buildLastPage(TOTAL, currentActiveKeys.length ? currentActiveKeys.slice() : null)); } catch(e){ console.error('[buildLastPage]', e); }

  // currentActiveKeys는 편집바(showEditBar/rebuildEditBar)에서 관리
  // renderReportTab은 덮어쓰지 않음

}
window.renderReportTab = renderReportTab;

// 편집바를 판독 탭 하단에 표시
function showEditBar() {
  if (!window.__eng || !window.__inp) return;
  var oldBar = document.getElementById('editBar');
  if (oldBar) oldBar.remove();
  editMode = true;
  aiReasonCache = {};

  // currentActiveKeys: __RPT_D.presc > __eng.presc > 추천 코스 순으로 복원
  var _presc = (window.__RPT_D && window.__RPT_D.presc && window.__RPT_D.presc.length)
    ? window.__RPT_D.presc
    : (window.__eng.presc || []);
  var _keys = _presc
    .map(function(p){ return p.c; })
    .filter(function(k){ return ALL_PROGRAMS.some(function(p){ return p.key === k; }); });

  if (_keys.length) {
    currentActiveKeys = _keys;
  } else {
    var recCode = recommendCourse(
      window.__inp.uiLevel||window.__inp.user_section,
      window.__inp.user_school_grade, window.__eng.acc, window.__inp.kor_score
    );
    currentActiveKeys = buildPrescFromCourse(recCode).map(function(p){ return p.c; });
  }

  // currentCourseCode: currentActiveKeys와 일치하는 코스 찾기
  var _mc = '';
  Object.keys(COURSES).forEach(function(code) {
    var steps = COURSES[code].steps;
    if (steps.length === currentActiveKeys.length &&
        steps.every(function(s){ return currentActiveKeys.indexOf(s) > -1; })) {
      _mc = code;
    }
  });
  // 매칭 코스 없으면 빈 값 (어떤 코스버튼도 활성화 안 함)
  currentCourseCode = _mc;

  // editBar 생성 후 body에 고정
  var _savedD = D;
  D = window.__RPT_D || D;
  var newBar;
  try { newBar = buildEditBar(); } catch(e) { console.error('[showEditBar] buildEditBar 에러:', e); D = _savedD; return; }
  D = _savedD;
  if (!newBar) { console.error('[showEditBar] buildEditBar가 null 반환'); return; }
  newBar.style.position = 'fixed';
  newBar.style.bottom = '0';
  newBar.style.left = '0';
  newBar.style.right = '0';
  newBar.style.zIndex = '200';
  document.body.appendChild(newBar);
  console.log('[showEditBar] 편집바 생성 완료, currentActiveKeys:', currentActiveKeys);
}
window.showEditBar = showEditBar;
