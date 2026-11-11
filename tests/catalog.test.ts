import {test} from 'node:test';import assert from 'node:assert/strict';import {sampleProducts} from '../lib/seed';
test('Catálogo tem variedade de ligas e seleções',()=>{assert.ok(sampleProducts.length>=150);assert.ok(sampleProducts.some(p=>p.league==='Liga Portugal'));assert.ok(sampleProducts.some(p=>p.league==='Premier League'));assert.ok(sampleProducts.some(p=>p.category==='selecoes'));assert.ok(sampleProducts.some(p=>p.category==='retro'))});
test('Nenhum artigo por validar aparece como publicado',()=>{assert.ok(sampleProducts.every(p=>p.status==='draft'&&p.verified===false&&p.price_cents===null&&p.image_urls.length===0))});
test('Todos os slugs são únicos',()=>{const ids=sampleProducts.map(p=>p.slug);assert.equal(new Set(ids).size,ids.length)});
