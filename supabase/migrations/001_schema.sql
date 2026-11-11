-- GOAL DISTRICT · Executar no Supabase SQL Editor, uma vez, num projeto novo.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', phone text default '', role text not null default 'customer' check(role in('customer','admin')),
 created_at timestamptz not null default now()
);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict do nothing;return new;end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.addresses (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 label text default 'Casa', full_name text not null,street text not null,postal_code text not null,city text not null,region text not null,phone text default '',is_default boolean default false
);
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), slug text not null unique,name text not null,team text not null,league text not null,
 category text not null,season text not null default 'Por confirmar',kind text not null default 'Principal',
 description text,price_cents integer check(price_cents>0),sale_price_cents integer check(sale_price_cents>0),
 image_urls text[] not null default '{}', status text not null default 'draft' check(status in('draft','published')),
 verified boolean not null default false, featured boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint publish_guard check(status='draft' or (verified and price_cents is not null and cardinality(image_urls)>0))
);
create index if not exists products_filters on public.products(category,status,verified);
create index if not exists products_search on public.products using gin (to_tsvector('simple',name || ' ' || team || ' ' || league));
create table if not exists public.product_variants (
 id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id) on delete cascade,
 size text not null,sku text unique not null,stock integer not null default 0 check(stock>=0),unique(product_id,size)
);
create table if not exists public.favorites (
 user_id uuid not null references auth.users(id) on delete cascade,product_id uuid not null references public.products(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(user_id,product_id)
);
create table if not exists public.cart_items (
 user_id uuid not null references auth.users(id) on delete cascade,cart_key text not null,payload jsonb not null,
 updated_at timestamptz not null default now(),primary key(user_id,cart_key)
);
create table if not exists public.coupons (
 id uuid primary key default gen_random_uuid(),code text not null unique, discount_type text not null check(discount_type in('percent','fixed')),
 value integer not null check(value>0),min_order_cents integer not null default 0,max_uses integer,
 uses integer not null default 0 check(uses>=0),ends_at timestamptz,active boolean not null default true
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),public_number text not null unique default ('GD-'||upper(substr(encode(gen_random_bytes(7),'hex'),1,10))),
 user_id uuid references auth.users(id) on delete set null,email text not null,
 shipping jsonb not null,shipping_region text not null check(shipping_region in('continente','acores','madeira')),
 subtotal_cents integer not null,shipping_cents integer not null,discount_cents integer not null default 0,total_cents integer not null,
 coupon_code text,payment_status text not null default 'pending' check(payment_status in('pending','paid','failed','cancelled','refunded')),
 order_status text not null default 'awaiting_payment' check(order_status in('awaiting_payment','confirmed','preparing','shipped','delivered','cancelled','refunded')),
 stripe_session_id text unique,tracking_code text,created_at timestamptz not null default now()
);
create index if not exists orders_owner on public.orders(user_id,created_at desc);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,
 product_id uuid references public.products(id) on delete set null,variant_id uuid references public.product_variants(id) on delete set null,
 product_name text not null,image_url text,sku text not null,size text not null,quantity int not null check(quantity>0),
 unit_price_cents int not null,personalized boolean not null default false,custom_name text default '',custom_number text default '',line_total_cents int not null
);
create table if not exists public.banners (
 id uuid primary key default gen_random_uuid(),title text not null,subtitle text default '',image_url text,button_text text default 'Ver coleção',button_url text default '/loja',position int default 0,active boolean default true
);
create table if not exists public.site_settings (
 key text primary key,value jsonb not null,updated_at timestamptz not null default now()
);
insert into public.site_settings(key,value) values
 ('shipping_rates','{}'::jsonb),('buy5pay4_enabled','true'::jsonb),('category_images','{}'::jsonb),('promo_text','"LEVA 5 PAGA 4"'::jsonb),('contact_email','"suporte.goaldistrict@gmail.com"'::jsonb),
 ('legal','{"company_name":"","nif":"","address":"","returns_policy":"","privacy_policy":""}'::jsonb)
on conflict(key) do nothing;
create table if not exists public.admin_audit (
 id bigint generated always as identity primary key,admin_id uuid references auth.users(id) on delete set null,
 action text not null,entity_id text,details jsonb,created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.favorites enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.banners enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_audit enable row level security;
create policy "my profile" on public.profiles for select using(auth.uid()=id);
create policy "update my profile" on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
-- Role protection: clients cannot grant themselves admin status.
revoke update(role) on public.profiles from anon,authenticated;
create policy "my addresses" on public.addresses for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "published products" on public.products for select using(status='published' and verified=true);
create policy "public variant stock" on public.product_variants for select using(exists(select 1 from public.products p where p.id=product_id and p.status='published' and p.verified));
create policy "my favorites" on public.favorites for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "my cart" on public.cart_items for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "my orders" on public.orders for select using(auth.uid()=user_id);
create policy "my items" on public.order_items for select using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create policy "public banners" on public.banners for select using(active=true);
create policy "public promo settings" on public.site_settings for select using(key in('promo_text','contact_email'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy "Public photos" on storage.objects for select using(bucket_id='product-images');

-- Atomic reservation: every input price is ignored; DB reads authoritative prices and stock.
create or replace function public.create_order_and_reserve(
 p_user_id uuid,p_email text,p_shipping jsonb,p_region text,p_items jsonb,p_coupon text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 v_id uuid; v_item jsonb;v_variant record;v_price integer;v_qty integer;v_extra integer;v_line integer;
 v_subtotal integer:=0;v_shipping integer;v_discount integer:=0;v_code text;v_coupon record;
 v_rates jsonb;v_count integer:=0;v_line_items jsonb:='[]'::jsonb;v_total integer;v_public text;v_unit_prices integer[]:='{}';v_n integer;v_auto boolean:=false;v_coupon_discount integer:=0;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Not allowed';end if;
 if p_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(p_email)>255 then raise exception 'Invalid email';end if;
 if p_region not in ('continente','acores','madeira') then raise exception 'Invalid shipping region';end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid basket';end if;
 select value into v_rates from public.site_settings where key='shipping_rates';
 if not (v_rates ? p_region) or (v_rates->>p_region) is null then raise exception 'Shipping fees not configured';end if;
 v_shipping:=(v_rates->>p_region)::integer;
 if v_shipping<0 or v_shipping>50000 then raise exception 'Invalid shipping fee';end if;
 insert into public.orders(user_id,email,shipping,shipping_region,subtotal_cents,shipping_cents,discount_cents,total_cents)
 values(p_user_id,p_email,p_shipping,p_region,0,0,0,0) returning id,public_number into v_id,v_public;
 for v_item in select value from jsonb_array_elements(p_items) loop
   v_count:=v_count+1;
   v_qty:=(v_item->>'quantity')::integer;
   if v_qty < 1 or v_qty>10 then raise exception 'Invalid quantity';end if;
   select v.*,p.name,p.image_urls,p.price_cents,p.sale_price_cents,p.status,p.verified,p.id as pid
   into v_variant from public.product_variants v join public.products p on p.id=v.product_id
   where v.id=(v_item->>'variantId')::uuid and p.id=(v_item->>'productId')::uuid for update of v;
   if not found or v_variant.status<>'published' or not v_variant.verified or cardinality(v_variant.image_urls)=0 then raise exception 'Product unavailable';end if;
   if v_variant.stock<v_qty then raise exception 'Not enough stock for %',v_variant.name;end if;
   v_price:=coalesce(v_variant.sale_price_cents,v_variant.price_cents);
   if v_price is null or v_price<1 then raise exception 'Price missing';end if;
   v_extra:=case when v_item->>'personalized'='true' then 500 else 0 end;
   if v_extra>0 and (length(coalesce(v_item->>'customName',''))>18 or length(coalesce(v_item->>'customNumber',''))>2) then raise exception 'Invalid personalization';end if;
   v_line:=(v_price+v_extra)*v_qty;
   for v_n in 1..v_qty loop v_unit_prices:=array_append(v_unit_prices,v_price);end loop;
   v_subtotal:=v_subtotal+v_line;
   update public.product_variants set stock=stock-v_qty where id=v_variant.id;
   insert into public.order_items(order_id,product_id,variant_id,product_name,image_url,sku,size,quantity,unit_price_cents,personalized,custom_name,custom_number,line_total_cents)
   values(v_id,v_variant.pid,v_variant.id,v_variant.name,v_variant.image_urls[1],v_variant.sku,v_variant.size,v_qty,v_price,v_extra>0,
   case when v_extra>0 then coalesce(v_item->>'customName','') else '' end,
   case when v_extra>0 then coalesce(v_item->>'customNumber','') else '' end,v_line);
   v_line_items:=v_line_items||jsonb_build_array(jsonb_build_object('name',v_variant.name||' · '||v_variant.size||case when v_extra>0 then ' · Personalizada '||coalesce(v_item->>'customName','')||' '||coalesce(v_item->>'customNumber','') else '' end,'amount',v_price+v_extra,'quantity',v_qty));
 end loop;
 if v_subtotal>1500000 then raise exception 'Order above limit';end if;
 select coalesce((value #>> '{}')::boolean,false) into v_auto from public.site_settings where key='buy5pay4_enabled';
 if v_auto and array_length(v_unit_prices,1)>=5 then
   select coalesce(sum(x),0) into v_discount from (select x from unnest(v_unit_prices) as x order by x limit (array_length(v_unit_prices,1)/5)) cheapest;
 end if;
 v_code:=upper(trim(coalesce(p_coupon,'')));
 if v_code<>'' then
  select * into v_coupon from public.coupons where code=v_code and active=true and (ends_at is null or ends_at>now()) for update;
  if not found then raise exception 'Coupon not valid';end if;
  if v_coupon.max_uses is not null and v_coupon.uses>=v_coupon.max_uses then raise exception 'Coupon exhausted';end if;
  if v_subtotal<v_coupon.min_order_cents then raise exception 'Coupon minimum not reached';end if;
  if v_coupon.discount_type='percent' then
    v_coupon_discount:=(v_subtotal*least(v_coupon.value,100))/100;
  else v_coupon_discount:=least(v_subtotal,v_coupon.value);end if;
  v_discount:=least(v_subtotal,v_discount+v_coupon_discount);
  update public.coupons set uses=uses+1 where id=v_coupon.id;
 end if;
 v_total:=v_subtotal+v_shipping-v_discount;
 if v_total<50 then raise exception 'Invalid order amount';end if;
 update public.orders set subtotal_cents=v_subtotal,shipping_cents=v_shipping,discount_cents=v_discount,total_cents=v_total,coupon_code=nullif(v_code,'') where id=v_id;
 return jsonb_build_object('orderId',v_id,'number',v_public,'total',v_total,'shipping',v_shipping,'discount',v_discount,'lines',v_line_items);
end $$;

create or replace function public.finalize_order(p_id uuid,p_action text) returns boolean language plpgsql security definer set search_path=public as $$
declare v_order record;v_item record;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Not allowed';end if;
 select * into v_order from public.orders where id=p_id for update;
 if not found then raise exception 'Order not found';end if;
 if p_action='paid' then
  if v_order.payment_status='pending' then update public.orders set payment_status='paid',order_status='confirmed' where id=p_id;return true;end if;
 elsif p_action in('cancelled','failed') then
  if v_order.payment_status='pending' then
   update public.orders set payment_status=p_action,order_status='cancelled' where id=p_id;
   for v_item in select * from public.order_items where order_id=p_id loop
    update public.product_variants set stock=stock+v_item.quantity where id=v_item.variant_id;
   end loop;
   if v_order.coupon_code is not null then update public.coupons set uses=greatest(0,uses-1) where code=v_order.coupon_code;end if;
   return true;
  end if;
 elsif p_action='refunded' then
  if v_order.payment_status='paid' then update public.orders set payment_status='refunded',order_status='refunded' where id=p_id;return true;end if;
 else raise exception 'Invalid action';end if;
 return false;
end $$;
revoke all on function public.create_order_and_reserve(uuid,text,jsonb,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_order_and_reserve(uuid,text,jsonb,text,jsonb,text) to service_role;
revoke all on function public.finalize_order(uuid,text) from public,anon,authenticated;
grant execute on function public.finalize_order(uuid,text) to service_role;

-- Defense in depth for role changes: standard profile edits must not escalate access.
create or replace function public.keep_profile_role() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.role() is distinct from 'service_role' and session_user <> 'postgres' and new.role is distinct from old.role then raise exception 'Role cannot be changed';end if;
 return new;
end $$;
drop trigger if exists profile_role_guard on public.profiles;
create trigger profile_role_guard before update on public.profiles for each row execute function public.keep_profile_role();
