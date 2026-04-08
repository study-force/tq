-- ══════════════════════════════════════════════════════════════
-- TQ Rules Migration: 누락된 6개 규칙 추가 (eng_8_23 ~ eng_8_28)
-- 독해효율성(area=8) 자기인식부족 / 체크수 관련 규칙
-- Source: index.ts lines 245~258
-- ══════════════════════════════════════════════════════════════

-- eng_8_23: 자기인식부족=true, 괴리정도>=4 (acc<70이면서 체크수가 기대체크수-4 이하)
INSERT INTO tq_rules (area, area_name, rule_id, tag, message, conditions, sort_order) VALUES
(8, '독해효율성', 'eng_8_23', '위험',
 '역량 수준에 비해 체크 항목이 현저히 적음 — 자신의 학습 상태를 심각하게 과대평가하고 있거나 문제를 전혀 인지하지 못하는 상태',
 '{"자기인식부족":"true","괴리정도":">=4"}', 12);

-- eng_8_24: 자기인식부족=true, 괴리정도>=4 (eng_8_23과 동시 발화)
INSERT INTO tq_rules (area, area_name, rule_id, tag, message, conditions, sort_order) VALUES
(8, '독해효율성', 'eng_8_24', '위험',
 '자기 인식이 부족한 학습자의 전형적 패턴 — 객관적 역량과 자기 평가 간의 괴리가 클수록 개선 의지를 이끌어내기 어려움',
 '{"자기인식부족":"true","괴리정도":">=4"}', 13);

-- eng_8_25: 자기인식부족=true, 괴리정도>=3 (but <4)
INSERT INTO tq_rules (area, area_name, rule_id, tag, message, conditions, sort_order) VALUES
(8, '독해효율성', 'eng_8_25', '위험',
 '자신의 공부 문제를 충분히 인지하지 못하고 있거나 스스로에게 관대한 편',
 '{"자기인식부족":"true","괴리정도":">=3","괴리정도_max":"<4"}', 14);

-- eng_8_26: 자기인식부족=true, 괴리정도>=3 (but <4, eng_8_25와 동시 발화)
INSERT INTO tq_rules (area, area_name, rule_id, tag, message, conditions, sort_order) VALUES
(8, '독해효율성', 'eng_8_26', '주의',
 '자기 인식과 실제역량의 괴리가 클수록 개선 의지를 이끌어내기 어려움',
 '{"자기인식부족":"true","괴리정도":">=3","괴리정도_max":"<4"}', 15);

-- eng_8_27: 자기인식부족=true, 괴리정도<3 (else branch)
INSERT INTO tq_rules (area, area_name, rule_id, tag, message, conditions, sort_order) VALUES
(8, '독해효율성', 'eng_8_27', '주의',
 '자신에 대한 평가가 관대한 편 — 스스로 문제없다고 여기지만 실제 역량과 괴리가 있는 상태',
 '{"자기인식부족":"true","괴리정도":"<3"}', 16);

-- eng_8_28: acc>=70, acc<80, 총체크수===0, uiLevel!=="고등"
INSERT INTO tq_rules (area, area_name, rule_id, tag, message, conditions, sort_order) VALUES
(8, '독해효율성', 'eng_8_28', '보통',
 '현재는 학습에 큰 어려움을 느끼지 않는 상태',
 '{"acc":">=70","acc_max":"<80","총체크수":"0","uiLevel":"!고등"}', 17);
