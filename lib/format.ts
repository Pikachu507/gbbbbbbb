export const eur=(cents:number)=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(cents/100);
export const slug=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const PRODUCT_KIND=['Principal','Alternativa','Terceira','Retro','Criança','Windbreaker','Casaco','Fato de treino','Conjunto de treino'];
export function itemKey(id:string,size:string,personalized:boolean,name:string,number:string){return [id,size,personalized?'p':'n',name.trim().toUpperCase(),number.trim()].join(':')}
export function productTotal(price:number,qty:number,personalized:boolean){return (price+(personalized?500:0))*qty}
export const navCategories=[
  ['Premier League','premier-league'],['La Liga','la-liga'],['Liga Portugal','liga-portugal'],['Serie A','serie-a'],['Bundesliga','bundesliga'],['Ligue 1','ligue-1'],['Eredivisie','eredivisie'],['Scottish Premiership','scottish-premiership'],['Brasileirão','brasileirao'],['Seleções','selecoes'],['Retro','retro'],['Windbreakers','windbreakers'],['Kid Kits','kid-kits'],['Casacos','casacos'],['Fatos de Treino','fatos-de-treino'],['Conjuntos de Treino','conjuntos-de-treino']
];
