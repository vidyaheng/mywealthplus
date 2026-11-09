// node --experimental-strip-types --test tests/iWealthyRecord.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { serializeIWealthyPlan, deserializeIWealthyPlan, parseIWealthyRecordEnvelope, hasMissingIWealthyControls } from '../src/lib/iWealthyRecord.ts';

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

test('UI modal record shapes: pause, reduction, withdrawal, frequency, investment with optional fields', () => {
  const ui = {...plan,
    iWealthyPausePeriods:[{id:'ui-pause',startAge:39,endAge:40,type:'age',isAutoAdjusted:false}],
    iWealthySumInsuredReductions:[{id:'ui-reduce',age:46,newSumInsured:3600000}],
    iWealthyWithdrawalPlan:[{id:'ui-withdraw',type:'single',amount:125000,startAge:57,endAge:57,refType:'age'}],
    iWealthyFrequencyChanges:[{id:'ui-frequency',startAge:42,endAge:44,frequency:'quarterly',type:'age'}],
    iWealthyAdditionalInvestments:[{id:'ui-invest',type:'single',amount:210000,startAge:41,endAge:41,refType:'age'}],
  };
  assert.deepEqual(roundtrip(ui),ui);
  for(const frequency of ['monthly','quarterly','semi-annual','annual']) {
    const changed = {...ui,iWealthyPaymentFrequency:frequency,
      iWealthyFrequencyChanges:[{...ui.iWealthyFrequencyChanges[0],frequency}]};
    assert.deepEqual(roundtrip(changed),changed,frequency);
  }
});
test('historical optional fields and year reference types remain compatible', () => {
  const historical = {...plan,
    iWealthyPausePeriods:[{startAge:45,endAge:47,type:'year',startPolicyYear:12,endPolicyYear:14,isAutoAdjusted:true}],
    iWealthySumInsuredReductions:[{age:52,newSumInsured:2500000}],
    iWealthyFrequencyChanges:[{startAge:48,endAge:50,frequency:'semi-annual'}],
    iWealthyAdditionalInvestments:[{type:'annual',amount:50000,startAge:45,endAge:48}],
  };
  assert.deepEqual(roundtrip(historical),historical);
});
test('server Save/Load envelope preserves record id, name and full plan', () => {
  const saved=JSON.parse(JSON.stringify(serializeIWealthyPlan(plan)));
  const serverRecord={_id:'synthetic-id-a',recordName:'Synthetic A',projectName:'iWealthy',data:saved};
  assert.deepEqual(parseIWealthyRecordEnvelope(serverRecord),{
    plan,activeRecordId:'synthetic-id-a',activeRecordName:'Synthetic A'
  });
  assert.throws(()=>parseIWealthyRecordEnvelope({...serverRecord,projectName:'CI'}));
  assert.throws(()=>parseIWealthyRecordEnvelope({...serverRecord,data:{...saved,iWealthyPausePeriods:null}}));
});
test('legacy metadata triggers overwrite warning; new and explicit empty do not', () => {
  const modern=serializeIWealthyPlan(plan);
  assert.equal(hasMissingIWealthyControls(modern),false);
  assert.equal(hasMissingIWealthyControls({...modern,iWealthyPausePeriods:[]}),false);
  const legacy={age:35,gender:'male',paymentFrequency:'annual',rpp:100000,rtu:0,
    sumInsured:6000000,sumInsuredReductions:[]};
  assert.equal(hasMissingIWealthyControls(legacy),true);
});
test('purple indicators correspond only to five loaded array lengths', () => {
  const restored=roundtrip(plan);
  const flags=['iWealthyPausePeriods','iWealthySumInsuredReductions','iWealthyWithdrawalPlan',
    'iWealthyFrequencyChanges','iWealthyAdditionalInvestments'].map(key=>restored[key].length>0);
  assert.deepEqual(flags,[true,true,true,true,true]);
  const blank=roundtrip({...plan,iWealthyPausePeriods:[],iWealthySumInsuredReductions:[],
    iWealthyWithdrawalPlan:[],iWealthyFrequencyChanges:[],iWealthyAdditionalInvestments:[]});
  assert.deepEqual(flags.map((_,i)=>Object.values(blank).filter(Array.isArray)[i].length>0),
    [false,false,false,false,false]);
});
test('store and modals use shared envelope; overwrite confirms legacy data and guards record project', () => {
  const store=readFileSync(new URL('../src/stores/appStore.ts',import.meta.url),'utf8');
  const save=readFileSync(new URL('../src/components/SaveRecordModal.tsx',import.meta.url),'utf8');
  const load=readFileSync(new URL('../src/components/LoadRecordModal.tsx',import.meta.url),'utf8');
  assert.match(store,/parseIWealthyRecordEnvelope\(fullRecord\)/);
  assert.match(save,/hasMissingIWealthyControls\(existing\.record\.data\)/);
  assert.match(save,/existing\.record\.projectName !== projectName/);
  assert.match(save,/record\.projectName === projectName/);
  assert.match(load,/loadIWealthyState\(data\.record\)/);
  assert.match(load,/data\.record\._id !== record\._id/);
  assert.match(load,/data\.record\.projectName !== record\.projectName/);
});
