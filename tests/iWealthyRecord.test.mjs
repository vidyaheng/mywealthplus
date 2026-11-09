// node --experimental-strip-types --test tests/iWealthyRecord.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { serializeIWealthyPlan, deserializeIWealthyPlan } from '../src/lib/iWealthyRecord.ts';

const plan = {
  iWealthyAge: 35, iWealthyGender: 'female', iWealthyPaymentFrequency: 'annual',
  iWealthyRpp: 100000, iWealthyRtu: 25000, iWealthySumInsured: 6000000,
  iWealthyInvestmentReturn: 6.5,
  iWealthyPausePeriods: [{id:'p', startAge:40, endAge:42, type:'age'}],
  iWealthySumInsuredReductions: [{id:'r', age:50, newSumInsured:4000000}],
  iWealthyWithdrawalPlan: [{id:'w', type:'annual', amount:80000, startAge:55, endAge:60, refType:'age'}],
  iWealthyFrequencyChanges: [{id:'f', startAge:43, endAge:45, frequency:'monthly', type:'age'}],
  iWealthyAdditionalInvestments: [{id:'a', type:'annual', amount:15000, startAge:44, endAge:47, refType:'age'}],
};
const roundtrip = (value) => deserializeIWealthyPlan(JSON.parse(JSON.stringify(serializeIWealthyPlan(value))));

test('Create: five controls + investment return + base values survive JSON', () => {
  assert.deepEqual(roundtrip(plan), plan);
});
test('Overwrite: changed investment return and emptied controls replace prior values', () => {
  const updated = {...plan, iWealthyInvestmentReturn:3,
    iWealthyPausePeriods:[], iWealthyWithdrawalPlan:[], iWealthyFrequencyChanges:[]};
  assert.deepEqual(roundtrip(updated), updated);
});
test('Plan A to legacy B: old sumInsuredReductions load; missing controls clear, return defaults to 5', () => {
  assert.equal(roundtrip(plan).iWealthyPausePeriods.length, 1);
  const legacy = {age:42, gender:'male', paymentFrequency:'quarterly', rpp:90000, rtu:0,
    sumInsured:4500000, sumInsuredReductions:[{age:48,newSumInsured:3500000}]};
  const b = deserializeIWealthyPlan(legacy);
  assert.equal(b.iWealthySumInsuredReductions.length, 1);
  assert.equal(b.iWealthyInvestmentReturn, 5);
  for(const key of ['iWealthyPausePeriods','iWealthyWithdrawalPlan',
    'iWealthyFrequencyChanges','iWealthyAdditionalInvestments']) assert.deepEqual(b[key],[]);
});
test('Zero-config and mixed-config plans round-trip without phantom controls', () => {
  const zero = {...plan, iWealthyPausePeriods:[], iWealthySumInsuredReductions:[],
    iWealthyWithdrawalPlan:[], iWealthyFrequencyChanges:[], iWealthyAdditionalInvestments:[]};
  assert.deepEqual(roundtrip(zero),zero);
  const mixed = {...zero, iWealthyWithdrawalPlan:plan.iWealthyWithdrawalPlan};
  assert.deepEqual(roundtrip(mixed),mixed);
});
test('Explicit empty array is valid; invalid null is rejected rather than reusing stale state', () => {
  const data = serializeIWealthyPlan(plan);
  assert.deepEqual(deserializeIWealthyPlan({...data,iWealthyPausePeriods:[]}).iWealthyPausePeriods,[]);
  assert.throws(()=>deserializeIWealthyPlan({...data,iWealthyPausePeriods:null}));
});
test('Invalid and excessive JSON fails closed', () => {
  const data = serializeIWealthyPlan(plan);
  for(const invalid of [
    {iWealthyWithdrawalPlan:'bad'},
    {iWealthyPausePeriods:Array(201).fill(plan.iWealthyPausePeriods[0])},
    {iWealthyInvestmentReturn:Infinity},
    {iWealthyAdditionalInvestments:[{amount:-1}]},
    {age:1000},
  ]) assert.throws(()=>deserializeIWealthyPlan({...data,...invalid}));
});
test('Parsed arrays are copied to avoid cross-record mutation', () => {
  const data=serializeIWealthyPlan(plan);
  const a=deserializeIWealthyPlan(data);
  a.iWealthyPausePeriods[0].startAge=88;
  assert.equal(data.iWealthyPausePeriods[0].startAge,40);
});
test('Create and overwrite share dataToSave; cross-project overwrite guard exists', () => {
  const s=readFileSync(new URL('../src/components/SaveRecordModal.tsx',import.meta.url),'utf8');
  assert.match(s,/method: 'PUT'[\s\S]*?data: dataToSave/);
  assert.match(s,/method: 'POST'[\s\S]*?data: dataToSave/);
  assert.match(s,/record\.projectName === projectName/);
  for(const route of ['/lthc','/ci','/retire']) assert.ok(s.includes("path.startsWith('"+route+"')"));
});
