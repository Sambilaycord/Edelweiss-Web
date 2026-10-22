-- =============================================================================
-- Edelweiss: server-side checkout (place_order) + profile role guard
-- =============================================================================
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   (Or, with the Supabase CLI linked to the project: `supabase db push`.)
--
--   The script is idempotent: it only adds missing tables/columns, and uses
--   CREATE OR REPLACE / DROP ... IF EXISTS for functions and triggers, so it is
--   safe to run more than once on an existing database. It runs as a single
--   transaction in the SQL editor; if anything fails, nothing is applied.
--
-- WHAT IT DOES
--   1. Makes sure `orders` / `order_items` exist and have the columns checkout
--      needs (adds any that are missing).
--   2. Creates `public.place_order(...)`, called by the checkout page via
--      supabase.rpc('place_order', ...). It prices items from the DB, checks and
--      decrements stock with row locks, applies the promo code and shipping fee,
--      inserts the order + items and removes the purchased cart rows, atomically.
--   3. Adds a trigger on `profiles` so a user cannot make themselves
--      'shop_owner' (without owning a shop) or 'admin' through the API.
--
-- SCHEMA ASSUMPTIONS (inferred from the client code in src/, no DB dump in repo)
--   carts(id, customer_id -> auth.users.id)
--   cart_items(id, cart_id, product_id, variant_id nullable, quantity)
--   products(id, shop_id, name, price, stock, is_active, image_urls)
--     products.stock for products with variants is the SUM of variant stock
--     (see dashboard/ProductsTab.tsx), so it is decremented in both cases.
--   product_variants(id, product_id, name, price, stock)
--   shops(id, owner_id, name, is_vacation)
--   addresses(id, user_id, receiver_name, phone_number, detailed_address,
--             barangay, city_municipality, province, is_default)
--   profiles(id = auth.users.id, role) with role in
--             'customer' | 'shop_owner' | 'admin' (text or enum; compared as text)
--   orders(id uuid, customer_id, order_number, total_amount, status, created_at)
--     status values used by profile/OrdersTab.tsx: pending_payment, processing,
--     shipped, delivered, return_requested, cancelled.
--   order_items(id, order_id, product_id, quantity, price) where price is the
--     UNIT price at time of purchase.
--   All ids are uuid (the client treats them as strings).
--   If your existing orders table has extra NOT NULL columns without defaults,
--   or a CHECK constraint on status that does not allow 'pending_payment' /
--   'processing', place_order will fail with that constraint's error - adjust
--   the INSERT below or the constraint.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. orders / order_items
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.orders') is null then
    create table public.orders (
      id               uuid primary key default gen_random_uuid(),
      customer_id      uuid not null references auth.users(id) on delete cascade,
      order_number     text not null unique,
      status           text not null default 'pending_payment'
                       check (status in ('pending_payment','processing','shipped',
                                         'delivered','return_requested','cancelled')),
      subtotal         numeric(12,2) not null default 0,
      shipping_fee     numeric(12,2) not null default 0,
      addon_fee        numeric(12,2) not null default 0,
      discount         numeric(12,2) not null default 0,
      total_amount     numeric(12,2) not null default 0,
      promo_code       text,
      payment_method   text,
      address_id       uuid,
      shipping_address jsonb,
      gift_message     text,
      gift_message_type text,
      created_at       timestamptz not null default now(),
      updated_at       timestamptz not null default now()
    );
    create index orders_customer_status_idx on public.orders (customer_id, status, created_at desc);

    alter table public.orders enable row level security;
    create policy "Customers can read their own orders"
      on public.orders for select to authenticated
      using (customer_id = auth.uid());
    -- No insert/update/delete policies: orders are created only through place_order().
  end if;

  if to_regclass('public.order_items') is null then
    create table public.order_items (
      id          uuid primary key default gen_random_uuid(),
      order_id    uuid not null references public.orders(id) on delete cascade,
      product_id  uuid references public.products(id) on delete set null,
      variant_id  uuid references public.product_variants(id) on delete set null,
      shop_id     uuid references public.shops(id) on delete set null,
      product_name text,
      variant_name text,
      quantity    integer not null check (quantity > 0),
      price       numeric(12,2) not null,   -- unit price at time of purchase
      created_at  timestamptz not null default now()
    );
    create index order_items_order_idx on public.order_items (order_id);
    create index order_items_shop_idx on public.order_items (shop_id);

    alter table public.order_items enable row level security;
    create policy "Customers can read items of their own orders"
      on public.order_items for select to authenticated
      using (exists (select 1 from public.orders o
                     where o.id = order_items.order_id and o.customer_id = auth.uid()));
    -- Sellers seeing their shop's order items is not set up here (no seller orders UI yet).
  end if;
end
$$;

-- Columns place_order writes, for databases where the tables already existed.
-- (Added without NOT NULL / FKs so they never fail on existing rows.)
alter table public.orders add column if not exists customer_id       uuid;
alter table public.orders add column if not exists order_number      text;
alter table public.orders add column if not exists status            text default 'pending_payment';
alter table public.orders add column if not exists subtotal          numeric(12,2) default 0;
alter table public.orders add column if not exists shipping_fee      numeric(12,2) default 0;
alter table public.orders add column if not exists addon_fee         numeric(12,2) default 0;
alter table public.orders add column if not exists discount          numeric(12,2) default 0;
alter table public.orders add column if not exists total_amount      numeric(12,2) default 0;
alter table public.orders add column if not exists promo_code        text;
alter table public.orders add column if not exists payment_method    text;
alter table public.orders add column if not exists address_id        uuid;
alter table public.orders add column if not exists shipping_address  jsonb;
alter table public.orders add column if not exists gift_message      text;
alter table public.orders add column if not exists gift_message_type text;
alter table public.orders add column if not exists created_at        timestamptz default now();
alter table public.orders add column if not exists updated_at        timestamptz default now();

alter table public.order_items add column if not exists order_id     uuid;
alter table public.order_items add column if not exists product_id   uuid;
alter table public.order_items add column if not exists variant_id   uuid;
alter table public.order_items add column if not exists shop_id      uuid;
alter table public.order_items add column if not exists product_name text;
alter table public.order_items add column if not exists variant_name text;
alter table public.order_items add column if not exists quantity     integer;
alter table public.order_items add column if not exists price        numeric(12,2);
alter table public.order_items add column if not exists created_at   timestamptz default now();

-- -----------------------------------------------------------------------------
-- 2. place_order
-- -----------------------------------------------------------------------------
-- Mirrors the client pricing in CheckoutPage.tsx:
--   shipping      = 50 (flat, per checkout)
--   envelope card = +10 when p_message_type = 'envelope'
--   promo         = 'EDELWEISS2026' (case-insensitive) -> 100 off
--   total         = greatest(0, subtotal + shipping + addon - discount)
-- Initial status: 'processing' (To Ship) for cash on delivery, otherwise
-- 'pending_payment' (To Pay), since no online payment is integrated yet.
-- All cart items go into ONE order (the client shows one total and one
-- shipping fee); each order_item records its shop_id.

drop function if exists public.place_order(uuid[], uuid, text, text);
drop function if exists public.place_order(uuid[], uuid, text, text, text, text);

create or replace function public.place_order(
  p_cart_item_ids  uuid[],
  p_address_id     uuid,
  p_payment_method text,
  p_promo_code     text default null,
  p_message        text default null,
  p_message_type   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c_shipping_fee constant numeric := 50;
  c_envelope_fee constant numeric := 10;

  v_uid          uuid := auth.uid();
  v_cart_id      uuid;
  v_address      public.addresses%rowtype;
  v_ids          uuid[];
  v_item         record;
  v_product      record;
  v_variant      record;
  v_unit_price   numeric;
  v_variant_name text;
  v_subtotal     numeric := 0;
  v_addon_fee    numeric := 0;
  v_discount     numeric := 0;
  v_promo        text;
  v_message      text;
  v_order_id     uuid;
  v_order_number text;
  v_found        int;
  v_lines        jsonb := '[]'::jsonb;
  v_line         jsonb;
begin
  if v_uid is null then
    raise exception 'You must be signed in to place an order.' using errcode = '28000';
  end if;

  -- De-duplicate and validate the requested cart item ids
  select coalesce(array_agg(distinct x), '{}') into v_ids
  from unnest(coalesce(p_cart_item_ids, '{}')) as x
  where x is not null;

  if cardinality(v_ids) = 0 then
    raise exception 'Your order has no items.' using errcode = 'P0001';
  end if;

  if p_payment_method is null or p_payment_method not in ('cod', 'gcash') then
    raise exception 'Please choose a valid payment method.' using errcode = 'P0001';
  end if;

  -- Caller's cart
  select id into v_cart_id from public.carts where customer_id = v_uid limit 1;
  if v_cart_id is null then
    raise exception 'Your cart is empty.' using errcode = 'P0001';
  end if;

  -- Delivery address (must belong to the caller); snapshot it on the order
  select * into v_address from public.addresses where id = p_address_id and user_id = v_uid;
  if not found then
    raise exception 'Please select a valid delivery address.' using errcode = 'P0001';
  end if;

  -- Lock the cart rows so a concurrent checkout of the same items can't double-order
  select count(*) into v_found
  from (
    select 1 from public.cart_items
    where id = any(v_ids) and cart_id = v_cart_id
    for update
  ) locked;
  if v_found <> cardinality(v_ids) then
    raise exception 'Some items are no longer in your cart. Please review your cart and try again.'
      using errcode = 'P0001';
  end if;

  -- Price, check and decrement stock. Rows are visited in product/variant order so
  -- concurrent orders lock rows in the same order (avoids deadlocks).
  for v_item in
    select ci.id, ci.product_id, ci.variant_id, ci.quantity
    from public.cart_items ci
    where ci.id = any(v_ids) and ci.cart_id = v_cart_id
    order by ci.product_id, ci.variant_id nulls first
  loop
    if v_item.quantity is null or v_item.quantity < 1 then
      raise exception 'Invalid quantity in cart.' using errcode = 'P0001';
    end if;

    select p.id, p.name, p.price, p.stock, p.is_active, p.shop_id
      into v_product
    from public.products p
    where p.id = v_item.product_id
    for update;

    if not found or v_product.is_active is false then
      raise exception 'A product in your cart is no longer available.' using errcode = 'P0001';
    end if;

    if exists (select 1 from public.shops s where s.id = v_product.shop_id and s.is_vacation is true) then
      raise exception '"%" is from a shop that is currently on vacation.', v_product.name
        using errcode = 'P0001';
    end if;

    v_variant_name := null;

    if v_item.variant_id is not null then
      select v.id, v.name, v.price, v.stock
        into v_variant
      from public.product_variants v
      where v.id = v_item.variant_id and v.product_id = v_item.product_id
      for update;

      if not found then
        raise exception 'The selected option for "%" is no longer available.', v_product.name
          using errcode = 'P0001';
      end if;

      v_variant_name := v_variant.name;

      -- NULL stock = untracked (the cart page treats it as unlimited)
      if v_variant.stock is not null and v_variant.stock < v_item.quantity then
        raise exception 'Not enough stock for "%" (%): only % left.',
          v_product.name, v_variant.name, greatest(coalesce(v_variant.stock, 0), 0)
          using errcode = 'P0001';
      end if;

      v_unit_price := coalesce(v_variant.price, v_product.price);

      update public.product_variants
        set stock = stock - v_item.quantity
      where id = v_variant.id and stock is not null;

      -- products.stock holds the total across variants; keep it in sync
      update public.products
        set stock = greatest(stock - v_item.quantity, 0)
      where id = v_product.id and stock is not null;
    else
      if v_product.stock is not null and v_product.stock < v_item.quantity then
        raise exception 'Not enough stock for "%": only % left.',
          v_product.name, greatest(coalesce(v_product.stock, 0), 0)
          using errcode = 'P0001';
      end if;

      v_unit_price := v_product.price;

      update public.products
        set stock = stock - v_item.quantity
      where id = v_product.id and stock is not null;
    end if;

    if v_unit_price is null or v_unit_price < 0 then
      raise exception '"%" has no valid price.', v_product.name using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + v_unit_price * v_item.quantity;

    v_lines := v_lines || jsonb_build_object(
      'product_id',   v_product.id,
      'variant_id',   v_item.variant_id,
      'shop_id',      v_product.shop_id,
      'product_name', v_product.name,
      'variant_name', v_variant_name,
      'quantity',     v_item.quantity,
      'price',        v_unit_price
    );
  end loop;

  -- Gift message / envelope add-on
  v_message := nullif(left(btrim(coalesce(p_message, '')), 100), '');
  if p_message_type = 'envelope' then
    v_addon_fee := c_envelope_fee;
  end if;

  -- Promo code (mirror of the client mock)
  v_promo := nullif(upper(btrim(coalesce(p_promo_code, ''))), '');
  if v_promo is not null then
    if v_promo = 'EDELWEISS2026' then
      v_discount := 100;
    else
      raise exception 'Invalid promo code.' using errcode = 'P0001';
    end if;
  end if;

  -- Unique, human-readable order number, e.g. EDW-20261022-7F3A9C
  loop
    v_order_number := 'EDW-' || to_char(now() at time zone 'Asia/Manila', 'YYYYMMDD') || '-'
                      || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = v_order_number);
  end loop;

  insert into public.orders (
    customer_id, order_number, status, subtotal, shipping_fee, addon_fee, discount,
    total_amount, promo_code, payment_method, address_id, shipping_address,
    gift_message, gift_message_type
  ) values (
    v_uid,
    v_order_number,
    case when p_payment_method = 'cod' then 'processing' else 'pending_payment' end,
    v_subtotal,
    c_shipping_fee,
    v_addon_fee,
    v_discount,
    greatest(v_subtotal + c_shipping_fee + v_addon_fee - v_discount, 0),
    v_promo,
    p_payment_method,
    v_address.id,
    to_jsonb(v_address) - 'user_id',
    v_message,
    case when p_message_type in ('free', 'envelope') then p_message_type end
  )
  returning id into v_order_id;

  for v_line in select * from jsonb_array_elements(v_lines)
  loop
    insert into public.order_items (
      order_id, product_id, variant_id, shop_id, product_name, variant_name, quantity, price
    ) values (
      v_order_id,
      (v_line->>'product_id')::uuid,
      (v_line->>'variant_id')::uuid,
      (v_line->>'shop_id')::uuid,
      v_line->>'product_name',
      v_line->>'variant_name',
      (v_line->>'quantity')::int,
      (v_line->>'price')::numeric
    );
  end loop;

  delete from public.cart_items where id = any(v_ids) and cart_id = v_cart_id;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(uuid[], uuid, text, text, text, text) from public;
revoke all on function public.place_order(uuid[], uuid, text, text, text, text) from anon;
grant execute on function public.place_order(uuid[], uuid, text, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Role guard on profiles
-- -----------------------------------------------------------------------------
-- Client flows this stays compatible with:
--   * SellerRegistration / SellerOnboardingTab: insert into shops first, then
--     update profiles.role = 'shop_owner'  -> allowed (a shop exists).
--   * SettingsTab shop delete: delete shop, then role = 'customer' -> allowed.
--   * ProfilePage upsert does not send role -> trigger does not fire on update.
-- Only enforced for API callers (JWT role 'authenticated' or 'anon'). The
-- service role, the SQL editor and other backend roles are not restricted.

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
  v_new_role text := new.role::text;
begin
  -- Backend / service-role / SQL editor: no restriction
  if v_jwt_role is null or v_jwt_role not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.role is not distinct from old.role then
    return new;
  end if;

  if v_new_role is null or v_new_role = 'customer' then
    return new;
  end if;

  if v_new_role = 'shop_owner' then
    if exists (select 1 from public.shops s where s.owner_id = new.id) then
      return new;
    end if;
    raise exception 'You need to register a shop before becoming a shop owner.'
      using errcode = '42501';
  end if;

  -- 'admin' or any other role can only be granted from the backend
  raise exception 'You are not allowed to set this role.' using errcode = '42501';
end;
$$;

revoke all on function public.guard_profile_role() from public, anon, authenticated;

drop trigger if exists guard_profile_role_trigger on public.profiles;
create trigger guard_profile_role_trigger
  before insert or update of role on public.profiles
  for each row execute function public.guard_profile_role();
