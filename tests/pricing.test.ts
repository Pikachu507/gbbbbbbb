import {test} from 'node:test';import assert from 'node:assert/strict';import {itemKey,productTotal,eur,slug} from '../lib/format';
test('A personalização custa exatamente 5,00 € por unidade',()=>{assert.equal(productTotal(2500,1,false),2500);assert.equal(productTotal(2500,1,true),3000);assert.equal(productTotal(2500,2,true),6000)});
test('Personalizações diferentes ficam separadas no carrinho',()=>{assert.notEqual(itemKey('var1','M',true,'Ronaldo','7'),itemKey('var1','M',true,'Pepe','3'));assert.notEqual(itemKey('var1','M',false,'',''),itemKey('var1','M',true,'',''))});
test('Preço com euros formatados para Portugal',()=>{assert.match(eur(3000),/30,00/)});
test('Slugs sem acentos',()=>{assert.equal(slug('Atlético de Madrid · Principal'),'atletico-de-madrid-principal')});
