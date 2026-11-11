export type Product = {
  id:string; slug:string; name:string; team:string; league:string; season:string;
  category:string; kind:string; price_cents:number|null; sale_price_cents:number|null;
  image_urls:string[]; status:'draft'|'published'; verified:boolean; featured:boolean;
  description:string|null; created_at?:string; variants?:Variant[];
};
export type Variant = {id:string;product_id:string;size:string;sku:string;stock:number};
export type CartItem = {key:string;productId:string;variantId:string;slug:string;name:string;image?:string;size:string;quantity:number;unitPrice:number;personalized:boolean;customName:string;customNumber:string};
export type Order = {id:string;public_number:string;email:string;user_id:string|null;shipping:Record<string,string>;shipping_region:string;subtotal_cents:number;shipping_cents:number;discount_cents:number;total_cents:number;payment_status:string;order_status:string;stripe_session_id:string|null;created_at:string;order_items?:Record<string,unknown>[]};
export type ShippingRegion = 'continente'|'acores'|'madeira';
