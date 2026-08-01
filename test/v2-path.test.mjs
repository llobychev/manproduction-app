import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { PATH_CATALOG, buildPathExperience, chapterStatus, createPathRepository, findChapter, loadPathExperience } from '../versions/v2/path.js';

test('Path preserves five active V1 spheres and fourteen advanced routes',()=>{
  assert.deepEqual(PATH_CATALOG.map(item=>item.id),['body','finance','people','head','meaning']);
  assert.equal(PATH_CATALOG.flatMap(item=>item.paths).length,14);
  assert.equal(PATH_CATALOG.flatMap(item=>item.paths).every(item=>item.chapters.length===8),true);
});

test('sequential unlocking exposes only the first incomplete chapter in each path',()=>{
  const route=PATH_CATALOG[1].paths[0],empty=buildPathExperience();
  assert.equal(chapterStatus(route,0,empty.progress),'available');
  assert.equal(chapterStatus(route,1,empty.progress),'locked');
  const after=buildPathExperience({completedChapterIds:[route.chapters[0].id]});
  assert.equal(chapterStatus(route,0,after.progress),'completed');
  assert.equal(chapterStatus(route,1,after.progress),'available');
  assert.equal(chapterStatus(route,2,after.progress),'locked');
});

test('progress, continuation, history and bookmarks share one source',()=>{
  const first=findChapter('body.energy.1'),model=buildPathExperience({completedChapterIds:[first.chapter.id],bookmarks:['finance.foundation.1'],xp:40});
  assert.equal(model.totalCompleted,1);assert.equal(model.progress.xp,40);
  assert.equal(model.history[0].chapter.id,'body.energy.1');
  assert.equal(model.bookmarked[0].chapter.id,'finance.foundation.1');
  assert.equal(model.continuation.chapter.id,'body.energy.2');
});

test('default Path adapter is read-only and honest',async()=>{
  const repository=createPathRepository(),model=await loadPathExperience(repository,{uid:'42'});
  assert.equal(model.status,'ready');assert.equal(model.capabilities.reads,false);assert.equal(model.capabilities.writes,false);
  await assert.rejects(repository.complete({chapterId:'body.energy.1'},model.progress),error=>error.code==='path-writes-disabled');
});

test('completion requires authoritative state and deduplicates an already completed chapter',async()=>{
  let calls=0;
  const repository=createPathRepository({load:async()=>({}),toggleBookmark:async()=>({confirmed:true,progress:{}}),complete:async({chapterId})=>{calls++;return {confirmed:true,reward:40,progress:{completedChapterIds:[chapterId],rewardedChapterIds:[chapterId],xp:40}};}});
  const initial=(await loadPathExperience(repository)).progress;
  const first=await repository.complete({chapterId:'body.energy.1'},initial);
  assert.equal(first.reward,40);assert.equal(calls,1);
  const second=await repository.complete({chapterId:'body.energy.1'},first.progress);
  assert.equal(second.reward,0);assert.equal(second.deduplicated,true);assert.equal(calls,1);
});

test('Path rejects unknown progress identities and contains no physical persistence',async()=>{
  const model=buildPathExperience({completedChapterIds:['forged.chapter'],bookmarks:['forged.chapter']});
  assert.equal(model.totalCompleted,0);assert.equal(model.bookmarked.length,0);
  const source=await readFile(new URL('../versions/v2/path.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\.collection\(|localStorage|sessionStorage|indexedDB/);
});
