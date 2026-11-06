import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chooseResult,validateConfig,targetRotation,normalize,visualSegments,visualIndex} from './public/rules.mjs';
const config = JSON.parse(await readFile(new URL('./public/config.json',import.meta.url)));
test('repeated segments preserve prize rules and all copies can land at the pointer', () => {
  const segments = visualSegments(config);
  assert.equal(segments.length,8);
  for (const item of config.items) {
    assert.equal(segments.filter(segment=>segment.id===item.id).length,2);
    for (const random of [0,.4,.99]) {
      const index=visualIndex(segments,item.id,()=>random);
      const angle=targetRotation(0,index,segments.length,7);
      assert.equal(segments[index].id,item.id);
      assert.ok(Math.abs(normalize(angle+(index+.5)*360/segments.length))<1e-7);
    }
  }
  for (const random of [0,.25,.5,.99]) assert.equal(chooseResult(config,()=>random).id,chooseResult({...config,visualRepeats:1},()=>random).id);
});
test('blocked and zero-weight items never win across the full sample interval', () => {
  const data = structuredClone(config); data.items[0].weight = 0;
  for (let i=0;i<10000;i++) {const result=chooseResult(data,()=>i/10000); assert.equal(result.enabled,true); assert.ok(result.weight>0);}
});
test('weights define exact selection intervals', () => {
  const data = structuredClone(config); data.items = data.items.slice(0,2); data.items[0].weight=1;data.items[1].weight=3;
  assert.equal(chooseResult(data,()=>.24999).id,data.items[0].id);assert.equal(chooseResult(data,()=>.25).id,data.items[1].id);
});
test('forced selection works and blocked forced selection fails closed', () => {
  const data=structuredClone(config);data.forcedResultId='marca-pagina';assert.equal(chooseResult(data).id,'marca-pagina');
  data.forcedResultId='kit';assert.throws(()=>chooseResult(data));data.forcedResultId='missing';assert.throws(()=>chooseResult(data));
});
test('all targets land at the pointer center over repeated spins', () => {
  let current=0;
  for(let count=2;count<=24;count++)for(let index=0;index<count;index++){
    const target=targetRotation(current,index,count,7);assert.ok(target-current>=7*360);
    assert.ok(Math.min(normalize(target+(index+.5)*360/count),360-normalize(target+(index+.5)*360/count))<1e-7);current=normalize(target);
  }
});
test('invalid JSON rules fail validation', () => {
  for(const change of [d=>d.items.forEach(i=>i.enabled=false),d=>d.items[0].weight=-1,d=>d.items[1].id=d.items[0].id,d=>d.durationMs=NaN,d=>d.turns=2,d=>d.items[0].enabled='false']) {const data=structuredClone(config);change(data);assert.throws(()=>validateConfig(data));}
});
