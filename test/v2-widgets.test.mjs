import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { DEFAULT_WIDGET_LAYOUT, WIDGET_CATALOG, WidgetLayoutEditor, createWidgetRepository, normalizeWidgetLayout, widgetById } from '../versions/v2/widgets.js';

test('V0.1 widget catalog keeps legacy modules and adds core dashboard directions',()=>{
  const ids=WIDGET_CATALOG.map(item=>item.id);
  for(const id of ['finance','tasks','calendar','relationships','earnings','media']) assert.ok(ids.includes(id),id);
  assert.equal(widgetById('finance').route,'widgets.finance');
  assert.equal(widgetById('finance').legacyRoute,'fin');
  assert.equal(widgetById('finance').dataSource,'user_data.finance');
  assert.equal(widgetById('finance').category,'finance');
  assert.equal(widgetById('tasks').route,'schedule.today');
  assert.equal(widgetById('calendar').route,'schedule.today');
  assert.equal(widgetById('tasks').dataSource,'user_data.schedules + events');
  assert.equal(widgetById('calendar').dataSource,'user_data.schedules + events');
  assert.equal(DEFAULT_WIDGET_LAYOUT.length,WIDGET_CATALOG.length);
  assert.deepEqual(DEFAULT_WIDGET_LAYOUT.filter(item=>!item.hidden).map(item=>item.widgetId),['finance','tasks','calendar']);
});

test('editor performs reorder, resize, hide, restore, reset and cancel',()=>{
  const editor=new WidgetLayoutEditor();
  assert.equal(editor.dirty,false);
  editor.move('calendar',-1);assert.deepEqual(editor.visible().map(item=>item.widgetId),['finance','calendar','tasks']);
  const before=editor.draft.find(item=>item.widgetId==='finance').size;editor.resize('finance');assert.notEqual(editor.draft.find(item=>item.widgetId==='finance').size,before);
  editor.hide('finance');assert.ok(editor.hidden().some(item=>item.widgetId==='finance'));editor.restore('finance');assert.ok(editor.visible().some(item=>item.widgetId==='finance'));
  assert.equal(editor.dirty,true);editor.cancel();assert.equal(editor.dirty,false);editor.hide('finance');editor.reset();assert.deepEqual(editor.visible().map(item=>item.widgetId),['finance','tasks','calendar']);
});

test('normalizer rejects unknown widgets and invalid sizes',()=>{
  const layout=normalizeWidgetLayout({items:[{widgetId:'contacts',order:9,size:'giant'},{widgetId:'forged',order:0,size:'large'}]});
  assert.equal(layout.length,WIDGET_CATALOG.length);assert.equal(layout.some(item=>item.widgetId==='forged'),false);assert.equal(layout.find(item=>item.widgetId==='contacts').size,'small');
});

test('repository is fail-closed, uses V0.1 defaults without adapter and requires confirmed save',async()=>{
  const repository=createWidgetRepository(),layout=await repository.load({uid:'42'});assert.equal(repository.capabilities.writes,false);
  assert.deepEqual(layout.filter(item=>!item.hidden).map(item=>item.widgetId),['finance','tasks','calendar']);
  await assert.rejects(repository.save({uid:'42'},layout),error=>error.code==='widget-writes-disabled');
  const unconfirmed=createWidgetRepository({load:async()=>({}),save:async()=>({confirmed:false})});
  await assert.rejects(unconfirmed.save({uid:'42'},layout),error=>error.code==='widget-write-unconfirmed');
});

test('widget module contains no local or physical persistence',async()=>{
  const source=await readFile(new URL('../versions/v2/widgets.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|\.collection\(/);
});


test('V0.1 dashboard exposes direction filters without persisting filter state',async()=>{
  const source=await readFile(new URL('../versions/v2/app.js',import.meta.url),'utf8');
  for(const id of ['all','finance','tasks','calendar','relationships','earnings'])assert.match(source,new RegExp(`id:'${id}'`));
  assert.match(source,/data-widget-filter/);
});
