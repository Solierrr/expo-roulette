import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {replenish, availableConfig, reserveResult, pickAndReserve, STOCK_KEY} from './public/inventory.mjs';
const config = JSON.parse(await readFile(new URL('./public/config.json',import.meta.url)));
const HOUR=3600000, start=Date.parse(config.releaseStartsAt);
const probability = (data,id) => {const enabled=data.items.filter(i=>i.enabled);return enabled.find(i=>i.id===id).weight/enabled.reduce((s,i)=>s+i.weight,0);};
test('zero quota until noon, exact hourly boundaries and accumulated idle hours',()=>{
  const state=replenish(config,null,start);
  assert.equal(state.balances.byte.available,0);assert.equal(state.balances.brownie.available,0);
  const before=replenish(config,state,start+HOUR-1);assert.equal(before.balances.byte.available,0);assert.equal(before.balances.brownie.available,0);
  const after=replenish(config,state,start+HOUR);assert.equal(after.balances.byte.available,1);assert.equal(after.balances.brownie.available,5);
  const twoHours=replenish(config,state,start+2*HOUR);assert.equal(twoHours.balances.byte.available,2);assert.equal(twoHours.balances.brownie.available,10);
  const idle=replenish(config,state,start+5*HOUR);assert.equal(idle.balances.byte.available,5);assert.equal(idle.balances.brownie.available,25);
  assert.deepEqual(replenish(config,JSON.parse(JSON.stringify(idle)),start+5*HOUR),idle);
  assert.deepEqual(replenish(config,null,start+5*HOUR),idle);
  const early=replenish(config,null,start-HOUR);assert.equal(early.balances.byte.available,0);
});
test('a Byte win consumes quota and cannot win again before replenishment',()=>{
  const forced={...config,forcedResultId:'byte'};
  assert.throws(()=>reserveResult(forced,null,start+HOUR-1));
  const first=reserveResult(forced,null,start+HOUR);assert.equal(first.item.id,'byte');assert.equal(first.state.balances.byte.available,0);
  assert.throws(()=>reserveResult(forced,first.state,start+2*HOUR-1));
  const second=reserveResult(forced,first.state,start+2*HOUR);assert.equal(second.item.id,'byte');assert.equal(second.state.balances.byte.available,0);
});
test('five Brownies release at noon and another five at 13h',()=>{
  const forced={...config,forcedResultId:'brownie'};let state=null;
  assert.throws(()=>reserveResult(forced,null,start+HOUR-1));
  for(let i=0;i<5;i++)state=reserveResult(forced,state,start+HOUR+i).state;
  assert.equal(state.balances.brownie.available,0);assert.throws(()=>reserveResult(forced,state,start+HOUR+100));
  assert.equal(reserveResult(forced,state,start+2*HOUR).state.balances.brownie.available,4);
});
test('Byte chance is low, positive and increases with accumulated stock',()=>{
  const first=availableConfig(config,replenish(config,null,start+HOUR));
  const p=probability(first,'byte');assert.ok(p>0&&p<.01);
  const later=availableConfig(config,replenish(config,replenish(config,null,start),start+4*HOUR));
  assert.ok(probability(later,'byte')>p);
  assert.equal(probability(first,'marca-pagina')*2,probability(first,'kit-chaveiro'));
});
test('only unlimited prizes can win before noon and do not consume stock',()=>{
  const state=replenish(config,null,start);
  for(let i=0;i<100;i++){const result=reserveResult(config,state,start,()=>i/100);assert.ok(['marca-pagina','kit-chaveiro'].includes(result.item.id));assert.deepEqual(result.state,state);}
});
test('corrupt saved state and clock rollback fail closed',()=>{
  assert.throws(()=>replenish(config,{},start));const state=replenish(config,null,start);
  assert.throws(()=>replenish(config,state,start-1));state.balances.byte.spent=-1;assert.throws(()=>replenish(config,state,start));
});
test('reload preserves consumed prizes and cannot create another initial quota',()=>{
  const forced={...config,forcedResultId:'byte'};
  const result=reserveResult(forced,null,start+HOUR);
  const state=replenish(config,JSON.parse(JSON.stringify(result.state)),start+HOUR+1);
  assert.equal(state.balances.byte.available,0);
  assert.equal(state.balances.byte.spent,1);
  assert.equal(replenish(config,state,start+2*HOUR).balances.byte.available,1);
});
test('browser reservations save before returning and serialize concurrent tabs',async()=>{
  const entries=new Map();let queue=Promise.resolve();
  const originalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const originalNow=Date.now;
  try {
    Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)}});
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:(_key,callback)=>{const current=queue.then(callback);queue=current.catch(()=>{});return current;}}}});
    Date.now=()=>start+HOUR;
    const forced={...config,forcedResultId:'byte'};
    const results=await Promise.allSettled([pickAndReserve(forced),pickAndReserve(forced)]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.equal(JSON.parse(entries.get(STOCK_KEY)).balances.byte.spent,1);
  } finally {
    Date.now=originalNow;
    if(originalStorage)Object.defineProperty(globalThis,'localStorage',originalStorage);else delete globalThis.localStorage;
    if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
  }
});
