-- Phase 2: Schema Enhancements for Subscription Cancellation Flow

-- 🔹 Indexes for faster lookups
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_cancellations_user on public.cancellations(user_id);

-- 🔹 Allow users to update their own cancellation row (e.g., set reason / downsell response)
create policy if not exists "Users can update own cancellations"
on public.cancellations
for update
using (auth.uid() = user_id);

-- 🔹 Optional: allow free-text details for "Other" reason
alter table public.cancellations
  add column if not exists reason_details text;

-- 🔹 Auto-update timestamp when subscriptions change
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.subscriptions;
create trigger set_updated_at
before update on public.subscriptions
for each row
execute function update_updated_at_column();
