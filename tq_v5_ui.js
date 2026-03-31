function v5Switch(tab) {
  ['판독','편집'].forEach(function(t) {
    var btn = document.getElementById('v5tab_'+t);
    if (btn) btn.classList.toggle('active', t===tab);
  });
  var panelRead  = document.getElementById('v5panel_판독');
  var panelEdit  = document.getElementById('v5panel_편집');
  var panelCau   = document.getElementById('v5panel_인과');
  var pageInput  = document.getElementById('page-input');
  var pageResult = document.getElementById('page-result');
  if (panelRead) panelRead.style.display = tab==='판독' ? 'block' : 'none';
  if (panelEdit) panelEdit.style.display = tab==='편집' ? 'flex'  : 'none';
  if (panelCau)  panelCau.style.display  = tab==='인과' ? 'block' : 'none';
  // 인과/편집 탭: page-input/result 숨김 + 흰 배경
  if (tab==='인과' || tab==='편집') {
    if (tab==='인과') {
      if (pageInput)  pageInput.style.display  = 'none';
      if (pageResult) pageResult.style.display = 'none';
      document.body.style.background = '#ffffff';
    }
  }
  // 편집 탭: page-input/result 모두 숨기고 흰 배경
  var pageInput  = document.getElementById('page-input');
  var pageResult = document.getElementById('page-result');
  if (tab==='편집') {
    if (pageInput)  pageInput.style.display  = 'none';
    if (pageResult) pageResult.style.display = 'none';
    document.body.style.background = '#ffffff';
    if (panelEdit) panelEdit.style.background = '#ffffff';
  } else {
    document.body.style.background = 'var(--bg)';
    // 판독 탭 복귀 시 — 이전 상태 복원 (결과가 있으면 result, 없으면 input)
    var hasResult = document.getElementById('resultView') &&
                    document.getElementById('resultView').innerHTML.trim().length > 0;
    if (hasResult) {
      if (pageResult) pageResult.style.display = 'block';
      if (pageInput)  pageInput.style.display  = 'none';
    } else {
      if (pageInput)  pageInput.style.display  = 'flex';
      if (pageResult) pageResult.style.display = 'none';
    }
  }
  if (tab==='편집' && typeof renderNav==='function') {
    if(Object.keys(MESSAGES).length === 0) {
      var mainArea = document.getElementById('mainArea');
      if(mainArea) mainArea.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;color:#7A8CA0"><div style="font-size:14px;font-weight:600">의사결정 테이블</div><div style="font-size:12px;text-align:center;line-height:1.8">판독 엔진이 서버에서 운영됩니다.<br>이 탭은 내부 편집 전용입니다.</div></div>';
      return;
    }
    renderNav(); if(curKey) renderEditor(curKey);
  }
}
// ITEM_COLS: {key: 화면표시명} 순서 배열
// 모순패턴 열: 모든 항목 공통 첫 번째 열
var ITEM_COLS = {
  "1) 성적선행지수": [
    {k:"모순패턴", l:"모순패턴"},
    {k:"acc",     l:"독해정확도"},
    {k:"kv",      l:"국어성적(정규화)"},
    {k:"spdGrade",l:"독해속도등급"},
    {k:"voc",     l:"어휘능력"},
    {k:"wm",      l:"워킹메모리"},
    {k:"inf",     l:"추론능력"},
  ],
  "2) 독해속도": [
    {k:"모순패턴", l:"모순패턴"},
    {k:"acc",              l:"독해정확도"},
    {k:"spdGrade",         l:"독해속도등급"},
    {k:"invSpd",           l:"속도이상값"},
    {k:"habClass.심각도",  l:"음독심각도"},
  ],
  "3) 독서의 양": [
    {k:"모순패턴", l:"모순패턴"},
    {k:"voc",            l:"어휘능력"},
    {k:"acc",            l:"독해정확도"},
    {k:"inf",            l:"추론능력"},
    {k:"eff.독서량체크", l:"독서량부족 자각"},
    {k:"eff.밤새워",     l:"밤새워독서 경험"},
    {k:"eff.두꺼운책",   l:"두꺼운책 경험"},
  ],
  "4) 독해의 질": [
    {k:"모순패턴", l:"모순패턴"},
    {k:"acc", l:"독해정확도"},
    {k:"spdGrade", l:"독해속도등급"},
    {k:"gap", l:"사실-구조 갭"},
    {k:"voc", l:"어휘능력"},
  ],
  "5) 정보처리습관": [
    {k:"모순패턴", l:"모순패턴"},
    {k:"acc",                       l:"독해정확도"},
    {k:"spdGrade",                  l:"독해속도등급"},
    {k:"habClass.심각도",           l:"음독심각도"},
    {k:"habClass.표면음독",         l:"표면음독 수"},
    {k:"habClass.내재음독이해",     l:"이해결손 음독 수"},
  ],
  "6) 워킹메모리": [
    {k:"모순패턴", l:"모순패턴"},
    {k:"wm",  l:"워킹메모리"},
    {k:"acc", l:"독해정확도"},
    {k:"spd", l:"독해속도"},
  ],
  "7) 추론능력": [
    {k:"모순패턴", l:"모순패턴"},
    {k:"inf", l:"추론능력"},
    {k:"acc", l:"독해정확도"},
    {k:"gap", l:"사실-구조 갭"},
  ],
  "8) 독해효율성": [
    {k:"모순패턴",    l:"모순패턴"},
    {k:"eff",         l:"독해효율성"},
    {k:"acc",         l:"독해정확도"},
    {k:"effChecked수",l:"효율성 체크 수"},
  ],
  "9) 학교학업": [
    {k:"모순패턴", l:"모순패턴"},
    {k:"kv",      l:"국어성적(정규화)"},
    {k:"acc",     l:"독해정확도"},
    {k:"engVal",  l:"영어성적(정규화)"},
    {k:"mathVal", l:"수학성적(정규화)"},
    {k:"inf",     l:"추론능력"},
    {k:"voc",     l:"어휘능력"},
    {k:"level",   l:"학제/학년"},
  ],
};

// MESSAGES 데이터는 서버(Supabase Edge Function)에만 존재합니다
var MESSAGES = {};
window.MESSAGES = MESSAGES;
var changedIds = new Set();

// ── 인과분석 경로 데이터 ──
var CAU_RULES = [
  { id:'cau_gap_fct',  label:'사실이해 우세',       cond:'gap >= 30',                          msg:'사실이해>구조이해 → 핵심파악어려움' },
  { id:'cau_gap_str',  label:'구조이해 우세',        cond:'gap <= -20',                         msg:'구조이해>사실이해 → 세부정보부족' },
  { id:'cau_voc',      label:'어휘 심각 결손',       cond:'voc < 40',                           msg:'어휘결손 → 비문학독서부족' },
  { id:'cau_wm1',      label:'WM 심각 부족',         cond:'wm < 40',                            msg:'WM심각부족 → 내용처리불가 → 암기의존' },
  { id:'cau_wm2',      label:'WM 부족',              cond:'wm < 50 (40이상)',                   msg:'WM부족 → 재처리반복 → 독해속도저하' },
  { id:'cau_wm3',      label:'WM 미흡',              cond:'wm < 60 (50이상)',                   msg:'WM미흡 → 복잡정보처리한계 → 심화학습어려움' },
  { id:'cau_hab1',     label:'음독 심함 + 고역량',   cond:'음독심각도=심함 + acc≥70 + 속도양호', msg:'표면·내재음독 복합 — 고역량이나 고등수준 지문에서 부하 가능성' },
  { id:'cau_hab2',     label:'음독 심함 + 저역량',   cond:'음독심각도=심함 + 그 외',            msg:'음독(표면+내재) 복합 → 독해속도저하+이해결손 → 시험시간부족' },
  { id:'cau_hab3',     label:'음독 보통 + 고역량',   cond:'음독심각도=보통 + acc≥70 + 속도양호', msg:'부분음독·내재음독 경향 — 현재 역량에서는 자연현상 수준' },
  { id:'cau_hab4',     label:'음독 보통 + 고정확 저속', cond:'음독심각도=보통 + acc≥70 + 속도느림', msg:'음독 → 역량대비 속도저하 → 교정시 속도개선 여지' },
  { id:'cau_hab5',     label:'음독 보통 + 저역량',   cond:'음독심각도=보통 + 그 외',            msg:'음독 → 독해속도저하 → 시험시간부족' },
  { id:'cau_hab6',     label:'음독 경미',             cond:'음독심각도=경미 + 역량/속도 미달',   msg:'미숙한 독해습관 경향 → 속도·효율 저하 주의' },
  { id:'cau_hab7',     label:'내재음독+이해결손',     cond:'내재음독이해≥2 + acc낮음',           msg:'내재음독 → 워킹메모리 과부하 → 긴문장이해·기억 어려움' },
  { id:'cau_hab8',     label:'속도문제 자각',         cond:'속도문제체크≥1 + 실제속도 느림',     msg:'독해속도 느림 자각 → 시험시간부족 직결' },
  { id:'cau_inf',      label:'추론 심각 결손',        cond:'inf < 40',                           msg:'추론결손 → 수학과학어려움' },
  { id:'cau_flagC',    label:'모순패턴',              cond:'flagC = true',                       msg:'저역량고성적 → 암기의존 → 붕괴위험' },
  { id:'cau_flagO',    label:'선행과부하',            cond:'flagO = true',                       msg:'고역량효율저하 → 학원과부하환경' },
  { id:'cau_eff1',     label:'효율 복합결손',         cond:'effHit≥2 (시험시간·핵심·흐름 동시)', msg:'독해효율성 복합결손 → 실전 시험 직접 영향' },
  { id:'cau_eff2',     label:'효율 저하',             cond:'eff 중하 또는 하',                   msg:'독해효율저하 → 자신감영향' },
  { id:'cau_spd',      label:'속도 느림',             cond:'속도등급 = 느림',                    msg:'저속독해 → 시험시간부족' }
];
window.CAU_RULES = CAU_RULES;

function renderCauEditor() {
  var el = document.getElementById('cauEditor');
  if (!el) return;
  var rows = CAU_RULES.map(function(rule, i) {
    var bg = i % 2 === 0 ? '#ffffff' : '#F8FAFC';
    var safeMsg = rule.msg.replace(/"/g,'&quot;');
    return '<tr style="background:' + bg + ';border-bottom:1px solid #E2E8F0">'
      + '<td style="padding:10px 14px;font-weight:600;color:#374151">' + rule.label + '</td>'
      + '<td style="padding:10px 14px;font-size:11px;color:#6B7280;font-family:monospace">' + rule.cond + '</td>'
      + '<td style="padding:8px 14px">'
      + '<input id="cau_msg_' + rule.id + '" data-id="' + rule.id + '" value="' + safeMsg + '" '
      + 'style="width:100%;padding:6px 10px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;color:#1E293B;font-family:inherit;outline:none">'
      + '</td>'
      + '<td style="padding:8px 14px;text-align:center">'
      + '<button data-id="' + rule.id + '" style="padding:4px 12px;background:#8B5CF6;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit">저장</button>'
      + '</td>'
      + '</tr>';
  }).join('');

  el.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    + '<thead><tr style="background:#1E293B;color:#fff">'
    + '<th style="padding:10px 14px;text-align:left;width:160px">항목명</th>'
    + '<th style="padding:10px 14px;text-align:left;width:240px">조건 (참고용)</th>'
    + '<th style="padding:10px 14px;text-align:left">인과경로 메시지</th>'
    + '<th style="padding:10px 14px;width:60px">저장</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table>';

  // 이벤트 바인딩
  el.querySelectorAll('button[data-id]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = this.getAttribute('data-id');
      saveCauRule(id);
    });
  });
}


function saveCauRule(id) {
  var rule = CAU_RULES.find(function(r){ return r.id === id; });
  if (!rule) return;
  var input = document.getElementById('cau_msg_' + id);
  if (!input) return;
  rule.msg = input.value;
  input.style.borderColor = '#10B981';
  setTimeout(function(){ input.style.borderColor = '#E2E8F0'; }, 1500);
}

// 인과 탭 진입 시 렌더
(function(){
  var origSwitch = window.v5Switch;
  window.v5Switch = function(tab) {
    if (typeof origSwitch === 'function') origSwitch(tab);
    if (tab === '인과') {
      setTimeout(renderCauEditor, 50);
    }
  };
})();
var editingId = null;
var curKey = null;
var contraEditId = null;

// ── 조건 열 정의 (중요도 순) ──
// 각 항목별로 어떤 조건 열을 보여줄지 설정
// ITEM_COLS: {key: 화면표시명} 순서 배열





// ── 조건값 → 색상 배지 ──
function condBadge(v, colKey) {
  if (v === '-') return '<span class="cond-val cond-any">-</span>';
  if (colKey === '모순패턴') {
    if (v === 'true' || v === '-') {
      var style = v==='true'
        ? 'background:#FEE2E2;color:#991B1B;border:1.5px solid #FCA5A5'
        : 'background:#F1F5F9;color:#94A3B8;border:1px solid #CBD5E1';
      return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;'+style+'">'+v+'</span>';
    }
    // true(선행과부하) 등 변형
    return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:#FEF3C7;color:#92400E;border:1.5px solid #FDE68A">'+v+'</span>';
  }

  // 변수 종류별 팔레트
  var palette = {
    // 불리언 플래그
    'true':  {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    'false': {bg:'#F1F5F9',color:'#64748B',border:'#CBD5E1'},

    // acc 구간
    '≥90':   {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},
    '≥80':   {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},
    '70~89': {bg:'#E0F2FE',color:'#0369A1',border:'#7DD3FC'},
    '≥70':   {bg:'#E0F2FE',color:'#0369A1',border:'#7DD3FC'},
    '50~69': {bg:'#FEF9C3',color:'#92400E',border:'#FCD34D'},
    '50~64': {bg:'#FEF9C3',color:'#92400E',border:'#FCD34D'},
    '30~49': {bg:'#FFEDD5',color:'#C2410C',border:'#EA580C'},
    '10~29': {bg:'#FFEDD5',color:'#C2410C',border:'#EA580C'},
    '<50':   {bg:'#FEF3C7',color:'#92400E',border:'#FDE68A'},
    '<30':   {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '≤10':   {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '<10':   {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '심각':  {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},

    // spd등급
    '빠름':   {bg:'#E0F2FE',color:'#0369A1',border:'#7DD3FC'},
    '보통':   {bg:'#F1F5F9',color:'#475569',border:'#CBD5E1'},
    '느림':   {bg:'#FEF3C7',color:'#92400E',border:'#FDE68A'},
    '느림·보통':{bg:'#FEF3C7',color:'#92400E',border:'#FDE68A'},

    // 음독 심각도
    '심함':  {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '보통':  {bg:'#FEF3C7',color:'#92400E',border:'#FDE68A'},
    '경미':  {bg:'#FEF3C7',color:'#78350F',border:'#F59E0B'},
    '없음':  {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},

    // 체크 여부
    '체크':   {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '미체크': {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},

    // wm
    '≥80':   {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},
    '60~79': {bg:'#E0F2FE',color:'#0369A1',border:'#7DD3FC'},
    '40~59': {bg:'#FEF3C7',color:'#78350F',border:'#F59E0B'},
    '30~39': {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '<30':   {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},

    // gap
    '≥30(fct>str)':  {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '≤-20(str>fct)': {bg:'#EDE9FE',color:'#5B21B6',border:'#C4B5FD'},
    '<30':           {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},
    'str>fct':       {bg:'#EDE9FE',color:'#5B21B6',border:'#C4B5FD'},

    // 기타
    '≥1':   {bg:'#FFEDD5',color:'#C2410C',border:'#EA580C'},
    '≥2':   {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '高':   {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},
    '低':   {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
  };

  // 범위 패턴 자동 색상: 숫자 포함 패턴
  function autoColor(val) {
    // 위험·낮음 패턴 먼저 (< 가 > 보다 먼저)
    if (val.match(/^[<≤]/) || val.includes('낮음') || val.includes('부족') || val.includes('결손'))
      return {bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'};
    // 범위 구간 (숫자~숫자)
    if (val.includes('~'))
      return {bg:'#E0F2FE',color:'#0369A1',border:'#7DD3FC'};
    // 높음·우수
    if (val.match(/^[≥>]/) || val.includes('최상위') || val.includes('우수'))
      return {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'};
    if (val.includes('전과목'))
      return {bg:'#F3E8FF',color:'#6B21A8',border:'#D8B4FE'};
    return {bg:'#F1F5F9',color:'#475569',border:'#CBD5E1'};
  }

  var style = palette[v] || autoColor(v);
  return '<span style="display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600;white-space:nowrap;background:'+style.bg+';color:'+style.color+';border:1.5px solid '+style.border+'">'+v+'</span>';
}

// ── 탭 ──
function switchTab(t) {
  document.querySelectorAll('.tab-btn').forEach(function(b,i){
    b.classList.toggle('active', ['editor','boundary','logic','contra'][i]===t);
  });
  document.getElementById('tab-editor').style.display   = t==='editor'   ? 'flex'  : 'none';
  document.getElementById('tab-boundary').style.display = t==='boundary' ? 'block' : 'none';
  document.getElementById('tab-logic').style.display    = t==='logic'    ? 'block' : 'none';
  document.getElementById('tab-contra').style.display   = t==='contra'   ? 'block' : 'none';
  if (t==='contra') renderContraTable();
}



// ── 네비 ──
function renderNav() {
  document.getElementById('navList').innerHTML = Object.keys(MESSAGES).map(function(k) {
    var changed = MESSAGES[k].some(function(m){ return changedIds.has(m.id); });
    return '<div class="nav-item" data-k="'+k+'" onclick="selectItem(\''+k.replace(/'/g,"\\'")+'\')"><span>'
      +(changed?'<span class="chg-dot"></span>':'')+k+'</span>'
      +'<span class="cnt">'+MESSAGES[k].length+'</span></div>';
  }).join('');
  if (curKey) {
    var el = document.querySelector('.nav-item[data-k="'+curKey+'"]');
    if (el) el.classList.add('active');
  }
}

function selectItem(k) {
  curKey = k; editingId = null;
  document.querySelectorAll('.nav-item').forEach(function(el){
    el.classList.toggle('active', el.dataset.k===k);
  });
  renderEditor(k);
}

// ── 에디터 ──
function renderEditor(k) {
  var msgs = MESSAGES[k];
  if (!msgs) { console.warn('renderEditor: MESSAGES["'+k+'"] undefined'); return; }
  var cols = ITEM_COLS[k] || [];
  var main = document.getElementById('mainArea');
  if (!main) return;

  var colHeaders = cols.map(function(col){
    var noteHtml = col.note
      ? '<div style="font-size:9px;color:rgba(255,200,100,.85);font-weight:400;margin-top:2px;white-space:normal;line-height:1.4">'+col.note+'</div>'
      : '';
    return '<th style="min-width:90px;padding:6px 8px;font-size:10px;font-weight:500;color:rgba(255,255,255,.75);background:#1E3050;border-right:1px solid rgba(255,255,255,.08);vertical-align:top" title="'+col.k+'">'+col.l+noteHtml+'</th>';
  }).join('');

  var rows = msgs.map(function(msg, i) {
    var isEd = editingId === msg.id;
    var isCh = changedIds.has(msg.id);
    var condCells = cols.map(function(col, ci) {
      var v = (msg.conds && msg.conds[col.k]) || '-';
      if (isEd) {
        if (col.k === '모순패턴') {
          return '<td class="sep"><select class="ci" style="width:100px" data-col="'+col.k+'" data-id="'+msg.id+'" onchange="updateCondBuf(this)">'
            +'<option value="-"'+(v==='-'?' selected':'')+'>-</option>'
            +'<option value="true"'+(v==='true'?' selected':'')+'>true</option>'
            +'<option value="true(선행과부하)"'+(v.includes('선행')?' selected':'')+'>true(선행과부하)</option>'
            +'</select></td>';
        }
        return '<td class="sep"><input class="ci" style="min-width:70px;width:90px" value="'+v+'" data-col="'+col.k+'" data-id="'+msg.id+'" oninput="updateCondBuf(this)"></td>';
      }
      return '<td class="sep">'+condBadge(v, col.k)+'</td>';
    }).join('');

    var tagCell = isEd
      ? '<td><select class="ci" id="etag_'+msg.id+'"><option'+(msg.tag==='강점'?' selected':'')+'>강점</option><option'+(msg.tag==='보통'?' selected':'')+'>보통</option><option'+(msg.tag==='주의'?' selected':'')+'>주의</option><option'+(msg.tag==='위험'?' selected':'')+'>위험</option></select></td>'
      : '<td><span class="tag tag-'+msg.tag+'">'+msg.tag+'</span></td>';

    var textCell = isEd
      ? '<td class="text-cell"><textarea class="ti" id="etxt_'+msg.id+'" rows="2" oninput="autoH(this)">'+msg.text+'</textarea></td>'
      : '<td class="text-cell" style="font-size:11px;line-height:1.5;white-space:normal;color:#0B1829">'+msg.text+'</td>';

    var actionCell = isEd
      ? '<td class="action-cell"><div class="btn-grp"><button class="btn-save-row" data-rowid="'+msg.id+'">저장</button><button class="btn-cancel-row" data-rowid="'+msg.id+'">취소</button></div></td>'
      : '<td class="action-cell"><div class="btn-grp"><button class="btn-edit-row" data-rowid="'+msg.id+'">수정</button><button class="btn-del-row" data-rowid="'+msg.id+'">삭제</button></div></td>';

    return '<tr id="row_'+msg.id+'"'+(isEd?' class="editing"':isCh?' class="changed"':'')+'>'
      +'<td style="color:#8E9BB0;font-size:10px;text-align:center;width:28px">'+(i+1)+'</td>'
      +condCells+tagCell+textCell+actionCell+'</tr>';
  }).join('');

  main.innerHTML = '<div class="section-hdr" style="margin-bottom:12px">'
    +'<div><h2>'+k+'</h2><p style="font-size:11px;color:#7A8CA0;margin-top:2px">조건 열은 중요도 순. "-"는 해당 조건 무관.</p></div>'
    +'<div class="section-hdr-right">'
    +'<button class="btn-add" onclick="addRow(\''+k.replace(/'/g,"\\'")+'\')">+ 행 추가</button>'
    +'</div></div>'
    +'<div class="dt-wrap"><table class="dt">'
    +'<thead><tr>'
    +'<th width="28" rowspan="2">#</th>'
    +'<th colspan="'+cols.length+'" class="grp-cond">조건 (중요도 순 →)</th>'
    +'<th rowspan="2" width="60">태그</th>'
    +'<th rowspan="2" style="min-width:200px">메시지 텍스트</th>'
    +'<th rowspan="2" width="100">액션</th>'
    +'</tr><tr>'+colHeaders+'</tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>';

  if (editingId) {
    var ta = document.getElementById('etxt_'+editingId);
    if (ta) { autoH(ta); ta.focus(); }
  }
  // 버튼 이벤트 바인딩 (data-rowid 방식)
  main.querySelectorAll('.btn-save-row[data-rowid]').forEach(function(btn){
    btn.onclick = function(){ saveRow(this.dataset.rowid); };
  });
  main.querySelectorAll('.btn-cancel-row[data-rowid]').forEach(function(btn){
    btn.onclick = function(){ cancelEdit(); };
  });
  main.querySelectorAll('.btn-edit-row[data-rowid]').forEach(function(btn){
    btn.onclick = function(){ startEdit(this.dataset.rowid); };
  });
  main.querySelectorAll('.btn-del-row[data-rowid]').forEach(function(btn){
    btn.onclick = function(){
      var rowid = this.dataset.rowid;
      delRow(curKey, rowid);
    };
  });
}

// ── 조건 버퍼 (편집 중 임시 저장) ──
var condBuf = {};
function updateCondBuf(el) {
  var id = el.dataset.id, col = el.dataset.col;
  if (!condBuf[id]) condBuf[id] = {};
  condBuf[id][col] = el.value;
}

function autoH(el){ el.style.height='auto'; el.style.height=el.scrollHeight+'px'; }

// ── CRUD ──
function startEdit(id) {
  if (editingId && editingId!==id) {
    if (!confirm('다른 행 편집 중입니다. 취소하고 이 행을 편집할까요?')) return;
  }
  condBuf = {}; editingId = id;
  // curKey가 없으면 사이드바 첫 번째 항목으로 복구
  if (!curKey) curKey = Object.keys(MESSAGES)[0];
  renderEditor(curKey);
}


function scanAllConflicts() {
  var results = [];
  Object.keys(MESSAGES).forEach(function(key) {
    var msgs = MESSAGES[key];
    var seen = {};
    msgs.forEach(function(m, i) {
      var ck = condKey(m.conds);
      if (seen[ck] === undefined) {
        seen[ck] = {idx: i, tag: m.tag, text: m.text};
      } else {
        var prev = seen[ck];
        var type = prev.tag !== m.tag ? '태그충돌' : '중복조건';
        results.push({
          item: key,
          type: type,
          row1: prev.idx+1, tag1: prev.tag, text1: prev.text.slice(0,25),
          row2: i+1,        tag2: m.tag,    text2: m.text.slice(0,25),
        });
      }
    });
  });

  if (results.length === 0) {
    showToast('✓ 충돌 없음 — 모든 항목 정상');
    return;
  }

  // 결과를 모달에 표시
  var html = results.map(function(r) {
    var color = r.type==='태그충돌' ? '#DC2626' : '#D97706';
    var bg    = r.type==='태그충돌' ? '#FEF0EE' : '#FFFBEB';
    return '<div style="background:'+bg+';border:1px solid '+color+';border-radius:6px;padding:8px 10px;margin-bottom:6px;font-size:11px">'
      +'<span style="color:'+color+';font-weight:700">'+(r.type==='태그충돌'?'⚠ 태그 충돌':'◈ 중복 조건')+'</span>'
      +' — <strong>'+r.item+'</strong><br>'
      +r.row1+'번 행 ['+r.tag1+'] '+r.text1+'...<br>'
      +r.row2+'번 행 ['+r.tag2+'] '+r.text2+'...'
      +'</div>';
  }).join('');

  document.getElementById('modalTitle').textContent = '충돌 스캔 결과 — ' + results.length + '건 발견';
  document.getElementById('jsonArea').style.display = 'none';
  var scanDiv = document.getElementById('scanResult');
  if (!scanDiv) {
    scanDiv = document.createElement('div');
    scanDiv.id = 'scanResult';
    scanDiv.style.cssText = 'flex:1;overflow-y:auto;max-height:320px';
    document.querySelector('.modal textarea').parentNode.insertBefore(scanDiv, document.querySelector('.modal textarea'));
  }
  scanDiv.style.display = 'block';
  scanDiv.innerHTML = html;
  document.getElementById('applyBtn').style.display = 'none';
  document.getElementById('copyBtn').style.display = 'none';
  document.getElementById('jsonModal').classList.add('show');
}

function condKey(conds) {
  // 조건 객체를 정렬된 문자열로 변환 (비교용)
  return JSON.stringify(Object.keys(conds).sort().reduce(function(acc, k) {
    acc[k] = conds[k]; return acc;
  }, {}));
}

function checkConflicts(key, currentId) {
  var msgs = MESSAGES[key];
  var current = msgs.find(function(m){ return m.id === currentId; });
  if (!current) return [];
  var conflicts = [];
  var currentCk = condKey(current.conds);
  msgs.forEach(function(m) {
    if (m.id === currentId) return;
    if (condKey(m.conds) === currentCk) {
      // 완전히 동일한 조건
      if (m.tag !== current.tag) {
        conflicts.push({type:'태그충돌', row: msgs.indexOf(m)+1, tag: m.tag, text: m.text.slice(0,30)+'...'});
      } else {
        conflicts.push({type:'중복조건', row: msgs.indexOf(m)+1, tag: m.tag, text: m.text.slice(0,30)+'...'});
      }
    }
  });
  return conflicts;
}

function saveRow(id) {
  var ta = document.getElementById('etxt_'+id);
  var sel = document.getElementById('etag_'+id);
  if (!ta||!sel) return;
  var msg = MESSAGES[curKey].find(function(m){ return m.id===id; });
  var orig = ORIG[curKey] && ORIG[curKey].find(function(m){ return m.id===id; });
  msg.text = ta.value.trim();
  msg.tag = sel.value;
  if (condBuf[id]) Object.assign(msg.conds, condBuf[id]);

  // 충돌 감지
  var conflicts = checkConflicts(curKey, id);
  if (conflicts.length > 0) {
    var msgs_txt = conflicts.map(function(cf) {
      return (cf.type==='태그충돌' ? '⚠ 태그 충돌' : '◈ 중복 조건')
        + ' — ' + cf.row + '번 행 [' + cf.tag + '] ' + cf.text;
    }).join('\n');
    var proceed = confirm('조건 충돌이 감지됐습니다:\n\n' + msgs_txt + '\n\n그래도 저장할까요?');
    if (!proceed) {
      // 롤백
      if (orig) { msg.text = orig.text; msg.tag = orig.tag; msg.conds = JSON.parse(JSON.stringify(orig.conds)); }
      condBuf = {};
      return;
    }
  }

  changedIds.add(id);
  if (orig && orig.text===msg.text && orig.tag===msg.tag) changedIds.delete(id);
  condBuf = {}; editingId = null;
  renderEditor(curKey); renderNav(); updateBadge();
  showToast(conflicts.length > 0 ? '저장됐습니다 (충돌 있음 — 확인 필요)' : '저장됐습니다');
}

function cancelEdit() { condBuf={}; editingId=null; renderEditor(curKey); }

function addRow(k) {
  var cols = ITEM_COLS[k] || [];
  var conds = {};
  cols.forEach(function(col){ conds[col.k]='-'; });
  var newId = k.split(')')[0].trim()+'_'+(MESSAGES[k].length+1)+'_new'+Date.now();
  MESSAGES[k].push({id:newId, tag:'주의', conds:conds, text:'새 메시지를 입력하세요'});
  editingId = newId;
  renderNav(); renderEditor(k);
  showToast('행이 추가됐습니다');
}

function delRow(k, id) {
  if (!confirm('이 행을 삭제할까요?')) return;
  MESSAGES[k] = MESSAGES[k].filter(function(m){ return m.id!==id; });
  changedIds.delete(id);
  if (editingId===id) editingId=null;
  renderNav(); renderEditor(k); updateBadge();
  showToast('삭제됐습니다');
}

function updateBadge() {
  var b = document.getElementById('changeBadge');
  b.textContent = changedIds.size+' 변경';
  b.style.display = changedIds.size>0 ? 'inline-block' : 'none';
}

// ── JSON ──
function openExport() {
  document.getElementById('modalTitle').textContent = 'JSON 내보내기';
  document.getElementById('jsonArea').value = JSON.stringify(MESSAGES,null,2);
  document.getElementById('applyBtn').style.display='none';
  document.getElementById('copyBtn').style.display='inline-block';
  document.getElementById('jsonModal').classList.add('show');
}
function openImport() {
  document.getElementById('modalTitle').textContent = 'JSON 불러오기';
  document.getElementById('jsonArea').value = '';
  document.getElementById('applyBtn').style.display='inline-block';
  document.getElementById('copyBtn').style.display='none';
  document.getElementById('jsonModal').classList.add('show');
}
function applyImport() {
  try {
    MESSAGES = JSON.parse(document.getElementById('jsonArea').value);
    ORIG = JSON.parse(JSON.stringify(MESSAGES));
    changedIds.clear(); editingId=null;
    renderNav(); if(curKey&&MESSAGES[curKey]) renderEditor(curKey);
    closeModal(); showToast('불러오기 완료');
  } catch(e){ alert('JSON 오류: '+e.message); }
}
function copyJson(){
  var ta=document.getElementById('jsonArea'); ta.select(); document.execCommand('copy');
  showToast('복사됐습니다');
}
function closeModal(){
  var modal = document.getElementById('jsonModal');
  if(modal) modal.classList.remove('show');
  var ta = document.getElementById('jsonArea'); if(ta) ta.style.display='';
  var sd = document.getElementById('scanResult'); if(sd) { sd.style.display='none'; sd.innerHTML=''; }
  var cb = document.getElementById('copyBtn'); if(cb) cb.style.display='inline-block';
}

function showToast(m) {
  var t = document.getElementById('editor-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'editor-toast';
    t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0B1829;color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;z-index:9999;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(t);
  }
  t.textContent = m;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.style.opacity = '0'; }, 2000);
}

// ── 모순패턴 레지스트리 ──
var CONTRA_RULES = [
  {
    id:"C1", name:"성적모순",
    strength:"acc", weakness:"kv",
    condition:"kv ≥ 80 AND acc ≤ 30",
    severity:"즉각",
    desc:"성적은 최상위권이나 실제 독해정확도가 매우 낮음 — 반복암기·스킬에 의존한 성적으로 추정",
    engine:"flagC", active:true
  },
  {
    id:"C2", name:"효율성모순",
    strength:"acc", weakness:"eff",
    condition:"acc ≥ 60 AND eff ≤ 40",
    severity:"조기",
    desc:"독해역량은 갖추고 있으나 효율성이 심각하게 낮음 — 선행·학원 과부하로 인한 피동적 학습 환경 의심",
    engine:"flagO", active:true
  },
  {
    id:"C3", name:"추론-성적모순",
    strength:"inf", weakness:"kv",
    condition:"inf ≥ 65 AND kv ≤ 65",
    severity:"주의",
    desc:"추론능력은 높으나 성적이 낮음 — 학습 방법·환경 문제 또는 동기 부족",
    engine:"(미구현)", active:false
  },
  {
    id:"C4", name:"어휘-정확도모순",
    strength:"voc", weakness:"acc",
    condition:"voc ≥ 75 AND acc ≤ 30",
    severity:"주의",
    desc:"어휘력은 풍부하나 독해정확도가 매우 낮음 — 독해 훈련 부재 또는 집중력·처리 속도 문제",
    engine:"(미구현)", active:false
  },
  {
    id:"C5", name:"WM-효율성모순",
    strength:"wm", weakness:"eff",
    condition:"wm ≥ 70 AND eff ≤ 40",
    severity:"주의",
    desc:"워킹메모리는 우수하나 효율성이 낮음 — 과부하 환경이 역량 발휘를 막고 있을 가능성",
    engine:"(미구현)", active:false
  },
];


function renderContraTable() {
  var tbody = document.getElementById('contraBody');
  if (!tbody) return;
  var sevStyle = {
    '즉각':{bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},
    '조기':{bg:'#FEF3C7',color:'#92400E',border:'#FDE68A'},
    '주의':{bg:'#DBEAFE',color:'#1D4ED8',border:'#93C5FD'},
    '정보':{bg:'#F1F5F9',color:'#475569',border:'#CBD5E1'}
  };
  // MESSAGES에서 모순패턴=true인 행 수집
  var contraRows = [];
  Object.keys(MESSAGES).forEach(function(itemKey) {
    MESSAGES[itemKey].forEach(function(msg) {
      var mp = msg.conds && msg.conds['모순패턴'];
      if (mp && mp !== '-') {
        contraRows.push({ itemKey: itemKey, msg: msg, mpVal: mp });
      }
    });
  });

  if (contraRows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:#9CA3AF;font-size:12px">의사결정 테이블에서 모순패턴 = true로 설정된 행이 없습니다</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  contraRows.forEach(function(row) {
    var msg = row.msg;
    var condStr = Object.keys(msg.conds)
      .filter(function(k){ return k !== '모순패턴' && msg.conds[k] !== '-'; })
      .map(function(k){ return k + ' ' + msg.conds[k]; })
      .join(' AND ');
    var sev = row.mpVal.includes('선행') ? '조기' : '즉각';
    var sevS = sevStyle[sev];
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="padding:8px 10px;border-bottom:1px solid #ECF0F6;font-size:11px;font-weight:600;color:#0B1829">'+ row.itemKey +'</td>'
      +'<td style="padding:8px 10px;border-bottom:1px solid #ECF0F6;font-family:monospace;font-size:10px;color:#0B1829">'+ (condStr || '-') +'</td>'
      +'<td style="padding:8px 10px;border-bottom:1px solid #ECF0F6"><span style="background:'+sevS.bg+';color:'+sevS.color+';border:1px solid '+sevS.border+';border-radius:10px;padding:2px 8px;font-size:10px;font-weight:600">'+sev+'</span></td>'
      +'<td style="padding:8px 10px;border-bottom:1px solid #ECF0F6"><span class="tag tag-'+msg.tag+'">'+msg.tag+'</span></td>'
      +'<td style="padding:8px 10px;border-bottom:1px solid #ECF0F6;font-size:11px;color:#4A5568;white-space:normal">'+msg.text+'</td>'
      +'<td style="padding:8px 10px;border-bottom:1px solid #ECF0F6;font-size:11px;font-family:monospace;color:#D97706">'+row.mpVal+'</td>';
    tbody.appendChild(tr);
  });
}

function editContraRow(id) {
  contraEditId = id;
  renderContraTable();
}

function cancelContraEdit() {
  contraEditId = null;
  renderContraTable();
}

function saveContraRow(id) {
  var r = CONTRA_RULES.find(function(x){ return x.id===id; });
  if (!r) return;
  r.name      = document.getElementById('ce_name').value.trim();
  r.strength  = document.getElementById('ce_str').value.trim();
  r.weakness  = document.getElementById('ce_weak').value.trim();
  r.condition = document.getElementById('ce_cond').value.trim();
  r.severity  = document.getElementById('ce_sev').value;
  r.desc      = document.getElementById('ce_desc').value.trim();
  r.engine    = document.getElementById('ce_eng').value.trim();
  contraEditId = null;
  renderContraTable();
  showToast('저장됐습니다');
}

function addContraRow() {
  var newId = 'C' + (Date.now());
  CONTRA_RULES.push({
    id:newId, name:'새 패턴',
    strength:'', weakness:'',
    condition:'', severity:'주의',
    desc:'패턴 설명을 입력하세요',
    engine:'(미구현)', active:false
  });
  contraEditId = newId;
  renderContraTable();
}

function delContraRow(id) {
  if (!confirm('이 패턴을 삭제할까요?')) return;
  CONTRA_RULES = CONTRA_RULES.filter(function(x){ return x.id!==id; });
  renderContraTable();
  showToast('삭제됐습니다');
}

// ── 엔진 코드 내보내기 ──
function openEngineExport() {
  var code = generateEngineCode();
  // 모달 생성
  var existing = document.getElementById('engineExportModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'engineExportModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999';
  modal.innerHTML = [
    '<div style="background:#fff;border-radius:14px;width:780px;max-width:95vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25)">',
      '<div style="padding:16px 20px;border-bottom:1.5px solid #E8EDF4;display:flex;align-items:center;gap:10px;flex-shrink:0">',
        '<div style="width:28px;height:28px;background:linear-gradient(135deg,#0BA98E,#0E7CC0);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">TQ</div>',
        '<div>',
          '<div style="font-size:13px;font-weight:700;color:#0B1829">📋 엔진 코드 내보내기</div>',
          '<div style="font-size:11px;color:#7A8CA0;margin-top:1px">이 코드를 복사해서 Claude에게 "엔진에 반영해줘"라고 전달하세요</div>',
        '</div>',
        '<button onclick="document.getElementById(\'engineExportModal\').remove()" style="margin-left:auto;background:none;border:none;font-size:18px;color:#9CA3AF;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1">✕</button>',
      '</div>',
      '<div style="padding:12px 20px 8px;background:#F8FAFB;border-bottom:1px solid #E8EDF4;flex-shrink:0">',
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">',
          '<span style="font-size:11px;color:#4A5568">반영 방법:</span>',
          '<span style="background:#E6F8F5;color:#065F46;border:1px solid #6EE7B7;border-radius:10px;padding:2px 10px;font-size:11px;font-weight:600">① 아래 코드 전체 복사</span>',
          '<span style="color:#9CA3AF;font-size:12px">→</span>',
          '<span style="background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;border-radius:10px;padding:2px 10px;font-size:11px;font-weight:600">② Claude에게 붙여넣기</span>',
          '<span style="color:#9CA3AF;font-size:12px">→</span>',
          '<span style="background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:10px;padding:2px 10px;font-size:11px;font-weight:600">③ "엔진에 반영해줘" 한 마디</span>',
        '</div>',
      '</div>',
      '<div style="display:flex;gap:8px;padding:10px 20px;flex-shrink:0;background:#fff;border-bottom:1px solid #E8EDF4">',
        '<button onclick="copyEngineCode()" style="padding:7px 18px;background:linear-gradient(135deg,#0BA98E,#0E7CC0);color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">📋 전체 복사</button>',
        '<div id="engineCopyMsg" style="font-size:11px;color:#0BA98E;font-weight:600;align-self:center;display:none">✓ 복사됐습니다!</div>',
        '<div style="margin-left:auto;font-size:11px;color:#9CA3AF;align-self:center">총 <strong style="color:#0B1829">' + Object.keys(MESSAGES).reduce(function(s,k){return s+MESSAGES[k].length;},0) + '</strong>개 메시지 → <strong style="color:#0B1829">' + code.split('\n').length + '</strong>줄 코드</div>',
      '</div>',
      '<textarea id="engineCodeArea" readonly style="flex:1;margin:0;padding:14px 18px;border:none;font-family:\'Consolas\',\'Monaco\',monospace;font-size:11px;line-height:1.75;color:#1E293B;background:#F8FAFC;resize:none;outline:none;overflow-y:auto">' + escHtml(code) + '</textarea>',
    '</div>'
  ].join('');

  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function copyEngineCode() {
  var ta = document.getElementById('engineCodeArea');
  if (!ta) return;
  ta.select();
  document.execCommand('copy');
  var msg = document.getElementById('engineCopyMsg');
  if (msg) {
    msg.style.display = 'block';
    setTimeout(function(){ msg.style.display='none'; }, 2500);
  }
}

function generateEngineCode() {
  var lines = [];
  lines.push('// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('// TQ 판독 엔진 — 의사결정 테이블 기반 자동 생성 코드');
  lines.push('// 생성 시각: ' + new Date().toLocaleString('ko-KR'));
  lines.push('// 총 메시지: ' + Object.keys(MESSAGES).reduce(function(s,k){return s+MESSAGES[k].length;},0) + '개');
  lines.push('// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('// 사용법: collectEvidence() 내부의 기존 코드를 이것으로 교체');
  lines.push('// 엔진전용(엔진전용:true) 항목은 별도 코드로 유지 필요');
  lines.push('');

  var sectionNum = {
    '1) 성적선행지수': 'Section 1',
    '2) 독해속도':     'Section 2',
    '3) 독서의 양':    'Section 3',
    '4) 독해의 질':    'Section 4',
    '5) 정보처리습관': 'Section 5',
    '6) 워킹메모리':   'Section 6',
    '7) 추론능력':     'Section 7',
    '8) 독해효율성':   'Section 8',
    '9) 학교학업':     'Section 9'
  };

  Object.keys(MESSAGES).forEach(function(sectionKey) {
    var items = MESSAGES[sectionKey];
    var secLabel = sectionNum[sectionKey] || sectionKey;
    lines.push('// ── ' + sectionKey + ' ──────────────────────────────────────');
    lines.push('{');
    lines.push('  var bullets = [];');
    lines.push('');

    items.forEach(function(msg) {
      if (!msg) return;
      // 엔진전용 항목은 주석 처리
      if (msg.conds && msg.conds['엔진전용'] === 'true') {
        lines.push('  // [엔진전용] ' + msg.id + ' — "' + msg.text.slice(0,50) + '"');
        lines.push('  // → 아래 조건은 엔진 코드에서 직접 처리 (conds 자동변환 불가)');
        lines.push('');
        return;
      }

      var condStr = buildCondString(msg.conds);
      var textEsc = msg.text.replace(/\\/g,'\\\\').replace(/"/g,'\\"');

      if (condStr === '') {
        // 조건 없음 (전부 -)
        lines.push('  mpush(bullets, "' + msg.id + '", "' + msg.tag + '", "' + textEsc + '");');
      } else {
        lines.push('  if (' + condStr + ') {');
        lines.push('    mpush(bullets, "' + msg.id + '", "' + msg.tag + '", "' + textEsc + '");');
        lines.push('  }');
      }
    });

    lines.push('');
    // 섹션 ev.push 추가
    var evId = sectionKey.replace(/\d+\)\s*/, '').replace(/\s/g,'');
    lines.push('  ev.push({ id: "' + evId + '", title: "' + sectionKey + '", bullets: bullets });');
    lines.push('}');
    lines.push('');
  });

  lines.push('// ━━ END ━━');
  return lines.join('\n');
}

function buildCondString(conds) {
  if (!conds) return '';
  var parts = [];

  Object.keys(conds).forEach(function(key) {
    var val = conds[key];
    if (!val || val === '-') return;

    // 엔진전용 스킵
    if (key === '엔진전용') return;

    // 변수명 매핑
    var varMap = {
      'acc':           'acc',
      'inf':           'inf',
      'voc':           'voc',
      'wm':            'wm',
      'eff':           'eff',
      'kv':            'kv',
      'engVal':        'engVal',
      'mathVal':       'mathVal',
      'spd':           'spd',
      'gap':           'gap',
      'spdGrade':      'spdGrade',
      'invSpd':        'invSpd',
      '모순패턴':      'flagC',
      'habClass.심각도':     'habClass.심각도',
      'habClass.표면음독':   'habClass.표면음독',
      'habClass.내재음독이해':'habClass.내재음독이해',
      'effChecked수':  'effChecked수',
      '독서량체크':    'effChecked수',
      'level':         'inp.uiLevel',
      'eff.독서량체크': 'effChecked수',
      'eff.밤새워':    'effChecked수',
      'eff.두꺼운책':  'effChecked수',
      'voc.심각도':    'voc'
    };

    var v = varMap[key] || key;
    var expr = parseCondExpr(v, val, key);
    if (expr) parts.push(expr);
  });

  return parts.join(' && ');
}

function parseCondExpr(varName, val, origKey) {
  // 특수 처리
  if (origKey === '모순패턴') {
    if (val === 'true') return 'flagC === true';
    if (val === 'true(선행과부하)') return 'flagO === true';
    return '';
  }
  if (origKey === 'invSpd') {
    if (val === 'true') return 'invSpd === true';
    return '';
  }
  if (origKey === 'spdGrade') {
    if (val.indexOf('·') > -1) {
      // 느림·보통 등 복합
      var opts = val.split('·').map(function(s){ return 'spdGrade === "' + s.trim() + '"'; });
      return '(' + opts.join(' || ') + ')';
    }
    if (val === '느림' || val === '보통' || val === '빠름' || val === '보통이상' || val === '보통이하') {
      return 'spdGrade === "' + val + '"';
    }
    // ≥500 같은 수치
    if (/^[≥≤<>]/.test(val)) return parseNumericExpr(varName, val);
    return '';
  }
  if (origKey === 'habClass.심각도') {
    if (val === '심함') return 'habClass.심각도 === "심함"';
    if (val === '보통') return 'habClass.심각도 === "보통"';
    if (val === '없음') return 'habClass.심각도 === "없음"';
    if (val === '보통~심함') return '(habClass.심각도 === "보통" || habClass.심각도 === "심함")';
    if (val === '<심함') return 'habClass.심각도 !== "심함"';
    if (val === '≥1') return 'habClass.심각도 !== "없음"';
    return '';
  }
  if (origKey === 'habClass.표면음독') {
    if (val === '≥1') return 'habClass.표면음독 >= 1';
    return '';
  }
  if (origKey === 'habClass.내재음독이해') {
    if (val === '≥2') return 'habClass.내재음독이해 >= 2';
    if (val === '1') return 'habClass.내재음독이해 >= 1';
    return '';
  }
  if (origKey === 'effChecked수' || origKey === '독서량체크' || origKey.indexOf('eff.') === 0) {
    if (val === '0') return '(e.effChecked||[]).length === 0';
    if (val === '체크') return 'inp.reading_effect_checks.length > 0';
    if (val === '미체크') return 'inp.reading_effect_checks.length === 0';
    // 복잡한 값은 주석으로
    return '/* ' + origKey + ':' + val + ' 수동처리 필요 */';
  }
  if (origKey === 'level' || origKey === 'inp.uiLevel') {
    if (val === '전과목>89' || val.indexOf('전과목') > -1) {
      return '/* level:' + val + ' 수동처리 필요 */';
    }
    return 'inp.uiLevel === "' + val + '"';
  }

  // gap 특수 처리
  if (origKey === 'gap') {
    if (val === '≥30(fct>str)' || val === '≥30') return 'gap >= 30';
    if (val === '≤-20(str>fct)' || val === '≤-20') return 'gap <= -20';
    if (val === '<30') return 'gap < 30';
    if (val === '<20') return 'gap < 20';
    if (val === '≥20') return 'gap >= 20';
    if (val === 'str>fct') return 'gap < 0';
    if (val === '균형') return 'Math.abs(gap) < 20';
    if (val.indexOf('fct<') > -1) return '/* gap:' + val + ' 수동처리 필요 */';
    return '/* gap:' + val + ' 수동처리 필요 */';
  }

  // 복잡한 비교 (acc보다 20↓ 등)
  if (val.indexOf('acc보다') > -1 || val.indexOf('↓') > -1 || val.indexOf('↑') > -1) {
    return '/* ' + origKey + ':' + val + ' 수동처리 필요 */';
  }
  if (val === '高') return varName + ' >= 65';
  if (val === '低') return varName + ' < 50';

  // 수치 범위 표현 파싱
  return parseNumericExpr(varName, val);
}

function parseNumericExpr(varName, val) {
  // ≥70
  var m = val.match(/^≥(\d+)$/);
  if (m) return varName + ' >= ' + m[1];
  // ≤70
  m = val.match(/^≤(\d+)$/);
  if (m) return varName + ' <= ' + m[1];
  // >70
  m = val.match(/^>(\d+)$/);
  if (m) return varName + ' > ' + m[1];
  // <70
  m = val.match(/^<(\d+)$/);
  if (m) return varName + ' < ' + m[1];
  // 30~49 (범위)
  m = val.match(/^(\d+)~(\d+)$/);
  if (m) return '(' + varName + ' >= ' + m[1] + ' && ' + varName + ' <= ' + m[2] + ')';
  // 알 수 없음 → 주석
  return '/* ' + varName + ':' + val + ' 확인필요 */';
}

// 초기 렌더링 트리거 — switchTab에서 호출
// MESSAGES는 서버 연동 후 의사결정 테이블 편집 탭에서만 사용됩니다

function safeRenderNav() {
  if(typeof renderNav==='function' && Object.keys(MESSAGES).length > 0) {
    renderNav();
    var firstKey = Object.keys(MESSAGES)[0];
    if(firstKey && typeof selectItem==='function') selectItem(firstKey);
  }
}
safeRenderNav();

// ══════════════════════════════════════════════════════
// tqdata JSON → 숨겨진 폼에 주입 후 분석 실행
// ══════════════════════════════════════════════════════
function injectTqDataAndRun(d) {
  // 학제 정규화
  var _lvNorm2 = {'초저':'초등','초고':'초등','초등(저)':'초등','초등(고)':'초등',
    '초등':'초등','중등':'중등','고등':'고등','N수생':'고등','일반':'일반'};
  if (d.user_section) d.user_section = _lvNorm2[d.user_section] || d.user_section;
  // reg_date → YYYY-MM-DD 형식 정규화
  if (d.reg_date && d.reg_date.length > 10) d.reg_date = d.reg_date.slice(0, 10);

  // 검사일 세팅
  var dateEl = document.getElementById('iDate');
  if (dateEl && d.reg_date) dateEl.value = d.reg_date;
  // 이름
  if (d.name) { var elN = document.getElementById('iName'); if(elN) elN.value = d.name; }

  // 학제
  var lvRemap = {"초저":"초등","초고":"초등","초등":"초등","중등":"중등","고등":"고등","일반":"일반"};
  var mappedLv = lvRemap[d.user_section] || d.user_section || "중등";
  var lvSel = document.getElementById('iLevel');
  if (lvSel) {
    for (var i=0; i<lvSel.options.length; i++) {
      if (lvSel.options[i].value === mappedLv) { lvSel.selectedIndex=i; break; }
    }
    if(window.onLevelChange) window.onLevelChange();
    if(window.buildScores) window.buildScores();
    if(window.buildGrade) window.buildGrade();
  }

  // 학년
  if (d.user_school_grade != null) {
    var grSel = document.getElementById('iGrade');
    if (grSel) {
      for (var j=0; j<grSel.options.length; j++) {
        if (String(grSel.options[j].value) === String(d.user_school_grade)) { grSel.selectedIndex=j; break; }
      }
    }
  }

  // 성적 드롭다운 매핑
  // tqdata 필드명(kor_score) → select id(sS0)
  // SAMPLES 필드명(kor/eng/math) → 동일 select
  function setSelectVal(elId, val) {
    if (val == null) return;
    var sel = document.getElementById(elId);
    if (!sel) return;
    var vs = String(val);
    for (var k=0; k<sel.options.length; k++) {
      if (sel.options[k].value === vs) { sel.selectedIndex=k; return; }
    }
  }
  // tqdata 방식 (kor_score / eng_score / math)
  setSelectVal('sS0', d.kor_score);
  setSelectVal('sS1', d.eng_score);
  setSelectVal('sS2', d.math_score);

  // 수치 입력 (슬라이더 + 숫자표시 span 동시 갱신)
  function setSlider(sliderId, val) {
    if (val == null) return;
    var el = document.getElementById(sliderId);
    if (el) { el.value = val; el.dispatchEvent(new Event('input')); }
    var sp = document.getElementById(sliderId+'V');
    if (sp) sp.textContent = val;
  }
  setSlider('sFct', d.fact_score);
  setSlider('sStr', d.structure_score);  // SAMPLES는 str_, tqdata는 str
  setSlider('sVoc', d.voca_score);
  setSlider('sWm',  d.wm_score);
  setSlider('sInf', d.inference_score);

  // 독해속도
  if (d.reading_score != null) {
    var spdEl = document.getElementById('sSpd');
    if (spdEl) spdEl.value = d.reading_score;
  }

  if(window.updateAccuracy) window.updateAccuracy();

  // 독해습관 체크리스트 (tqdata: hab_checks / SAMPLES: habChecks)
  var hArr = Array.isArray(d.reading_habit_checks) ? d.reading_habit_checks.map(function(v){return !!v;}) : [];
  if (Array.isArray(hArr)) {
    hArr.forEach(function(v, i) {
      var el = document.getElementById('h'+i); if(el) el.checked = !!v;
    });
  }
  // 독해효율성 체크리스트 (tqdata: eff_checks / SAMPLES: effChecks)
  var eArr = Array.isArray(d.reading_effect_checks) ? d.reading_effect_checks.map(function(v){return !!v;}) : [];
  if (Array.isArray(eArr)) {
    eArr.forEach(function(v, i) {
      var el = document.getElementById('e'+i); if(el) el.checked = !!v;
    });
  }
  if(window.updateChkScore) window.updateChkScore();

  // 기존 판독 결과 조회 → 있으면 복원, 없으면 엔진 실행
  if (d.name && d.reading_score && d.reg_date) {
    var _loaded = false;  // 로드 완료 플래그
    loadTqResult(d.name, d.user_school_grade, d.reading_score, function(saved) {
      _loaded = true;
      // ── 기존 결과 발견 — 단계별 복원 ──

      // 1단계: 전역 상태 세팅
      window.__nm          = d.name;
      window.__inp         = saved.inp;
      window.__eng         = saved.eng;
      window.__TQ_SLOTS    = saved.slots;
      window.__TQ_SAVED_ID = saved.id;
      window.__RPT_D       = null;  // 이전 세션 presc 초기화
      console.log("[TQ] 로드된 slots:", saved.slots ? Object.keys(saved.slots) : "없음");

      // 2단계: 폼 필드 복원 (검사일 포함)
      if (saved.inp) injectTqDataAndRun.__formOnly(saved.inp);

      // 3단계: 결과 페이지 전환
      showResultPage(d.name);

      setTimeout(function() {
        // 4단계: 판독 탭 화면 렌더
        var rv = document.getElementById('resultView');
        if (rv && saved.eng && saved.inp) {
          // evidence가 없으면 엔진 재실행으로 보충
          function _doRender(engObj) {
            try { rv.innerHTML = renderResult(engObj, saved.inp.name || d.name); } catch(e){ console.error('[renderResult]',e); }
            try { runEntryAnimation(rv, engObj, saved.inp); } catch(e){ console.error('[runEntryAnimation]',e); }
          }
          // roadmapReasons 복원
          if (saved.slots && saved.slots.roadmap_reasons) {
            try {
              var _rr2 = typeof saved.slots.roadmap_reasons === 'string'
                ? JSON.parse(saved.slots.roadmap_reasons) : saved.slots.roadmap_reasons;
              saved.eng.roadmapReasons = _rr2;
            } catch(e){}
          }
          if (!saved.eng.evidence) {
            fetch(TQ_API_URL, {
              method:'POST',
              headers:{'Content-Type':'application/json','x-academy-token':TQ_API_TOKEN},
              body:JSON.stringify({action:'engine', inp:saved.inp})
            }).then(function(r){ return r.json(); })
            .then(function(res){
              if (res.ok && res.engine && res.engine.evidence) {
                Object.assign(saved.eng, {evidence: res.engine.evidence, btDisplay: res.engine.btDisplay, stDisplay: res.engine.stDisplay});
                window.__eng = saved.eng;
              }
              _doRender(saved.eng);
            }).catch(function(){ _doRender(saved.eng); });
          } else {
            _doRender(saved.eng);
          }
        }

        // 5단계: 버튼 활성화
        var btnR = document.getElementById('btnR');
        if (btnR) btnR.disabled = false;
        var btnB = document.getElementById('btnB');
        if (btnB) { btnB.disabled = false; btnB.textContent = '② 판독문 생성 — Claude AI'; }

        // 6단계: 리포트 탭 "✓ 생성 완료" 표시 (showResultPage가 탭바를 건드리므로 이후에 실행)
        var _tabRpt = document.getElementById('resultTab_리포트');
        if (_tabRpt) {
          _tabRpt.style.color = '#34D399';
          _tabRpt.style.borderBottomColor = 'transparent';
          _tabRpt.innerHTML = '📄 리포트 <span style="font-size:10px;color:#34D399;font-weight:700;margin-left:4px">✓ 생성 완료</span>';
        }

        // 7단계: 편집바 활성화
        editBarReady = true;
        try {
          if (document.getElementById('editBar')) rebuildEditBar();
          else showEditBar();
        } catch(e){}

        // 8단계: 리포트 렌더
        window.__reportRendered = false;
        // slots 유효성 보장: window.__TQ_SLOTS가 비어있으면 saved.slots로 재세팅
        if (!window.__TQ_SLOTS || !window.__TQ_SLOTS.slot1) {
          if (saved.slots && saved.slots.slot1) {
            window.__TQ_SLOTS = saved.slots;
            console.log('[TQ] slots 재세팅 완료');
          }
        }
        if (window.__TQ_SLOTS && window.__TQ_SLOTS.slot1) {
          try { renderReportTab(); window.__reportRendered = true; } catch(e){ console.error('[renderReportTab]',e); }
        } else {
          console.warn('[TQ] slots 없음 — renderReportTab 건너뜀');
        }

        // 9단계: 탭 상태 재확인 (renderReportTab이 덮어쓸 수 있으므로 한 번 더)
        setTimeout(function() {
          var _t = document.getElementById('resultTab_리포트');
          if (_t && window.__TQ_SLOTS) {
            _t.style.color = '#34D399';
            _t.innerHTML = '📄 리포트 <span style="font-size:10px;color:#34D399;font-weight:700;margin-left:4px">✓ 생성 완료</span>';
          }
          // 권장훈련 버튼 재활성화
          if (editBarReady) {
            try {
              if (document.getElementById('editBar')) rebuildEditBar();
            } catch(e){}
          }
        }, 500);

        if(saved.reg_date || saved.test_date) var _tDate = (saved.created_at || '').slice(0,10);
if(_tDate) showSavedResultToast(_tDate);
      }, 300);
    });
    // 3초 후에도 로드 안 됐으면 → 새로 엔진 실행 (로드 성공 시 절대 실행 안 됨)
    setTimeout(function() {
      if (!_loaded && !window.__TQ_SLOTS) {
        var btnA = document.getElementById('btnA');
        if (btnA) btnA.click();
      }
    }, 3000);
  } else {
    setTimeout(function() {
      window.__inp = d;
      var btnA = document.getElementById('btnA');
      if (btnA) btnA.click();
    }, 80);
  }
}
window.injectTqDataAndRun = injectTqDataAndRun;

// 폼 필드만 채우는 헬퍼 (엔진 실행 없음) — 로드 복원용
injectTqDataAndRun.__formOnly = function(inp) {
  if (!inp) return;
  var dateEl = document.getElementById('iDate');
  if (dateEl && inp.reg_date) dateEl.value = inp.reg_date;
  var nameEl = document.getElementById('iName');
  if (nameEl && inp.name) nameEl.value = inp.name;
  // 슬라이더 복원
  function setSlider(id, val) {
    if (val == null) return;
    var el = document.getElementById(id);
    if (el) { el.value = val; el.dispatchEvent(new Event('input')); }
    var sp = document.getElementById(id+'V');
    if (sp) sp.textContent = val;
  }
  setSlider('sFct', inp.fact_score);
  setSlider('sStr', inp.structure_score !== undefined ? inp.structure_score : inp.structure_score);
  setSlider('sVoc', inp.voca_score);
  setSlider('sWm',  inp.wm_score);
  setSlider('sInf', inp.inference_score);
  var spdEl = document.getElementById('sSpd');
  if (spdEl && inp.reading_score) spdEl.value = inp.reading_score;
  // 체크리스트 복원
  var habChecked = inp.reading_habit_checks || [];
  var HAB = ["이미 읽은 곳을 다시 읽음","읽다가 글줄을 자주 놓침","짚어가며 읽거나 밑줄을 그음","단어 단위로 또박또박 읽음","소리 내어 읽거나 속발음을 함","긴 문장은 이해가 잘 안됨","긴 문장은 훑어 읽기를 함","긴 글은 내용 기억이 잘 안남","모르는 단어가 없어도 이해가 잘 안됨","글 읽는 속도가 느린 편임"];
  HAB.forEach(function(item, i) {
    var el = document.getElementById('h'+i);
    if (el) el.checked = habChecked.indexOf(item) > -1;
  });
  var effChecked = inp.reading_effect_checks || [];
  var EFF = ["독서량이 많이 부족한 편이다","비문학 책은 어렵게 느껴진다","이해력이 부족한 편이다","시험에서 시간에 쫓긴다","문제를 이해를 못해서 틀린다","서술형 평가 시험 점수가 낮다","지문형 수학문제가 어렵다","국어 시험 점수가 유난히 낮다","두꺼운 책을 읽은 경험이 없다","밤새워 책을 읽은 경험이 없다"];
  EFF.forEach(function(item, i) {
    var el = document.getElementById('e'+i);
    if (el) el.checked = effChecked.indexOf(item) > -1;
  });
  if (window.updateChkScore) window.updateChkScore();
  if (window.updateAccuracy) window.updateAccuracy();
};

// 랜딩 화면의 샘플 버튼 → SAMPLES 데이터를 직접 주입 후 실행
function runSampleDirect(idx) {
  var _S = window.SAMPLES || SAMPLES;
  var s = _S[idx];
  if (!s) return;
  injectTqDataAndRun(s);
}
window.runSampleDirect = runSampleDirect;

document.addEventListener('DOMContentLoaded', function() {
  safeRenderNav();
  v5Switch('판독');

  // 숨겨진 폼 DOM 초기화 (buildScores / buildGrade / buildFactors / buildChecklists)
  if(window.buildScores) window.buildScores();
  if(window.buildGrade) window.buildGrade();
  if(window.buildFactors) window.buildFactors();
  if(window.buildChecklists) window.buildChecklists();
  if(window.updateAccuracy) window.updateAccuracy();
  document.getElementById("iGrade").value = "2";

  // URL 파라미터 ?tqdata=... 감지 → B안: 랜딩 건너뛰고 바로 분석
  var params = new URLSearchParams(window.location.search);
  var tqRaw = params.get('tqdata');

  if (tqRaw) {
    // 랜딩 페이지 즉시 숨김 (로딩 깜빡임 방지)
    var landingEl = document.getElementById('page-input');
    if (landingEl) landingEl.style.display = 'none';
    setTimeout(function() {
      try {
        var d = JSON.parse(decodeURIComponent(tqRaw));

        // 학제 정규화: "초등(고)", "N수생" 등 처리
        var _lvNorm = {'초저':'초등','초고':'초등','초등(저)':'초등','초등(고)':'초등',
          '초등':'초등','중등':'중등','고등':'고등','N수생':'고등','일반':'일반'};
        if (d.user_section) d.user_section = _lvNorm[d.user_section] || d.user_section;

        // 기존 판독 결과 조회 — 있으면 자동 로드
        if (d.name && d.reading_score) {
          loadTqResult(d.name, d.user_school_grade, d.reading_score, function(saved) {
            // 기존 결과 발견 → 엔진 결과와 슬롯 복원 후 결과 페이지 표시
            window.__inp  = d;
            window.__eng  = saved.eng;
            if (window.__eng && d.reg_date) window.__eng.date = d.reg_date.slice(0,10);
            window.__nm   = d.name;
            window.__TQ_SLOTS = saved.slots;
            window.__TQ_SAVED_ID = saved.id;
            // 판독 페이지로 이동
            if (typeof runAnalysisDirect === 'function') {
              runAnalysisDirect(d);
            } else {
              var btnA = document.getElementById('btnA');
              if (btnA) btnA.click();
            }
            setTimeout(function() {
              // 슬롯 복원 후 리포트 렌더
              window.__TQ_SLOTS = saved.slots;
              if (!window.__reportRendered) {
                // eng.date 보완 (load 경로)
                if (window.__eng && window.__inp && window.__inp.reg_date) {
                  window.__eng.date = window.__inp.reg_date.slice(0,10);
                }
                try { renderReportTab(); window.__reportRendered = true; } catch(e){}
              }
              // 저장된 결과 알림
              if(saved.reg_date || saved.test_date) var _tDate = (saved.created_at || '').slice(0,10);
if(_tDate) showSavedResultToast(_tDate);
            }, 1500);
          });
        }
        injectTqDataAndRun(d);
      } catch(err) {
        console.warn('tqdata 파싱 실패:', err);
        // 파싱 실패 시 랜딩 페이지 복원
        if (landingEl) landingEl.style.display = 'flex';
      }
    }, 200);
  }
  // tqdata 없음 → 랜딩 페이지 표시 (기존 동작)
});

// ── postMessage 수신 — DOMContentLoaded 바깥 ──
window.addEventListener('message', function(event) {
  // ★ 디버그: 모든 메시지 무조건 로그
  try {
    console.log('[TQ] 메시지 수신 origin:', event.origin);
    console.log('[TQ] 메시지 data 타입:', typeof event.data, event.data === null ? 'null' : '');
    if (event.data) {
      console.log('[TQ] data 내용:', JSON.stringify(event.data).slice(0, 200));
    }
  } catch(e) { console.log('[TQ] 로그 오류:', e.message); }

  if (!event.data) return;

  // 발신 출처 검증
  function isAllowedOrigin(origin) {
    if (!origin) return false;
    if (origin === 'http://localhost' || origin.startsWith('http://localhost:')) return true;
    try {
      var host = new URL(origin).hostname;
      return host.endsWith('.sfos.kr') || host === 'sfos.kr'
          || host.endsWith('.sfcenter.co.kr') || host === 'sfcenter.co.kr';
    } catch(e) { return false; }
  }
  if (!isAllowedOrigin(event.origin)) {
    console.warn('[TQ] 출처 거부:', event.origin);
    return;
  }
  console.log('[TQ] 출처 허용:', event.origin);

  var msg = event.data;
  console.log('[TQ] msg.type:', msg.type, '/ msg.data 존재:', !!msg.data);
  if (!msg || msg.type !== 'tqdata' || !msg.data) {
    console.warn('[TQ] 형식 불일치 — type:', msg && msg.type);
    return;
  }

  var d = msg.data;
  if (!d.name) { console.warn('[TQ] name 없음'); return; }

  console.log('[TQ] 수신 데이터 전체:', JSON.stringify(d, null, 2));

  // 학제 정규화
  var _lvNorm = {'초저':'초등','초고':'초등','초등(저)':'초등','초등(고)':'초등',
    '초등':'초등','중등':'중등','고등':'고등','N수생':'고등','일반':'일반'};
  if (d.user_section) d.user_section = _lvNorm[d.user_section] || d.user_section;

  // 랜딩 페이지 즉시 숨김
  var landingEl = document.getElementById('page-input');
  if (landingEl) landingEl.style.display = 'none';

  // 로딩 인디케이터
  var loadingDiv = document.getElementById('_postMsgLoading');
  if (!loadingDiv) {
    loadingDiv = document.createElement('div');
    loadingDiv.id = '_postMsgLoading';
    loadingDiv.style.cssText = 'position:fixed;inset:0;background:#020617;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;z-index:9999;';
    loadingDiv.innerHTML = '<div style="width:40px;height:40px;border:3px solid rgba(139,92,246,.3);border-top-color:#8B5CF6;border-radius:50%;animation:tq-spin .8s linear infinite"></div><div style="color:rgba(255,255,255,.7);font-size:13px;">데이터 수신 중...</div>';
    document.body.appendChild(loadingDiv);
  }

  // 기존 판독 결과 조회
  if (d.name && d.reading_score) {
    loadTqResult(d.name, d.user_school_grade, d.reading_score, function(saved) {
      window.__inp  = d;
      window.__eng  = saved.eng;
      window.__nm   = d.name;
      window.__TQ_SLOTS    = saved.slots;
      window.__TQ_SAVED_ID = saved.id;
      var btnA = document.getElementById('btnA');
      if (btnA) btnA.click();
      setTimeout(function() {
        window.__TQ_SLOTS = saved.slots;
        if (!window.__reportRendered) {
          try { renderReportTab(); window.__reportRendered = true; } catch(e){}
        }
        if(saved.reg_date || saved.test_date) var _tDate = (saved.created_at || '').slice(0,10);
if(_tDate) showSavedResultToast(_tDate);
      }, 1500);
    });
  }
  injectTqDataAndRun(d);

  event.source.postMessage({ type: 'tqdata_received', name: d.name }, event.origin);
});
</script>

// ── Resizer ──
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
