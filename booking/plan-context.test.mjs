import test from 'node:test';
import assert from 'node:assert/strict';
import {messageWithPlan} from './plan-context.mjs';

test('selected plan is visible in the guest message',()=>{
  assert.equal(messageWithPlan('', 'Essentiel Plus'), 'Forfait envisagé : Essentiel Plus');
});
test('switching or reopening a plan preserves visitor notes without duplicated context',()=>{
  const initial=messageWithPlan('Je veux promouvoir la rénovation.', 'Essentiel');
  const changed=messageWithPlan(initial,'Essentiel Plus','Essentiel');
  assert.equal(changed,'Forfait envisagé : Essentiel Plus\n\nJe veux promouvoir la rénovation.');
  assert.equal(messageWithPlan(changed,'Essentiel Plus','Essentiel Plus'),changed);
});
test('custom visitor text is never stripped when it differs from the inserted context',()=>{
  assert.equal(messageWithPlan('Mon forfait actuel : autre agence','Essentiel','Essentiel Plus'),'Forfait envisagé : Essentiel\n\nMon forfait actuel : autre agence');
});
test('clearing the selected plan preserves notes, and unrecognized plans are ignored',()=>{
  assert.equal(messageWithPlan('Forfait envisagé : Essentiel\n\nMes notes','','Essentiel'),'Mes notes');
  assert.equal(messageWithPlan('Mes notes','<script>'),'Mes notes');
});
test('English plan context uses the booking language',()=>{
  assert.equal(messageWithPlan('My goals','Essentiel Performance','',true),'Plan of interest : Essentiel Performance\n\nMy goals');
});
