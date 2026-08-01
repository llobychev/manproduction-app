export const WIDGET_CATALOG = Object.freeze([
  Object.freeze({id:'mind',title:'Разум',icon:'🧠',description:'Дневники, цели и мышление',route:'widgets.mind',sizes:['medium','large']}),
  Object.freeze({id:'contacts',title:'Контакты',icon:'🤝',description:'Люди, связи и заметки',route:'widgets.contacts',sizes:['small','medium','large']}),
  Object.freeze({id:'finance',title:'Финансы',icon:'💰',description:'Доходы, расходы и цели',route:'widgets.finance',sizes:['small','medium','large']}),
  Object.freeze({id:'habits',title:'Привычки',icon:'✅',description:'Ритм и ежедневные действия',route:'widgets.habits',sizes:['small','medium']}),
  Object.freeze({id:'health',title:'Здоровье',icon:'❤️',description:'Самочувствие, сон и активность',route:'widgets.health',sizes:['small','medium']}),
  Object.freeze({id:'events',title:'Мероприятия',icon:'🗓️',description:'Клубные события и записи',route:'widgets.events',sizes:['small','medium']}),
  Object.freeze({id:'notes',title:'Заметки',icon:'📝',description:'Короткие мысли и идеи',route:'widgets.notes',sizes:['small','medium','large']}),
  Object.freeze({id:'media',title:'Медиа',icon:'🎬',description:'Сохранённые материалы',route:'widgets.media',sizes:['small','medium','large']}),
  Object.freeze({id:'quickActions',title:'Быстрые действия',icon:'⚡',description:'Переходы к частым действиям',route:'widgets.quickActions',sizes:['medium','large']})
]);

export const DEFAULT_WIDGET_LAYOUT = Object.freeze(WIDGET_CATALOG.map((widget,index)=>Object.freeze({widgetId:widget.id,order:index,size:widget.sizes[0],hidden:false,settingsVersion:1})));

const catalogById=new Map(WIDGET_CATALOG.map(item=>[item.id,item]));
const clone=layout=>layout.map(item=>({...item}));
const signature=layout=>JSON.stringify(layout.map(({widgetId,order,size,hidden})=>({widgetId,order,size,hidden})));

export function normalizeWidgetLayout(value){
  const supplied=new Map((Array.isArray(value?.items)?value.items:[]).filter(item=>catalogById.has(item?.widgetId)).map(item=>[item.widgetId,item]));
  return WIDGET_CATALOG.map((widget,index)=>{
    const item=supplied.get(widget.id)||DEFAULT_WIDGET_LAYOUT[index];
    return {widgetId:widget.id,order:Number.isFinite(Number(item.order))?Number(item.order):index,size:widget.sizes.includes(item.size)?item.size:widget.sizes[0],hidden:Boolean(item.hidden),settingsVersion:1};
  }).sort((a,b)=>a.order-b.order).map((item,index)=>({...item,order:index}));
}

export class WidgetLayoutEditor{
  constructor(layout=DEFAULT_WIDGET_LAYOUT){this.saved=normalizeWidgetLayout({items:layout});this.draft=clone(this.saved);}
  get dirty(){return signature(this.saved)!==signature(this.draft);}
  visible(){return this.draft.filter(item=>!item.hidden);}
  hidden(){return this.draft.filter(item=>item.hidden);}
  move(widgetId,direction){const visible=this.visible(),from=visible.findIndex(item=>item.widgetId===widgetId),to=from+direction;if(from<0||to<0||to>=visible.length)return false;const a=this.draft.indexOf(visible[from]),b=this.draft.indexOf(visible[to]);[this.draft[a],this.draft[b]]=[this.draft[b],this.draft[a]];this.reorder();return true;}
  resize(widgetId){const item=this.draft.find(value=>value.widgetId===widgetId),widget=catalogById.get(widgetId);if(!item||!widget)return false;item.size=widget.sizes[(widget.sizes.indexOf(item.size)+1)%widget.sizes.length];return true;}
  hide(widgetId){const item=this.draft.find(value=>value.widgetId===widgetId);if(!item)return false;item.hidden=true;return true;}
  restore(widgetId){const item=this.draft.find(value=>value.widgetId===widgetId);if(!item)return false;item.hidden=false;this.reorder();return true;}
  reset(){this.draft=clone(DEFAULT_WIDGET_LAYOUT);return true;}
  cancel(){this.draft=clone(this.saved);}
  accept(layout=this.draft){this.saved=normalizeWidgetLayout({items:layout});this.draft=clone(this.saved);}
  reorder(){this.draft.forEach((item,index)=>{item.order=index;});}
}

export function createWidgetRepository(adapter=null){
  const reads=typeof adapter?.load==='function',writes=reads&&typeof adapter?.save==='function';
  return Object.freeze({capabilities:Object.freeze({reads,writes}),async load(context){return normalizeWidgetLayout(reads?await adapter.load(context):{});},async save(context,layout){if(!writes)throw Object.assign(new Error('Widget layout requires approved Firestore schema and Rules'),{code:'widget-writes-disabled'});const result=await adapter.save({...context,layoutVersion:1,items:normalizeWidgetLayout({items:layout})});if(!result?.confirmed||!result.layout)throw Object.assign(new Error('Widget layout was not confirmed'),{code:'widget-write-unconfirmed'});return normalizeWidgetLayout(result.layout);}});
}

export function widgetById(widgetId){return catalogById.get(widgetId)||null;}
