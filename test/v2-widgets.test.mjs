import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { DEFAULT_WIDGET_LAYOUT, WIDGET_CATALOG, WidgetLayoutEditor, createWidgetRepository, normalizeWidgetLayout, widgetById } from '../versions/v2/widgets.js';

test('approved widget catalog contains nine modules including Media',()=>{
  assert.deepEqual(WIDGET_CATALOG.map(item=>item.id),['mind','contacts','finance','habits','health','events','notes','media','quickActions']);
  assert.equal(widgetById('media').title,'Медиа');assert.equal(DEFAULT_WIDGET_LAYOUT.length,9);
});

test('editor performs reorder, resize, hide, restore, reset and cancel',()=>{
  const editor=new WidgetLayoutEditor();
  assert.equal(editor.dirty,false);editor.move('contacts',-1);assert.equal(editor.visible()[0].widgetId,'contacts');
  const before=editor.draft.find(item=>item.widgetId==='contacts').size;editor.resize('contacts');assert.notEqual(editor.draft.find(item=>item.widgetId==='contacts').size,before);
  editor.hide('media');assert.equal(editor.hidden()[0].widgetId,'media');editor.restore('media');assert.equal(editor.hidden().length,0);
  assert.equal(editor.dirty,true);editor.cancel();assert.equal(editor.dirty,false);editor.hide('contacts');editor.reset();assert.equal(editor.hidden().length,0);
});

test('normalizer rejects unknown widgets and invalid sizes',()=>{
  const layout=normalizeWidgetLayout({items:[{widgetId:'contacts',order:9,size:'giant'},{widgetId:'forged',order:0,size:'large'}]});
  assert.equal(layout.length,9);assert.equal(layout.some(item=>item.widgetId==='forged'),false);assert.equal(layout.find(item=>item.widgetId==='contacts').size,'small');
});

test('repository is fail-closed and requires confirmed save',async()=>{
  const repository=createWidgetRepository(),layout=await repository.load({uid:'42'});assert.equal(repository.capabilities.writes,false);
  await assert.rejects(repository.save({uid:'42'},layout),error=>error.code==='widget-writes-disabled');
  const unconfirmed=createWidgetRepository({load:async()=>({}),save:async()=>({confirmed:false})});
  await assert.rejects(unconfirmed.save({uid:'42'},layout),error=>error.code==='widget-write-unconfirmed');
});

test('widget module contains no local or physical persistence',async()=>{
  const source=await readFile(new URL('../versions/v2/widgets.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|\.collection\(/);
});
